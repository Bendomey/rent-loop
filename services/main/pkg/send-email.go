package pkg

import (
	"context"
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

// BulkEmailRecipient holds per-recipient data for a bulk send.
type BulkEmailRecipient struct {
	To       string
	Subject  string
	TextBody string
	HtmlBody string
}

// SendBulkEmail sends personalized emails to many recipients using Resend's
// batch API. Automatically chunks into batches of 100.
func SendBulkEmail(ctx context.Context, cfg config.Config, recipients []BulkEmailRecipient) error {
	if len(recipients) == 0 {
		return nil
	}

	if cfg.ResendAPIKey == "" {
		raven.CaptureError(errors.New("resend api key not set"), nil)
		return errors.New("InternalServerError")
	}

	if cfg.Env == "" || cfg.Env == "development" {
		logrus.Info("Skipping bulk email send in development, count=", len(recipients))
		return nil
	}

	client := resend.NewClient(cfg.ResendAPIKey)
	const batchSize = 100

	for i := 0; i < len(recipients); i += batchSize {
		end := i + batchSize
		if end > len(recipients) {
			end = len(recipients)
		}
		chunk := recipients[i:end]

		params := make([]*resend.SendEmailRequest, 0, len(chunk))
		for _, r := range chunk {
			params = append(params, &resend.SendEmailRequest{
				From:    "Rentloop Notifications <noreply@notifications.mfoni.app>",
				To:      []string{r.To},
				Subject: r.Subject,
				Html:    lib.ApplyGlobalVariableTemplate(cfg, r.HtmlBody),
				Text:    lib.ApplyGlobalVariableTemplate(cfg, r.TextBody),
			})
		}

		if _, err := client.Batch.SendWithContext(ctx, params); err != nil {
			raven.CaptureError(err, map[string]string{"function": "SendBulkEmail"})
			logrus.WithError(err).Error("Error sending bulk email batch")
			return err
		}
	}

	return nil
}
