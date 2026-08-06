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
	IssueDueInvoices(ctx context.Context, asOf time.Time) (issued int, failed int, err error)
	// IssueDueInvoicesForAccount is the same sweep restricted to one account.
	// The cron never uses it; it exists so a caller can exercise issuance
	// without advancing every other ledger in the database as a side effect.
	IssueDueInvoicesForAccount(
		ctx context.Context, accountID string, asOf time.Time,
	) (issued int, failed int, err error)
}

type issuanceService struct {
	accounts repository.FinancialAccountRepository
	charges  ChargeService
	composer InvoiceComposer
}

func NewIssuanceService(
	accounts repository.FinancialAccountRepository,
	charges ChargeService,
	composer InvoiceComposer,
) IssuanceService {
	return &issuanceService{accounts: accounts, charges: charges, composer: composer}
}

// IssueDueInvoices sweeps every billable account and issues what is due.
//
// Selection is over state, never a stored cursor. A landlord who took cash in
// January for March-August leaves those charges settled and covered, so they
// simply stop being candidates and the sweep resumes at September — no job to
// cancel, no cursor to repair.
//
// asOf is the instant the sweep runs at. The cron passes time.Now(); making it
// a parameter rather than hidden state is what lets a full lease term be
// exercised without waiting for it or rewriting due dates.
func (s *issuanceService) IssueDueInvoices(ctx context.Context, asOf time.Time) (int, int, error) {
	return s.issue(ctx, "", asOf)
}

func (s *issuanceService) IssueDueInvoicesForAccount(
	ctx context.Context,
	accountID string,
	asOf time.Time,
) (int, int, error) {
	return s.issue(ctx, accountID, asOf)
}

// issue runs the sweep over every billable account, or over exactly one when
// onlyAccountID is set. Filtering happens here rather than in the repository so
// that the scoped path exercises identical selection logic to the cron.
func (s *issuanceService) issue(
	ctx context.Context,
	onlyAccountID string,
	asOf time.Time,
) (int, int, error) {
	accounts, err := s.accounts.ListActiveForBilling(ctx)
	if err != nil {
		return 0, 0, err
	}

	var issued, failed int

	for _, account := range *accounts {
		accountID := account.ID.String()

		if onlyAccountID != "" && accountID != onlyAccountID {
			continue
		}

		views, viewErr := s.charges.ListViews(ctx, accountID)
		if viewErr != nil {
			log.WithError(viewErr).WithField("account_id", accountID).
				Error("[Cron] failed to list charges")
			failed++
			continue
		}

		selected := SelectIssuableCharges(
			views,
			asOf,
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

		// The earliest of everything selected, not selected[0]: one-offs are
		// listed first but a damage charge raised mid-term can fall due after
		// the rent it rides along with.
		dueDate := selected[0].DueDate
		for _, view := range selected[1:] {
			if view.DueDate.Before(dueDate) {
				dueDate = view.DueDate
			}
		}
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
