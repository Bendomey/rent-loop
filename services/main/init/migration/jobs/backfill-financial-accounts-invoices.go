package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/services/financials"
	"gorm.io/gorm"
)

// reattachInvoices links an account's existing invoices to its charges and
// rebuilds allocations from successful payments.
func reattachInvoices(db *gorm.DB, accountID, applicationID string, hasLease bool, leaseID string) error {
	query := db.Where("deleted_at IS NULL").
		Where("context_tenant_application_id = ?", applicationID)
	if hasLease {
		query = db.Where("deleted_at IS NULL").
			Where("context_tenant_application_id = ? OR context_lease_id = ? OR payer_lease_id = ?",
				applicationID, leaseID, leaseID)
	}

	var invoices []models.Invoice
	if err := query.Order("created_at ASC").Find(&invoices).Error; err != nil {
		return err
	}

	for i := range invoices {
		invoice := invoices[i]

		if err := db.Model(&models.Invoice{}).
			Where("id = ?", invoice.ID).
			Update("financial_account_id", accountID).Error; err != nil {
			return err
		}

		if err := reattachLineItems(db, accountID, &invoice); err != nil {
			return err
		}
		if err := rebuildAllocations(db, &invoice); err != nil {
			return err
		}
	}

	return nil
}

// reattachLineItems points each line at the charge it was really paying for.
//
// An INITIAL_DEPOSIT line is advance rent covering N periods, so it is SPLIT
// into one line per rent instance. The invoice total is unchanged, but the
// invoice renders with more lines than it did historically — that is the price
// of every line claiming exactly one charge, which is what keeps
// charge.invoiced_amount honest.
func reattachLineItems(db *gorm.DB, accountID string, invoice *models.Invoice) error {
	var lineItems []models.InvoiceLineItem
	if err := db.Where("invoice_id = ? AND deleted_at IS NULL", invoice.ID).
		Order("created_at ASC").
		Find(&lineItems).Error; err != nil {
		return err
	}

	charges, err := loadChargeViews(db, accountID)
	if err != nil {
		return err
	}

	// A VOID invoice reserves nothing — its charges must stay billable.
	reserve := invoice.Status != "VOID"

	for i := range lineItems {
		line := lineItems[i]

		matched, matchErr := matchLineToCharges(db, accountID, charges, line)
		if matchErr != nil {
			return matchErr
		}
		if len(matched) == 0 {
			continue
		}

		// One claim: point the existing line at it.
		if len(matched) == 1 {
			if err := db.Model(&models.InvoiceLineItem{}).
				Where("id = ?", line.ID).
				Update("charge_instance_id", matched[0].ChargeInstanceID).Error; err != nil {
				return err
			}
			if reserve {
				if err := addInvoiced(db, matched[0]); err != nil {
					return err
				}
			}
			continue
		}

		// Several claims: replace the line with one per charge.
		if err := db.Delete(&models.InvoiceLineItem{}, "id = ?", line.ID).Error; err != nil {
			return err
		}
		for _, claim := range matched {
			chargeID := claim.ChargeInstanceID
			var charge models.ChargeInstance
			if chargeErr := db.Where("id = ?", chargeID).First(&charge).Error; chargeErr != nil {
				return chargeErr
			}

			invoiceID := invoice.ID.String()
			replacement := models.InvoiceLineItem{
				InvoiceID:        &invoiceID,
				ChargeInstanceID: &chargeID,
				Label:            charge.Name,
				Category:         charge.Category,
				Quantity:         1,
				UnitAmount:       claim.Amount,
				TotalAmount:      claim.Amount,
				Currency:         charge.Currency,
			}
			if err := db.Create(&replacement).Error; err != nil {
				return err
			}
			if reserve {
				if err := addInvoiced(db, claim); err != nil {
					return err
				}
			}
		}

		// Refresh: the claims just made changed what remains available.
		charges, err = loadChargeViews(db, accountID)
		if err != nil {
			return err
		}
	}

	return nil
}

// matchLineToCharges decides which charges a historical line item was paying
// for.
func matchLineToCharges(
	db *gorm.DB,
	accountID string,
	charges []financials.ChargeView,
	line models.InvoiceLineItem,
) ([]financials.Claim, error) {
	switch line.Category {
	case "INITIAL_DEPOSIT", "RENT":
		// Advance rent, or rent proper: fill rent charges oldest first. A
		// non-multiple amount partial-claims the last instance rather than
		// losing the remainder, which the old integer division did silently.
		rent := filterByCategory(charges, financials.CategoryRent)
		claims, remainder := financials.FillOldestFirst(rent, line.TotalAmount)
		if remainder != 0 {
			// More was billed than the schedule accounts for — record the
			// excess as an ad-hoc charge so no money goes unexplained.
			extra, err := createAdHocCharge(db, accountID, line, remainder)
			if err != nil {
				return nil, err
			}
			claims = append(claims, financials.Claim{ChargeInstanceID: extra, Amount: remainder})
		}
		return claims, nil

	case "SECURITY_DEPOSIT":
		deposit := filterByCategory(charges, financials.CategorySecurityDeposit)
		claims, remainder := financials.FillOldestFirst(deposit, line.TotalAmount)
		if remainder != 0 {
			extra, err := createAdHocCharge(db, accountID, line, remainder)
			if err != nil {
				return nil, err
			}
			claims = append(claims, financials.Claim{ChargeInstanceID: extra, Amount: remainder})
		}
		return claims, nil

	default:
		// Anything else becomes a charge in its own right, so the invoice
		// still reconciles against the ledger.
		extra, err := createAdHocCharge(db, accountID, line, line.TotalAmount)
		if err != nil {
			return nil, err
		}
		return []financials.Claim{{ChargeInstanceID: extra, Amount: line.TotalAmount}}, nil
	}
}

func createAdHocCharge(
	db *gorm.DB,
	accountID string,
	line models.InvoiceLineItem,
	amount int64,
) (string, error) {
	category := line.Category
	switch category {
	case "RENT", "SECURITY_DEPOSIT", "AGENCY_FEE", "VAT", "UTILITY",
		"DAMAGE_CHARGE", "EARLY_TERMINATION_FEE", "OTHER":
	default:
		category = financials.CategoryOther
	}

	dueDate := line.CreatedAt
	charge := models.ChargeInstance{
		FinancialAccountID: accountID,
		Name:               line.Label,
		Category:           category,
		Amount:             amount,
		Currency:           line.Currency,
		DueDate:            dueDate,
	}
	if err := db.Create(&charge).Error; err != nil {
		return "", err
	}
	return charge.ID.String(), nil
}

// rebuildAllocations replays each successful payment through the same fill the
// live engine uses, so history matches what the engine would have produced.
func rebuildAllocations(db *gorm.DB, invoice *models.Invoice) error {
	var payments []models.Payment
	if err := db.Where("invoice_id = ? AND status = ? AND deleted_at IS NULL", invoice.ID, "SUCCESSFUL").
		Order("created_at ASC").
		Find(&payments).Error; err != nil {
		return err
	}

	for i := range payments {
		payment := payments[i]

		var lineItems []models.InvoiceLineItem
		if err := db.Where("invoice_id = ? AND deleted_at IS NULL AND charge_instance_id IS NOT NULL", invoice.ID).
			Find(&lineItems).Error; err != nil {
			return err
		}

		views := make([]financials.ChargeView, 0, len(lineItems))
		byCharge := map[string]models.InvoiceLineItem{}
		for _, line := range lineItems {
			var charge models.ChargeInstance
			if err := db.Where("id = ?", *line.ChargeInstanceID).First(&charge).Error; err != nil {
				return err
			}
			view := financials.ToChargeView(charge)
			// Allocation consumes unsettled amount, so project settled into
			// the slot the fill reads.
			view.InvoicedAmount = charge.SettledAmount
			views = append(views, view)
			byCharge[view.ID] = line
		}

		claims, _ := financials.FillOldestFirst(views, payment.Amount)
		for _, claim := range claims {
			line := byCharge[claim.ChargeInstanceID]
			lineID := line.ID.String()
			allocation := models.PaymentAllocation{
				PaymentID:         payment.ID.String(),
				ChargeInstanceID:  claim.ChargeInstanceID,
				InvoiceLineItemID: &lineID,
				Amount:            claim.Amount,
				Currency:          payment.Currency,
			}
			if err := db.Create(&allocation).Error; err != nil {
				return err
			}
			if err := db.Model(&models.ChargeInstance{}).
				Where("id = ?", claim.ChargeInstanceID).
				Update("settled_amount", gorm.Expr("settled_amount + ?", claim.Amount)).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

func loadChargeViews(db *gorm.DB, accountID string) ([]financials.ChargeView, error) {
	var instances []models.ChargeInstance
	if err := db.Where("financial_account_id = ? AND deleted_at IS NULL AND voided_at IS NULL", accountID).
		Order("due_date ASC").
		Find(&instances).Error; err != nil {
		return nil, err
	}

	views := make([]financials.ChargeView, 0, len(instances))
	for _, instance := range instances {
		views = append(views, financials.ToChargeView(instance))
	}
	return views, nil
}

func filterByCategory(charges []financials.ChargeView, category string) []financials.ChargeView {
	out := make([]financials.ChargeView, 0, len(charges))
	for _, c := range charges {
		if c.Category == category {
			out = append(out, c)
		}
	}
	return out
}

func addInvoiced(db *gorm.DB, claim financials.Claim) error {
	return db.Model(&models.ChargeInstance{}).
		Where("id = ?", claim.ChargeInstanceID).
		Update("invoiced_amount", gorm.Expr("invoiced_amount + ?", claim.Amount)).Error
}
