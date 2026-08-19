package repository

import (
	"strings"
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

func getAccountSQL(t *testing.T, query GetFinancialAccountQuery) string {
	t.Helper()

	var account models.FinancialAccount
	db := applyFinancialAccountQuery(dryRunDB(t).Model(&models.FinancialAccount{}), query)

	return db.First(&account).Statement.SQL.String()
}

// Account identity is tenant + property. This is the lookup that decides
// whether a new lease joins an existing relationship or starts one.
func TestGetFinancialAccountByTenantAndProperty(t *testing.T) {
	tenantID := "33333333-3333-3333-3333-333333333333"
	propertyID := "44444444-4444-4444-4444-444444444444"

	sql := getAccountSQL(t, GetFinancialAccountQuery{TenantID: &tenantID, PropertyID: &propertyID})

	if !strings.Contains(sql, "financial_accounts.tenant_id = ") {
		t.Errorf("expected a tenant predicate, got: %s", sql)
	}
	if !strings.Contains(sql, "financial_accounts.property_id = ") {
		t.Errorf("expected a property predicate, got: %s", sql)
	}
}

// Resolution must consider CLOSURE_ELIGIBLE accounts as reusable: a lease that
// expired while a renewal was being negotiated leaves the account eligible,
// and the renewal has to revive it rather than open a second one.
func TestGetFinancialAccountFiltersByStatusSet(t *testing.T) {
	statuses := []string{"ACTIVE", "CLOSURE_ELIGIBLE"}
	sql := getAccountSQL(t, GetFinancialAccountQuery{Statuses: &statuses})

	if !strings.Contains(sql, "financial_accounts.status IN ") {
		t.Errorf("expected a status IN predicate, got: %s", sql)
	}
}
