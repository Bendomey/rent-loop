package pkg

import (
	"errors"

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
	APIKey    string
	Env       string
}

// Usage:
// go SendEmail(
// 	SendEmailInput{
// 		Recipient: "recipient@example.com",
// 		Subject:   "Test Email",
// 		TextBody:  "This is a test email.",
// 		HtmlBody:  "<p>This is a test email.</p>",
// 		APIKey:   "your-api-key",
// 		Env:      "development",
// 	}
// )

// SendEmail sends an email using the Resend service
func SendEmail(input SendEmailInput) error {

	if input.APIKey == "" {
		raven.CaptureError(errors.New("resend api key not set"), nil)
		return errors.New("InternalServerError")
	}

	if input.Env == "" || input.Env == "development" {
		logrus.Info("Skipping email send in development", input)
		return nil
	}

	client := resend.NewClient(input.APIKey)

	params := &resend.SendEmailRequest{
		From:    "Rentloop Notifications <noreply@notifications.mfoni.app>",
		To:      []string{input.Recipient},
		Html:    input.HtmlBody,
		Subject: input.Subject,
		Text:    input.TextBody,
		Cc:      input.Cc,
		Bcc:     input.Bcc,
	}

	sent, err := client.Emails.Send(params)
	if err != nil {
		logrus.Error("Error sending email: ", err)
		return err
	}

	logrus.Info("Email sent: ", sent.Id)

	return nil
}
