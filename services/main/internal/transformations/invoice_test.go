package transformations

import (
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

func TestDBInvoiceToRestExposesApplicantOfFinancialAccount(t *testing.T) {
	first, last := "Ama", "Boateng"
	app := models.TenantApplication{FirstName: &first, LastName: &last}
	app.ID = uuid.Must(uuid.NewV4())
	account := &models.FinancialAccount{Code: "FA-1", TenantApplication: app}
	account.ID = uuid.Must(uuid.NewV4())
	inv := &models.Invoice{FinancialAccount: account}
	inv.ID = uuid.Must(uuid.NewV4())

	out := DBInvoiceToRest(inv).(map[string]any)
	fa, ok := out["financial_account"].(map[string]any)
	if !ok {
		t.Fatalf("financial_account missing: %#v", out["financial_account"])
	}
	ta, ok := fa["tenant_application"].(map[string]any)
	if !ok {
		t.Fatalf("tenant_application missing: %#v", fa)
	}
	if ta["first_name"] != &first || ta["last_name"] != &last {
		t.Fatalf("names not carried: %#v", ta)
	}
}

func TestDBInvoiceToRestOmitsUnpopulatedFinancialAccount(t *testing.T) {
	inv := &models.Invoice{}
	inv.ID = uuid.Must(uuid.NewV4())

	out := DBInvoiceToRest(inv).(map[string]any)
	if out["financial_account"] != nil {
		t.Fatalf("expected nil, got %#v", out["financial_account"])
	}
}
