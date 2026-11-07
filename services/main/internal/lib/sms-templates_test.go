package lib

import "testing"

func TestTenantApplicationApprovedSMSBody(t *testing.T) {
	want := `Hi {{applicant_name}}, you're approved for {{unit_name}}! Download the Rentloop app: {{download_apps_url}} and log in with: {{phone_number}}`
	if TENANT_APPLICATION_APPROVED_SMS_BODY != want {
		t.Fatalf("approval SMS changed:\n got: %s\nwant: %s", TENANT_APPLICATION_APPROVED_SMS_BODY, want)
	}
}
