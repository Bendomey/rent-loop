package financials

import "testing"

func leaseRef(id string) *string { return &id }

// Every charge on the invoice belongs to one term. That term is the payer.
func TestDerivePayerLeaseSingleLease(t *testing.T) {
	views := []ChargeView{
		{ID: "jan", LeaseID: leaseRef("lease-1")},
		{ID: "feb", LeaseID: leaseRef("lease-1")},
	}

	got := DerivePayerLease(views)
	if got == nil || *got != "lease-1" {
		t.Errorf("got %v, want lease-1", got)
	}
}

// A deposit and an account credit have no contractual home. There is nothing
// to derive, so the caller falls back to the account's current lease.
func TestDerivePayerLeaseAllAccountLevel(t *testing.T) {
	views := []ChargeView{{ID: "deposit"}, {ID: "credit"}}

	if got := DerivePayerLease(views); got != nil {
		t.Errorf("got %v, want nil — nothing here belongs to a lease", got)
	}
}

// Arrears from an ended term invoiced alongside the new term's rent. Neither
// lease is "the" payer, so the caller decides.
func TestDerivePayerLeaseMixedLeasesIsAmbiguous(t *testing.T) {
	views := []ChargeView{
		{ID: "dec", LeaseID: leaseRef("lease-1")},
		{ID: "jan", LeaseID: leaseRef("lease-2")},
	}

	if got := DerivePayerLease(views); got != nil {
		t.Errorf("got %v, want nil — the charges disagree", got)
	}
}

// One scoped charge plus account-level ones still has an unambiguous answer:
// the deposit does not contradict the rent.
func TestDerivePayerLeaseScopedPlusAccountLevel(t *testing.T) {
	views := []ChargeView{
		{ID: "deposit"},
		{ID: "jan", LeaseID: leaseRef("lease-1")},
	}

	got := DerivePayerLease(views)
	if got == nil || *got != "lease-1" {
		t.Errorf("got %v, want lease-1", got)
	}
}

// Nothing to invoice, nothing to attribute.
func TestDerivePayerLeaseEmpty(t *testing.T) {
	if got := DerivePayerLease(nil); got != nil {
		t.Errorf("got %v, want nil", got)
	}
}
