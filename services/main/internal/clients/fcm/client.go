package fcm

import (
	"bytes"
	"context"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	log "github.com/sirupsen/logrus"
)

// ErrInvalidToken is returned when FCM reports the device token as
// unregistered or invalid. The caller should delete the token from the DB.
var ErrInvalidToken = errors.New("invalid or unregistered FCM token")

// Client sends push notifications via the FCM HTTP v1 API.
type Client interface {
	Send(ctx context.Context, deviceToken, title, body string, data map[string]string) error
}

type serviceAccount struct {
	ProjectID   string `json:"project_id"`
	ClientEmail string `json:"client_email"`
	PrivateKey  string `json:"private_key"`
}

type fcmClient struct {
	projectID   string
	clientEmail string
	privateKey  *rsa.PrivateKey
	httpClient  *http.Client
}

type noopClient struct{}

func (n *noopClient) Send(_ context.Context, _, _, _ string, _ map[string]string) error {
	log.Warn("[FCM] service account not configured — skipping push notification")
	return nil
}

// New creates an FCM client from a service account JSON string.
// If serviceAccountJSON is empty it returns a no-op client so the app starts
// without credentials (useful before the env var is set in production).
func New(serviceAccountJSON string) (Client, error) {
	if serviceAccountJSON == "" {
		return &noopClient{}, nil
	}

	var sa serviceAccount
	if err := json.Unmarshal([]byte(serviceAccountJSON), &sa); err != nil {
		return nil, fmt.Errorf("fcm: parsing service account JSON: %w", err)
	}

	block, _ := pem.Decode([]byte(sa.PrivateKey))
	if block == nil {
		return nil, fmt.Errorf("fcm: failed to decode PEM block from private key")
	}

	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("fcm: parsing private key: %w", err)
	}

	rsaKey, ok := key.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("fcm: expected RSA private key")
	}

	return &fcmClient{
		projectID:   sa.ProjectID,
		clientEmail: sa.ClientEmail,
		privateKey:  rsaKey,
		httpClient:  &http.Client{Timeout: 10 * time.Second},
	}, nil
}

func (c *fcmClient) getAccessToken(ctx context.Context) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"iss":   c.clientEmail,
		"sub":   c.clientEmail,
		"aud":   "https://oauth2.googleapis.com/token",
		"iat":   now.Unix(),
		"exp":   now.Add(time.Hour).Unix(),
		"scope": "https://www.googleapis.com/auth/firebase.messaging",
	}

	tok := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	signed, err := tok.SignedString(c.privateKey)
	if err != nil {
		return "", fmt.Errorf("fcm: signing JWT: %w", err)
	}

	resp, err := c.httpClient.PostForm("https://oauth2.googleapis.com/token", url.Values{
		"grant_type": {"urn:ietf:params:oauth:grant-type:jwt-bearer"},
		"assertion":  {signed},
	})
	if err != nil {
		return "", fmt.Errorf("fcm: requesting access token: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("fcm: decoding token response: %w", err)
	}
	if result.Error != "" {
		return "", fmt.Errorf("fcm: token endpoint error: %s", result.Error)
	}

	return result.AccessToken, nil
}

func (c *fcmClient) Send(ctx context.Context, deviceToken, title, body string, data map[string]string) error {
	accessToken, err := c.getAccessToken(ctx)
	if err != nil {
		return err
	}

	payload := map[string]any{
		"message": map[string]any{
			"token": deviceToken,
			"notification": map[string]string{
				"title": title,
				"body":  body,
			},
			"data": data,
		},
	}

	payloadBytes, _ := json.Marshal(payload)
	endpoint := fmt.Sprintf(
		"https://fcm.googleapis.com/v1/projects/%s/messages:send",
		c.projectID,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(string(payloadBytes)))
	if err != nil {
		return fmt.Errorf("fcm: building request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("fcm: sending message: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusUnprocessableEntity {
		return ErrInvalidToken
	}

	if resp.StatusCode != http.StatusOK {
		var errBody bytes.Buffer
		errBody.ReadFrom(resp.Body)
		return fmt.Errorf("fcm: unexpected status %d: %s", resp.StatusCode, errBody.String())
	}

	return nil
}
