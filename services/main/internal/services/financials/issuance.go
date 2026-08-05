package financials

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	log "github.com/sirupsen/logrus"
)

// InvoiceComposer is the narrow slice of InvoiceService this package needs.
// Declaring it here rather than importing services avoids an import cycle and
// keeps issuance testable with a fake.
type InvoiceComposer interface {
	ComposeAccountInvoice(ctx context.Context, accountID string, claims []Claim, dueDate time.Time) error
}

type IssuanceService interface {
	IssueDueInvoices(ctx context.Context) (issued int, failed int, err error)
}

type issuanceService struct {
	accounts repository.FinancialAccountRepository
	charges  ChargeService
	composer InvoiceComposer
	now      func() time.Time
}

func NewIssuanceService(
	accounts repository.FinancialAccountRepository,
	charges ChargeService,
	composer InvoiceComposer,
) IssuanceService {
	return &issuanceService{accounts: accounts, charges: charges, composer: composer, now: time.Now}
}

// IssueDueInvoices sweeps every billable account and issues what is due.
//
// Selection is over state, never a stored cursor. A landlord who took cash in
// January for March-August leaves those charges settled and covered, so they
// simply stop being candidates and the sweep resumes at September — no job to
// cancel, no cursor to repair.
func (s *issuanceService) IssueDueInvoices(ctx context.Context) (int, int, error) {
	accounts, err := s.accounts.ListActiveForBilling(ctx)
	if err != nil {
		return 0, 0, err
	}

	now := s.now()
	var issued, failed int

	for _, account := range *accounts {
		accountID := account.ID.String()

		views, viewErr := s.charges.ListViews(ctx, accountID)
		if viewErr != nil {
			log.WithError(viewErr).WithField("account_id", accountID).
				Error("[Cron] failed to list charges")
			failed++
			continue
		}

		selected := SelectIssuableCharges(
			views,
			now,
			RentBillingPolicy{
				Cadence:  account.RentBillingCadence,
				Interval: account.RentBillingInterval,
			},
			account.AutoIssueDaysBefore,
		)
		if len(selected) == 0 {
			continue
		}

		claims := make([]Claim, 0, len(selected))
		for _, view := range selected {
			claims = append(claims, Claim{
				ChargeInstanceID: view.ID,
				Amount:           view.UninvoicedAmount(),
			})
		}

		dueDate := selected[0].DueDate
		if composeErr := s.composer.ComposeAccountInvoice(ctx, accountID, claims, dueDate); composeErr != nil {
			log.WithError(composeErr).WithField("account_id", accountID).
				Error("[Cron] failed to issue invoice")
			failed++
			continue
		}
		issued++
	}

	return issued, failed, nil
}
