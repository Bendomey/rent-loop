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

type Payload struct {
	Rate              float64 `json:"rate"`
	MessageID         string  `json:"messageId"`
	Status            int     `json:"status"`
	NetworkID         string  `json:"networkId"`
	ClientReference   *string `json:"clientReference"`
	StatusDescription string  `json:"statusDescription"`
}

type DeliveryStatus struct {
	Message string  `json:"message"`
	Payload Payload `json:"payload"`
}

type GatekeeperSendSMSResponse struct {
	Message        string         `json:"message"`
	PhoneNumber    string         `json:"phoneNumber"`
	CreditsUsed    int            `json:"creditsUsed"`
	MessageLength  int            `json:"messageLength"`
	CampaignID     string         `json:"campaignId"`
	DeliveryStatus DeliveryStatus `json:"deliveryStatus"`
}

type GatekeeperSendSMSRequest struct {
	PhoneNumber string `json:"phoneNumber"`
	Message     string `json:"message"`
}

type SendSMSInput struct {
	Recipient string
	Message   string
}
