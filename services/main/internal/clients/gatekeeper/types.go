package gatekeeper

import "encoding/json"

type GenerateOtpInput struct {
	PhoneNumber *string
	Email       *string
	Size        int
	Extra       *map[string]any
}

type GenerateOtpRequest struct {
	ProjectID   string           `json:"project"`
	PhoneNumber *string          `json:"phoneNumber,omitempty"`
	Email       *string          `json:"email,omitempty"`
	Size        int              `json:"size"`
	Extra       *json.RawMessage `json:"extra,omitempty"`
}

type GenerateOtpResponse struct {
	Message   string  `json:"message"`
	Reference string  `json:"reference"`
	Receiver  string  `json:"receiver"`
	Name      string  `json:"name"`
	Type      string  `json:"type"` // "phone", "email", or "mixed"
	ExpiresAt string  `json:"expiresAt"`
	OTP       *string `json:"otp,omitempty"` // Only in development mode
}

type VerifyOtpRequest struct {
	Reference string `json:"reference"`
	Otp       string `json:"otp"`
}

type VerifyOtpResponse struct {
	Message   string `json:"message"`
	Verified  bool   `json:"verified"`
	Reference string `json:"reference"`
	Receiver  string `json:"receiver"`
	Name      string `json:"name"`
}

type GatekeeperAPIErrorResponse struct {
	Error             string  `json:"error"`
	Message           *string `json:"message,omitempty"`
	AttemptsRemaining *int    `json:"attempts_remaining,omitempty"`
}
