package pkg

import (
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
)

func ApplyGlobalVariableTemplate(appCtx AppContext, template string) string {
	supportEmail := appCtx.Config.SupportData.Email
	supportPhone := appCtx.Config.SupportData.Phone

	normalizedPhone, normalizedPhoneErr := lib.NormalizePhoneNumber(supportPhone)
	if normalizedPhoneErr != nil {
		normalizedPhone = supportPhone
		raven.CaptureError(normalizedPhoneErr, map[string]string{
			"function": "ApplyGlobalVariableTemplate",
			"action":   "inject support phone",
		})
	}

	result := template

	result = strings.ReplaceAll(result, "{{SUPPORT_DETAILS_TEMPLATE}}", lib.SUPPORT_DETAILS_TEMPLATE)
	result = strings.ReplaceAll(result, "{{support_email}}", supportEmail)
	result = strings.ReplaceAll(result, "{{support_phone}}", normalizedPhone)
	result = strings.ReplaceAll(result, "{{admin_portal_url}}", appCtx.Config.Portals.AdminPortalURL)
	result = strings.ReplaceAll(result, "{{property_manager_portal_url}}", appCtx.Config.Portals.PropertyManagerPortalURL)
	result = strings.ReplaceAll(result, "{{tenant_portal_url}}", appCtx.Config.Portals.TenantPortalURL)

	return result
}
