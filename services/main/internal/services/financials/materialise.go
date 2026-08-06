package financials

import (
	"errors"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
)

// maxRentPeriods caps materialisation. Lease.MoveOutDate still carries a
// 2099-01-01 sentinel in existing code; without this cap a stray sentinel
// would write hundreds of charge rows.
const maxRentPeriods = 120

// ErrTermTooLong is returned when a term would generate more than
// maxRentPeriods instances.
var ErrTermTooLong = errors.New("lease term exceeds the maximum number of rent periods")

type MaterialiseRentInput struct {
	RentFee               int64
	Currency              string
	PaymentFrequency      string // how often rent is billed
	MoveInDate            time.Time
	StayDuration          int64
	StayDurationFrequency string // the unit the term is expressed in
}

// MaterialiseRentInstances turns agreed rent terms into one dated draft per
// billing period. Each draft holds ONE period at the agreed rate — never a
// multiple, and never a stored total. The total obligation is the sum of these
// drafts, which is what lets a rent review close one definition and open
// another without recomputing anything already invoiced.
func MaterialiseRentInstances(in MaterialiseRentInput) ([]ChargeInstanceDraft, error) {
	endDate := termEndDate(in.MoveInDate, in.StayDuration, in.StayDurationFrequency)
	grace := lib.RentInvoiceGracePeriod(in.PaymentFrequency)

	drafts := make([]ChargeInstanceDraft, 0, 12)
	periodStart := in.MoveInDate

	for periodStart.Before(endDate) {
		next := advance(periodStart, in.PaymentFrequency)
		if next == nil {
			// OneTime or an unrecognised frequency has no recurrence.
			return []ChargeInstanceDraft{}, nil
		}

		if len(drafts) >= maxRentPeriods {
			return nil, ErrTermTooLong
		}

		periodEnd := next.Add(-24 * time.Hour)
		drafts = append(drafts, ChargeInstanceDraft{
			Name:        lib.RentInvoiceLabel(in.PaymentFrequency, periodStart),
			Category:    CategoryRent,
			Amount:      in.RentFee,
			Currency:    in.Currency,
			PeriodStart: periodStart,
			PeriodEnd:   periodEnd,
			DueDate:     periodStart.Add(grace),
		})

		periodStart = *next
	}

	return drafts, nil
}

// termEndDate mirrors leaseEndDate in internal/services/lease.go. It is
// duplicated rather than imported because this package must stay free of the
// services package to avoid an import cycle.
func termEndDate(start time.Time, duration int64, frequency string) time.Time {
	d := int(duration)
	switch frequency {
	case "Hourly", "HOURLY":
		return start.Add(time.Duration(d) * time.Hour)
	case "Daily", "DAILY":
		return start.AddDate(0, 0, d)
	case "Weekly", "WEEKLY":
		return start.AddDate(0, 0, d*7)
	case "Monthly", "MONTHLY":
		return start.AddDate(0, d, 0)
	case "Quarterly", "QUARTERLY":
		return start.AddDate(0, d*3, 0)
	case "BiAnnually", "BIANNUALLY":
		return start.AddDate(0, d*6, 0)
	case "Annually", "ANNUALLY":
		return start.AddDate(d, 0, 0)
	default:
		return start.AddDate(0, d, 0)
	}
}

// advance steps one billing period forward. Returns nil when the frequency has
// no recurrence.
func advance(from time.Time, frequency string) *time.Time {
	var next time.Time
	switch frequency {
	case "Hourly", "HOURLY":
		next = from.Add(time.Hour)
	case "Daily", "DAILY":
		next = from.AddDate(0, 0, 1)
	case "Weekly", "WEEKLY":
		next = from.AddDate(0, 0, 7)
	case "Monthly", "MONTHLY":
		next = from.AddDate(0, 1, 0)
	case "Quarterly", "QUARTERLY":
		next = from.AddDate(0, 3, 0)
	case "BiAnnually", "BIANNUALLY":
		next = from.AddDate(0, 6, 0)
	case "Annually", "ANNUALLY":
		next = from.AddDate(1, 0, 0)
	default:
		return nil
	}
	return &next
}
