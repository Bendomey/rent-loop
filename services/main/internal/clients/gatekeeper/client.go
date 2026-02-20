package gatekeeper

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/sirupsen/logrus"
)

type Client interface {
	// GenerateOtp verifies an OTP using the Gatekeeper service
	//
	// # Usage:
	//
	// go appCtx.Clients.GatekeeperAPI.GenerateOtp(
	// ctx,
	//
	//	GenerateOtpInput{
	//		PhoneNumber: "233200000000",
	//		Email:       "some-email",
	//		Size:        6,
	//		Extra:       &map[string]any{"some": "extra"},
	//	}
	//
	// )
	GenerateOtp(ctx context.Context, req GenerateOtpInput) (*GenerateOtpResponse, error)
	// VerifyOtp verifies an OTP using the Gatekeeper service
	//
	// # Usage:
	//
	// go appCtx.Clients.GatekeeperAPI.VerifyOtp(
	// ctx,
	//
	//	VerifyOtpRequest{
	//		Reference: "some-reference",
	//		Otp:       "123456",
	//	}
	//
	// )
	VerifyOtp(ctx context.Context, req VerifyOtpRequest) (*VerifyOtpResponse, error)
	// SendSMS sends an SMS using the Gatekeeper service
	//
	// # Usage:
	//
	// go appCtx.Clients.GatekeeperAPI.SendSMS(
	// ctx,
	//
	//	SendSMSInput{
	//		Recipient: "233200000000",
	//		Message:  "This is a test sms.",
	//	}
	//
	// )
	SendSMS(ctx context.Context, req SendSMSInput) error
	doRequest(ctx context.Context, method, path string, body, result interface{}) error
}

type gatekeeperClient struct {
	config     config.Config
	httpClient *http.Client
}

func NewClient(cfg config.Config) Client {
	return &gatekeeperClient{
		config: cfg,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
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
		ProjectID:   c.config.Clients.GatekeeperAPI.ProjectID,
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

func (c *gatekeeperClient) SendSMS(ctx context.Context, input SendSMSInput) error {
	if c.config.Env == "" || c.config.Env == "development" {
		logrus.Info("Skipping sms send in development", input)
		return nil
	}

	normalizePhone, normalizePhoneErr := lib.NormalizePhoneNumber(input.Recipient)
	if normalizePhoneErr != nil {
		return normalizePhoneErr
	}

	message := lib.ApplyGlobalVariableTemplate(c.config, input.Message)
	req := GatekeeperSendSMSRequest{
		PhoneNumber: normalizePhone,
		Message:     message,
	}

	var response GatekeeperSendSMSResponse

	err := c.doRequest(ctx, http.MethodPost, "/send_sms", req, &response)
	if err != nil {
		return err
	}

	return nil
}

func (c *gatekeeperClient) doRequest(ctx context.Context, method, path string, body, result interface{}) error {
	fullURL := fmt.Sprintf("%s%s", c.config.Clients.GatekeeperAPI.BaseURL, path)

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

	if c.config.Clients.GatekeeperAPI.ApiKey != "" {
		req.Header.Set("X-API-Key", c.config.Clients.GatekeeperAPI.ApiKey)
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
