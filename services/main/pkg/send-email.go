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
}

// Usage:
// go SendEmail(
// appCtx,
// 	SendEmailInput{
// 		Recipient: "recipient@example.com",
// 		Subject:   "Test Email",
// 		TextBody:  "This is a test email.",
// 		HtmlBody:  "<p>This is a test email.</p>",
// 	}
// )

// SendEmail sends an email using the Resend service
func SendEmail(appCtx AppContext, input SendEmailInput) error {

	if appCtx.Config.ResendAPIKey == "" {
		raven.CaptureError(errors.New("resend api key not set"), nil)
		return errors.New("InternalServerError")
	}

	if appCtx.Config.Env == "" || appCtx.Config.Env == "development" {
		logrus.Info("Skipping email send in development", input)
		return nil
	}

	client := resend.NewClient(appCtx.Config.ResendAPIKey)

	params := &resend.SendEmailRequest{
		From:    "Rentloop Notifications <noreply@notifications.mfoni.app>",
		To:      []string{input.Recipient},
		Html:    ApplyGlobalVariableTemplate(appCtx, input.HtmlBody),
		Subject: input.Subject,
		Text:    ApplyGlobalVariableTemplate(appCtx, input.TextBody),
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
