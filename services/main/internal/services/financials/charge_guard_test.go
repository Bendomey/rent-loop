package financials

import "testing"

// Nothing billed, nothing paid — the landlord can still move the move-in date
// and the rent schedule is simply regenerated.
func TestHasDirtyInstancesAllClean(t *testing.T) {
	views := []ChargeView{
		{ID: "jan", Category: CategoryRent, Amount: 100_000},
		{ID: "feb", Category: CategoryRent, Amount: 100_000},
	}
	if HasDirtyInstances(views) {
		t.Error("got dirty, want clean — nothing has been invoiced or settled")
	}
}

// An invoice exists against January. Regenerating would orphan that invoice
// line, so the edit must be rejected.
func TestHasDirtyInstancesInvoicedIsDirty(t *testing.T) {
	views := []ChargeView{
		{ID: "jan", Category: CategoryRent, Amount: 100_000, InvoicedAmount: 100_000},
		{ID: "feb", Category: CategoryRent, Amount: 100_000},
	}
	if !HasDirtyInstances(views) {
		t.Error("got clean, want dirty — January has been invoiced")
	}
}

// Money has actually landed. Definitely not rewritable.
func TestHasDirtyInstancesSettledIsDirty(t *testing.T) {
	views := []ChargeView{
		{ID: "jan", Category: CategoryRent, Amount: 100_000, SettledAmount: 40_000},
	}
	if !HasDirtyInstances(views) {
		t.Error("got clean, want dirty — January is part-settled")
	}
}

// A partially invoiced charge is dirty too — half an invoice is still an
// invoice someone has seen.
func TestHasDirtyInstancesPartiallyInvoicedIsDirty(t *testing.T) {
	views := []ChargeView{
		{ID: "jan", Category: CategoryRent, Amount: 100_000, InvoicedAmount: 30_000},
	}
	if !HasDirtyInstances(views) {
		t.Error("got clean, want dirty — January is partly invoiced")
	}
}

// No instances at all is trivially clean.
func TestHasDirtyInstancesEmpty(t *testing.T) {
	if HasDirtyInstances(nil) {
		t.Error("got dirty, want clean for an empty set")
	}
}
