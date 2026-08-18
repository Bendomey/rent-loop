package financials

import (
	"context"
	"testing"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/gofrs/uuid"
)

// ─── fakes ────────────────────────────────────────────────────────────────────

type fakeAccountRepo struct{ accounts []models.FinancialAccount }

func (f *fakeAccountRepo) ListActiveForBilling(context.Context) (*[]models.FinancialAccount, error) {
	return &f.accounts, nil
}
func (f *fakeAccountRepo) Create(context.Context, *models.FinancialAccount) error { return nil }
func (f *fakeAccountRepo) Update(context.Context, *models.FinancialAccount) error { return nil }
func (f *fakeAccountRepo) GetOne(
	context.Context, repository.GetFinancialAccountQuery,
) (*models.FinancialAccount, error) {
	return nil, nil
}

func (f *fakeAccountRepo) SumSuccessfulPayments(context.Context, string) (int64, error) {
	return 0, nil
}

type fakeChargeService struct{ views []ChargeView }

func (f *fakeChargeService) ListViews(context.Context, string) ([]ChargeView, error) {
	return f.views, nil
}

func (f *fakeChargeService) MaterialiseForAccount(context.Context, MaterialiseForAccountInput) error {
	return nil
}

func (f *fakeChargeService) CreateAdHoc(
	context.Context, CreateAdHocChargeInput,
) (*models.ChargeInstance, error) {
	return nil, nil
}
func (f *fakeChargeService) ReassignAccount(context.Context, string, string) error { return nil }
func (f *fakeChargeService) CloseDefinitionsForLease(context.Context, string, string) error {
	return nil
}

func (f *fakeChargeService) ScopeUnassignedToLease(context.Context, string, string) error {
	return nil
}
func (f *fakeChargeService) VoidInstance(context.Context, VoidChargeInput) error   { return nil }
func (f *fakeChargeService) RederiveRent(context.Context, RederiveRentInput) error { return nil }
func (f *fakeChargeService) ListInstances(
	context.Context, string, *string, bool,
) ([]models.ChargeInstance, error) {
	return nil, nil
}

type recordingComposer struct {
	calls [][]Claim
	dues  []time.Time
}

func (r *recordingComposer) ComposeAccountInvoice(
	_ context.Context, _ string, claims []Claim, dueDate time.Time,
) error {
	r.calls = append(r.calls, claims)
	r.dues = append(r.dues, dueDate)
	return nil
}

func billableAccount(t *testing.T) models.FinancialAccount {
	t.Helper()
	id, err := uuid.NewV4()
	if err != nil {
		t.Fatalf("uuid: %v", err)
	}
	acct := models.FinancialAccount{
		RentBillingCadence:  CadenceEveryPeriod,
		RentBillingInterval: 1,
		AutoIssueDaysBefore: 5,
	}
	acct.ID = id
	return acct
}

// ─── tests ────────────────────────────────────────────────────────────────────

// asOf is what decides the window. The same ledger must bill January when
// asked in December and nothing at all when asked in October.
func TestIssueDueInvoicesHonoursAsOf(t *testing.T) {
	accounts := &fakeAccountRepo{accounts: []models.FinancialAccount{billableAccount(t)}}
	charges := &fakeChargeService{views: rentMonths(t, []string{"2027-01-01", "2027-02-01"})}
	composer := &recordingComposer{}
	svc := NewIssuanceService(accounts, charges, composer)

	issued, failed, err := svc.IssueDueInvoices(context.Background(), mustDate(t, "2026-12-28"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if issued != 1 || failed != 0 {
		t.Fatalf("got issued=%d failed=%d, want 1 and 0", issued, failed)
	}
	if len(composer.calls) != 1 || len(composer.calls[0]) != 1 {
		t.Fatalf("got %d invoices, want one invoice of one claim", len(composer.calls))
	}
}

// Far outside the lead window nothing is issued — proving asOf reaches the
// selector rather than being ignored in favour of the wall clock.
func TestIssueDueInvoicesOutsideWindowIssuesNothing(t *testing.T) {
	accounts := &fakeAccountRepo{accounts: []models.FinancialAccount{billableAccount(t)}}
	charges := &fakeChargeService{views: rentMonths(t, []string{"2027-01-01"})}
	composer := &recordingComposer{}
	svc := NewIssuanceService(accounts, charges, composer)

	issued, _, err := svc.IssueDueInvoices(context.Background(), mustDate(t, "2026-10-01"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if issued != 0 || len(composer.calls) != 0 {
		t.Fatalf("got issued=%d calls=%d, want nothing issued", issued, len(composer.calls))
	}
}

// The invoice due date is the earliest selected charge's due date.
func TestIssueDueInvoicesUsesEarliestDueDate(t *testing.T) {
	accounts := &fakeAccountRepo{accounts: []models.FinancialAccount{billableAccount(t)}}
	charges := &fakeChargeService{views: rentMonths(t, []string{"2027-02-01", "2027-01-01"})}
	composer := &recordingComposer{}
	svc := NewIssuanceService(accounts, charges, composer)

	if _, _, err := svc.IssueDueInvoices(
		context.Background(), mustDate(t, "2026-12-28"),
	); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !composer.dues[0].Equal(mustDate(t, "2027-01-01")) {
		t.Errorf("got due date %s, want 2027-01-01", composer.dues[0])
	}
}
