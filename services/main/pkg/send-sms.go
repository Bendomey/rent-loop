package pkg

import (
	"errors"

	"github.com/Bendomey/goutilities/pkg/transport"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"github.com/sirupsen/logrus"
)

type WittyflowSendMessageResponseData struct {
	Status          string  `json:"status"`
	MessageID       string  `json:"message_id"`
	Message         string  `json:"message"`
	DateCreated     string  `json:"date_created"`
	Direction       string  `json:"direction"`
	From            string  `json:"from"`
	To              string  `json:"to"`
	Type            string  `json:"type"`
	MessageSegments int64   `json:"message_segments"`
	Cost            string  `json:"cost"`
	ServiceRate     string  `json:"service_rate"`
	CallbackURL     *string `json:"callback_url"`
}

type WittyflowSendMessageResponse struct {
	Status  string                           `json:"status"`
	Code    string                           `json:"mode"`
	Message string                           `json:"message"`
	Data    WittyflowSendMessageResponseData `json:"data"`
}

type SendSMSInput struct {
	Recipient string
	Message   string
}

// Usage:
// go SendSMS(
// appCtx,
// 	SendSMSInput{
// 		Recipient: "233200000000",
// 		Message:  "This is a test sms.",
// 		AppID:   "your-app-id",
// 		AppSecret: "your-app-secret",
// 		Env:      "development",
// 	}
// )

// SendSMS sends an SMS using the Wittyflow service
func SendSMS(appCtx AppContext, input SendSMSInput) error {
	if appCtx.Config.Wittyflow.AppID == "" || appCtx.Config.Wittyflow.AppSecret == "" {
		raven.CaptureError(errors.New("wittyflow credentials not set"), nil)
		return errors.New("InternalServerError")
	}

	if appCtx.Config.Env == "" || appCtx.Config.Env == "development" {
		logrus.Info("Skipping sms send in development", input)
		return nil
	}

	// Send sms with wittyflow
	sendResponseSuccess := new(WittyflowSendMessageResponse)
	sendResponseFailed := new(WittyflowSendMessageResponse)

	normalizePhone, normalizePhoneErr := lib.NormalizePhoneNumber(input.Recipient)
	if normalizePhoneErr != nil {
		raven.CaptureError(normalizePhoneErr, map[string]string{
			"recipient": input.Recipient,
		})
		return normalizePhoneErr
	}

	shouldLog := true
	sendSMSErr := transport.Fetch(transport.FetchParams{
		Method: "POST",
		Url:    "https://api.wittyflow.com/v1/messages/send",
		Headers: &map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		},
		Body: map[string]string{
			"from":       "Rentloop",
			"to":         normalizePhone,
			"type":       "1",
			"message":    ApplyGlobalVariableTemplate(appCtx, input.Message),
			"app_id":     appCtx.Config.Wittyflow.AppID,
			"app_secret": appCtx.Config.Wittyflow.AppSecret,
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

	if sendResponseSuccess.Status != "success" {
		raven.CaptureError(errors.New(sendResponseFailed.Message), map[string]string{
			"recipient": input.Recipient,
			"message":   input.Message,
		})
		return errors.New(sendResponseFailed.Message)
	}

	return nil
}
