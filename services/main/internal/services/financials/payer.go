package financials

// DerivePayerLease returns the lease an invoice should be attributed to, or
// nil when the charges cannot say.
//
// Nil is not a failure — it means "ask the account", and the caller falls back
// to the current lease. Two shapes produce it: charges that are all
// account-level (a deposit, a credit), and charges that disagree, which is
// arrears from an ended term invoiced alongside the new term's rent. Guessing
// between two real leases would put the wrong term on a document the tenant
// reads.
func DerivePayerLease(views []ChargeView) *string {
	var found *string

	for _, view := range views {
		if view.LeaseID == nil {
			continue
		}

		if found == nil {
			found = view.LeaseID
			continue
		}

		if *found != *view.LeaseID {
			return nil
		}
	}

	return found
}
