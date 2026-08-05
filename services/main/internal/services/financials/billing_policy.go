package financials

// DeriveRentBillingPolicy converts a tenant application's InitialDepositFee
// into a rent billing cadence.
//
// The initial deposit is advance rent, not a fee: ActivateLease has always
// treated it as `cyclesCovered = InitialDepositFee / RentFee` and skipped that
// many billing cycles. Representing it as a charge in its own right would
// double-count it against the rent instances covering the same periods, so it
// becomes an interval instead — the first invoice simply carries that many
// rent lines.
//
// Any remainder below a full period is intentionally dropped here. It is not
// lost: composition claims it as a partial line on the next instance, which is
// an improvement on the integer truncation the old cursor performed silently.
func DeriveRentBillingPolicy(initialDepositFee, rentFee int64) RentBillingPolicy {
	if rentFee <= 0 || initialDepositFee <= 0 {
		return RentBillingPolicy{Cadence: CadenceEveryPeriod, Interval: 1}
	}

	periods := initialDepositFee / rentFee
	if periods <= 1 {
		return RentBillingPolicy{Cadence: CadenceEveryPeriod, Interval: 1}
	}

	return RentBillingPolicy{Cadence: CadenceEveryNPeriods, Interval: periods}
}
