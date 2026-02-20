package pkg

import (
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"github.com/resend/resend-go/v2"
	"github.com/sirupsen/logrus"
)

type SendEmailInput struct {
	Recipient string
	Subject   string
	TextBody  string
	HtmlBody  string
	Cc        []string
	Bcc       []string
}

// SendEmail sends an email using the Resend service
//
// # Usage:
//
// go SendEmail(
// appCtx,
//
//	SendEmailInput{
//		Recipient: "recipient@example.com",
//		Subject:   "Test Email",
//		TextBody:  "This is a test email.",
//		HtmlBody:  "<p>This is a test email.</p>",
//	}
//
// )
func SendEmail(cfg config.Config, input SendEmailInput) error {
	if cfg.ResendAPIKey == "" {
		raven.CaptureError(errors.New("resend api key not set"), nil)
		return errors.New("InternalServerError")
	}

	if cfg.Env == "" || cfg.Env == "development" {
		logrus.Info("Skipping email send in development", input)
		return nil
	}

	client := resend.NewClient(cfg.ResendAPIKey)

	params := &resend.SendEmailRequest{
		From:    "Rentloop Notifications <noreply@notifications.mfoni.app>",
		To:      []string{input.Recipient},
		Html:    lib.ApplyGlobalVariableTemplate(cfg, input.HtmlBody),
		Subject: input.Subject,
		Text:    lib.ApplyGlobalVariableTemplate(cfg, input.TextBody),
		Cc:      input.Cc,
		Bcc:     input.Bcc,
	}

	sent, err := client.Emails.Send(params)
	if err != nil {
		raven.CaptureError(err, map[string]string{
			"function": "SendEmail",
			"action":   "send email",
		})
		logrus.Error("Error sending email: ", err)
		return err
	}

	logrus.Info("Email sent: ", sent.Id)

	return nil
}
