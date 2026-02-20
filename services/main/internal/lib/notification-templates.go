package lib

import (
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/getsentry/raven-go"
)

func ApplyGlobalVariableTemplate(cfg config.Config, template string) string {
	supportEmail := cfg.SupportData.Email
	supportPhone := cfg.SupportData.Phone

	normalizedPhone, normalizedPhoneErr := NormalizePhoneNumber(supportPhone)
	if normalizedPhoneErr != nil {
		normalizedPhone = supportPhone
		raven.CaptureError(normalizedPhoneErr, map[string]string{
			"function": "ApplyGlobalVariableTemplate",
			"action":   "inject support phone",
		})
	}

	result := template
	result = strings.ReplaceAll(result, "{{SUPPORT_DETAILS_TEMPLATE}}", SUPPORT_DETAILS_TEMPLATE)
	result = strings.ReplaceAll(result, "{{support_email}}", supportEmail)
	result = strings.ReplaceAll(result, "{{support_phone}}", normalizedPhone)
	result = strings.ReplaceAll(result, "{{website_url}}", cfg.Portals.WebsiteURL)
	result = strings.ReplaceAll(result, "{{admin_portal_url}}", cfg.Portals.AdminPortalURL)
	result = strings.ReplaceAll(
		result,
		"{{property_manager_portal_url}}",
		cfg.Portals.PropertyManagerPortalURL,
	)
	result = strings.ReplaceAll(result, "{{tenant_portal_url}}", cfg.Portals.TenantPortalURL)

	return result
}
