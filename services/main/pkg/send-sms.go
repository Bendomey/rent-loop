package pkg

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/Bendomey/goutilities/pkg/transport"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"github.com/sirupsen/logrus"
)

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

type GatekeeperAPIErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

type SendSMSInput struct {
	Recipient string
	Message   string
}

// SendSMS sends an SMS using the Gatekeeper service
// Usage:
// go SendSMS(
// appCtx,
//
//	SendSMSInput{
//		Recipient: "233200000000",
//		Message:  "This is a test sms.",
//	}
//
// )
func SendSMS(appCtx AppContext, input SendSMSInput) error {
	if appCtx.Config.Env == "" || appCtx.Config.Env == "development" {
		logrus.Info("Skipping sms send in development", input)
		return nil
	}

	// Send sms with gatekeeper
	sendResponseSuccess := new(GatekeeperSendSMSResponse)
	sendResponseFailed := new(GatekeeperAPIErrorResponse)

	normalizePhone, normalizePhoneErr := lib.NormalizePhoneNumber(input.Recipient)
	if normalizePhoneErr != nil {
		raven.CaptureError(normalizePhoneErr, map[string]string{
			"recipient": input.Recipient,
		})
		return normalizePhoneErr
	}

	shouldLog := true
	sendSMSErr := transport.Fetch(transport.FetchParams{
		Method: http.MethodPost,
		Url:    appCtx.Config.Clients.GatekeeperAPI.BaseURL + "/send_sms",
		Headers: &map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
			"X-API-Key":    appCtx.Config.Clients.GatekeeperAPI.ApiKey,
		},
		Body: map[string]string{
			"phoneNumber": normalizePhone,
			"message":     ApplyGlobalVariableTemplate(appCtx, input.Message),
		},
		SuccessObj: sendResponseSuccess,
		ErrorObj:   sendResponseFailed,
		ShouldLog:  &shouldLog,
	})

	if sendSMSErr != nil {
		raven.CaptureError(sendSMSErr, map[string]string{
			"recipient": input.Recipient,
			"message":   input.Message,
		})
		return sendSMSErr
	}

	if sendResponseFailed.Error != "" {
		message := fmt.Sprintf("%s %s", sendResponseFailed.Error, sendResponseFailed.Message)
		raven.CaptureError(errors.New(message), map[string]string{
			"recipient": input.Recipient,
			"message":   input.Message,
		})
		return errors.New(message)
	}

	return nil
}
