package financials

// DeriveRentBillingPolicy turns a tenant application's InitialDepositFee into a
// rent billing cadence, and decides whether automatic billing starts at all.
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
//
// The three outcomes:
//
//	no initial deposit   -> MANUAL             nothing is said, so nothing bills
//	covers <= 1 period   -> EVERY_PERIOD       collect period by period
//	covers N periods     -> EVERY_N_PERIODS/N  N rent lines on the first invoice
func DeriveRentBillingPolicy(initialDepositFee, rentFee int64) RentBillingPolicy {
	// No initial deposit means the landlord has not said anything about how
	// rent should be collected — so nothing is collected automatically.
	//
	// This default is load-bearing. An account becomes billable the instant
	// charges exist, and ListActiveForBilling does not care whether the
	// application has been approved, so returning EVERY_PERIOD here would start
	// invoicing on a cadence nobody chose — possibly the same night the charges
	// were created, against an application still under review. MANUAL waits for
	// the landlord to choose a collection plan.
	if rentFee <= 0 || initialDepositFee <= 0 {
		return RentBillingPolicy{Cadence: CadenceManual, Interval: 1}
	}

	// A deposit covering a period or less IS a stated intent — collect one
	// period at a time — so it keeps ordinary period billing. It must not floor
	// to a zero interval either: the queue would take zero charges.
	periods := initialDepositFee / rentFee
	if periods <= 1 {
		return RentBillingPolicy{Cadence: CadenceEveryPeriod, Interval: 1}
	}

	return RentBillingPolicy{Cadence: CadenceEveryNPeriods, Interval: periods}
}
