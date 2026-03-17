package lib

import (
	"fmt"
	"time"
)

// RentInvoiceLabel returns a human-readable invoice label for a rent billing
// period given a payment frequency and the billing date.
//
// Examples:
//
//	Hourly     → "Rent – 15 Mar 2026, 14:00"
//	Daily      → "Rent – 15 Mar 2026"
//	Weekly     → "Rent – Week of 15 Mar 2026"
//	Monthly    → "Rent – March 2026"
//	Quarterly  → "Rent – Q2 2026 (Apr–Jun)"
//	BiAnnually → "Rent – H1 2026 (Jan–Jun)"
//	Annually   → "Rent – 2026"
func RentInvoiceLabel(frequency string, billingDate time.Time) string {
	d := billingDate
	switch frequency {
	case "Hourly":
		return fmt.Sprintf("Rent \u2013 %s", d.Format("2 Jan 2006, 15:04"))
	case "Daily", "DAILY":
		return fmt.Sprintf("Rent \u2013 %s", d.Format("2 Jan 2006"))
	case "Weekly", "WEEKLY":
		return fmt.Sprintf("Rent \u2013 Week of %s", d.Format("2 Jan 2006"))
	case "Monthly", "MONTHLY":
		return fmt.Sprintf("Rent \u2013 %s", d.Format("January 2006"))
	case "Quarterly":
		quarter := (int(d.Month())-1)/3 + 1
		qStart := time.Date(d.Year(), time.Month(((quarter-1)*3)+1), 1, 0, 0, 0, 0, d.Location())
		qEnd := qStart.AddDate(0, 3, -1)
		return fmt.Sprintf(
			"Rent \u2013 Q%d %d (%s\u2013%s)",
			quarter,
			d.Year(),
			qStart.Format("Jan"),
			qEnd.Format("Jan"),
		)
	case "BiAnnually":
		half := 1
		if d.Month() > 6 {
			half = 2
		}
		hStart := time.Date(d.Year(), time.Month(((half-1)*6)+1), 1, 0, 0, 0, 0, d.Location())
		hEnd := hStart.AddDate(0, 6, -1)
		return fmt.Sprintf("Rent \u2013 H%d %d (%s\u2013%s)", half, d.Year(), hStart.Format("Jan"), hEnd.Format("Jan"))
	case "Annually", "ANNUALLY":
		return fmt.Sprintf("Rent \u2013 %d", d.Year())
	default:
		return fmt.Sprintf("Rent \u2013 %s", d.Format("January 2006"))
	}
}
