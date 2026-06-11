package openexchangerates

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client interface {
	// GetLatestRates fetches the latest USD-base exchange rates from OpenExchangeRates.
	GetLatestRates(ctx context.Context) (*LatestRatesResponse, error)
}

type oxrClient struct {
	baseURL    string
	appID      string
	httpClient *http.Client
}

func NewClient(baseURL, appID string) Client {
	return &oxrClient{
		baseURL: baseURL,
		appID:   appID,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *oxrClient) GetLatestRates(ctx context.Context) (*LatestRatesResponse, error) {
	url := fmt.Sprintf("%s/latest.json?app_id=%s", c.baseURL, c.appID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("openexchangerates: create request: %w", err)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("openexchangerates: execute request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("openexchangerates: read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("openexchangerates: API error %d: %s", resp.StatusCode, string(body))
	}

	var result LatestRatesResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("openexchangerates: unmarshal response: %w", err)
	}

	return &result, nil
}
