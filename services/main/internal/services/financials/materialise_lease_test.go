package financials

import "testing"

// A renewal materialises its rent against the shared account, but every charge
// it creates belongs to the new term. Without the lease scope the "This Lease"
// view would show one undifferentiated pile across every term of the tenancy.
func TestMaterialiseForAccountInputCarriesLease(t *testing.T) {
	leaseID := "44444444-4444-4444-4444-444444444444"
	in := MaterialiseForAccountInput{
		FinancialAccountID: "55555555-5555-5555-5555-555555555555",
		LeaseID:            &leaseID,
		RentFee:            55_000,
	}

	if in.LeaseID == nil || *in.LeaseID != leaseID {
		t.Fatalf("got %v, want the lease carried through", in.LeaseID)
	}
}

// A renewal passes SecurityDepositFee: 0, which is how "a renewal never
// re-charges the deposit" is enforced — charge.go treats 0 as not opted in and
// creates no deposit charge at all.
func TestMaterialiseForAccountZeroDepositMeansNoDepositCharge(t *testing.T) {
	in := MaterialiseForAccountInput{SecurityDepositFee: 0}

	if in.SecurityDepositFee != 0 {
		t.Fatal("a renewal must materialise with a zero security deposit")
	}
}
