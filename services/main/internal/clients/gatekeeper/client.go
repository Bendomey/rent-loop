package gatekeeper

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"
)

type ClientConfig struct {
	BaseURL   string
	ApiKey    string
	ProjectID string
	Timeout   time.Duration
}

type Client interface {
	GenerateOtp(ctx context.Context, req GenerateOtpInput) (*GenerateOtpResponse, error)
	VerifyOtp(ctx context.Context, req VerifyOtpRequest) (*VerifyOtpResponse, error)
	doRequest(ctx context.Context, method, path string, body, result interface{}) error
}

type gatekeeperClient struct {
	config     ClientConfig
	httpClient *http.Client
}

func NewClient(config ClientConfig) Client {
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}

	return &gatekeeperClient{
		config: config,
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
	}
}

func (c *gatekeeperClient) GenerateOtp(ctx context.Context, req GenerateOtpInput) (*GenerateOtpResponse, error) {
	var response GenerateOtpResponse

	var extra json.RawMessage
	if req.Extra != nil {
		jsonData, err := json.Marshal(req.Extra)
		if err != nil {
			return nil, err
		}

		extra = json.RawMessage(jsonData)
	}

	input := GenerateOtpRequest{
		ProjectID:   c.config.ProjectID,
		PhoneNumber: req.PhoneNumber,
		Email:       req.Email,
		Size:        req.Size,
		Extra:       &extra,
	}

	err := c.doRequest(ctx, http.MethodPost, "/generate_otp", input, &response)
	if err != nil {
		return nil, err
	}

	return &response, nil
}

func (c *gatekeeperClient) VerifyOtp(ctx context.Context, req VerifyOtpRequest) (*VerifyOtpResponse, error) {
	var response VerifyOtpResponse

	err := c.doRequest(ctx, http.MethodPost, "/verify_otp", req, &response)
	if err != nil {
		return nil, err
	}

	return &response, nil
}

func (c *gatekeeperClient) doRequest(ctx context.Context, method, path string, body, result interface{}) error {
	fullURL := fmt.Sprintf("%s%s", c.config.BaseURL, path)

	var bodyReader io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(jsonBody)
	}

	req, err := http.NewRequestWithContext(ctx, method, fullURL, bodyReader)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	if c.config.ApiKey != "" {
		req.Header.Set("X-API-Key", c.config.ApiKey)
	}

	logrus.WithFields(logrus.Fields{
		"method": method,
		"url":    fullURL,
	}).Debug("Making request to gatekeeper service")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	// Handle error responses
	if resp.StatusCode >= 400 {
		var apiResp GatekeeperAPIErrorResponse
		if err := json.Unmarshal(respBody, &apiResp); err != nil {
			return NewGatekeeperAPIError(GatekeeperAPIErrorParams{
				StatusCode: resp.StatusCode,
				Title:      string(respBody),
			})
		}

		return NewGatekeeperAPIError(GatekeeperAPIErrorParams{
			StatusCode:        resp.StatusCode,
			Title:             apiResp.Error,
			Message:           apiResp.Message,
			AttemptsRemaining: apiResp.AttemptsRemaining,
		})
	}

	// Parse successful response
	if result != nil {
		if err := json.Unmarshal(respBody, result); err != nil {
			return fmt.Errorf("failed to unmarshal response: %w", err)
		}
	}

	return nil
}
