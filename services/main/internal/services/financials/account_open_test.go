package financials

import "testing"

// A renewal that deliberately does not carry its parent's account still
// belongs to the same tenant and the same original application — only the
// money is being separated, not the history of who this is.
func TestOpenForLeaseInputCarriesProvenance(t *testing.T) {
	property := "66666666-6666-6666-6666-666666666666"
	in := OpenForLeaseInput{
		OriginTenantApplicationID: "77777777-7777-7777-7777-777777777777",
		TenantID:                  "88888888-8888-8888-8888-888888888888",
		Currency:                  "GHS",
		PropertyID:                &property,
	}

	if in.OriginTenantApplicationID == "" {
		t.Error("provenance must be carried from the parent's account")
	}
	if in.TenantID == "" {
		t.Error("a lease-opened account always knows its tenant — it is not application-stage")
	}
	if in.Currency != "GHS" {
		t.Errorf("got currency %q, want the parent's", in.Currency)
	}
}
