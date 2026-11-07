package financials

import (
	"context"
	"testing"
	"time"

	"github.com/gofrs/uuid"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
)

type fakeChargeRepo struct {
	repository.ChargeRepository
	original  models.ChargeInstance
	instances []models.ChargeInstance
	events    *[]string
}

func (f *fakeChargeRepo) LockInstances(_ context.Context, ids []string) ([]models.ChargeInstance, error) {
	*f.events = append(*f.events, "lock:"+ids[0])
	if ids[0] != f.original.ID.String() {
		return nil, nil
	}

	return []models.ChargeInstance{f.original}, nil
}

func (f *fakeChargeRepo) ListInstances(
	context.Context,
	repository.ListChargeInstancesFilter,
) (*[]models.ChargeInstance, error) {
	*f.events = append(*f.events, "list")

	return &f.instances, nil
}

func (f *fakeChargeRepo) CreateInstances(context.Context, []models.ChargeInstance) error {
	*f.events = append(*f.events, "create")

	return nil
}

type openAccountRepo struct {
	repository.FinancialAccountRepository
}

func (openAccountRepo) GetOne(
	context.Context,
	repository.GetFinancialAccountQuery,
) (*models.FinancialAccount, error) {
	return &models.FinancialAccount{Status: "ACTIVE"}, nil
}

func refund(of string, amount int64) models.ChargeInstance {
	return models.ChargeInstance{Amount: amount, ReversesChargeInstanceID: &of}
}

func refundInput(original string, amount int64) CreateAdHocChargeInput {
	return CreateAdHocChargeInput{
		FinancialAccountID:       "fa",
		Name:                     "Refund",
		Amount:                   amount,
		Currency:                 "GHS",
		ReversesChargeInstanceID: &original,
	}
}

func newReversalService(repo *fakeChargeRepo, events *[]string) ChargeService {
	repo.events = events
	inTx := func(ctx context.Context, fn func(context.Context) error) error {
		*events = append(*events, "begin")
		err := fn(ctx)
		if err != nil {
			*events = append(*events, "rollback")
		} else {
			*events = append(*events, "commit")
		}

		return err
	}

	return NewChargeService(repo, openAccountRepo{}, inTx)
}

func settledDeposit() models.ChargeInstance {
	original := models.ChargeInstance{
		FinancialAccountID: "fa",
		Amount:             300_000,
		SettledAmount:      300_000,
		Category:           CategorySecurityDeposit,
	}
	original.ID = uuid.Must(uuid.NewV4())

	return original
}

func TestCreateAdHocRefundCapsAtSettledLessPriorRefunds(t *testing.T) {
	original := settledDeposit()
	id := original.ID.String()

	cases := []struct {
		name    string
		prior   []models.ChargeInstance
		amount  int64
		allowed bool
	}{
		{"first full refund", nil, -300_000, true},
		{"second full refund is blocked", []models.ChargeInstance{refund(id, -300_000)}, -300_000, false},
		{"remainder after a partial refund", []models.ChargeInstance{refund(id, -100_000)}, -200_000, true},
		{"more than the remainder", []models.ChargeInstance{refund(id, -100_000)}, -200_001, false},
		{"refund of another charge does not count", []models.ChargeInstance{refund("other", -300_000)}, -300_000, true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var events []string
			svc := newReversalService(&fakeChargeRepo{original: original, instances: tc.prior}, &events)

			_, err := svc.CreateAdHoc(context.Background(), refundInput(id, tc.amount))
			if tc.allowed && err != nil {
				t.Fatalf("want refund accepted, got %v", err)
			}
			if !tc.allowed && err == nil {
				t.Fatal("want refund rejected, got nil")
			}
		})
	}
}

func TestCreateAdHocRefundLocksTheOriginalInsideTheTransaction(t *testing.T) {
	original := settledDeposit()
	id := original.ID.String()
	var events []string
	svc := newReversalService(&fakeChargeRepo{original: original}, &events)

	if _, err := svc.CreateAdHoc(context.Background(), refundInput(id, -300_000)); err != nil {
		t.Fatalf("want refund accepted, got %v", err)
	}

	want := []string{"begin", "lock:" + id, "list", "create", "commit"}
	if len(events) != len(want) {
		t.Fatalf("got %v, want %v", events, want)
	}
	for i := range want {
		if events[i] != want[i] {
			t.Fatalf("got %v, want %v", events, want)
		}
	}
}

func TestCreateAdHocRefundRollsBackWhenRejected(t *testing.T) {
	original := settledDeposit()
	id := original.ID.String()
	var events []string
	svc := newReversalService(&fakeChargeRepo{
		original:  original,
		instances: []models.ChargeInstance{refund(id, -300_000)},
	}, &events)

	if _, err := svc.CreateAdHoc(context.Background(), refundInput(id, -1)); err == nil {
		t.Fatal("want rejected")
	}
	if events[len(events)-1] != "rollback" {
		t.Errorf("got %v, want a rollback and no create", events)
	}
	for _, e := range events {
		if e == "create" {
			t.Errorf("rejected refund must not insert: %v", events)
		}
	}
}

func TestCreateAdHocRefundRejectsForeignOrVoidedOriginal(t *testing.T) {
	voided := time.Now()

	cases := map[string]func(*models.ChargeInstance){
		"another account's charge": func(o *models.ChargeInstance) { o.FinancialAccountID = "someone-else" },
		"a voided charge":          func(o *models.ChargeInstance) { o.VoidedAt = &voided },
	}

	for name, mutate := range cases {
		t.Run(name, func(t *testing.T) {
			original := settledDeposit()
			mutate(&original)
			var events []string
			svc := newReversalService(&fakeChargeRepo{original: original}, &events)

			if _, err := svc.CreateAdHoc(context.Background(), refundInput(original.ID.String(), -1)); err == nil {
				t.Fatal("want rejected")
			}
			for _, e := range events {
				if e == "create" {
					t.Errorf("must not insert: %v", events)
				}
			}
		})
	}
}

func TestCreateAdHocPlainChargeSkipsTheTransaction(t *testing.T) {
	var events []string
	svc := newReversalService(&fakeChargeRepo{}, &events)

	_, err := svc.CreateAdHoc(context.Background(), CreateAdHocChargeInput{
		FinancialAccountID: "fa", Name: "Damage", Category: "DAMAGE", Amount: 5_000, Currency: "GHS",
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(events) != 1 || events[0] != "create" {
		t.Errorf("got %v, want a bare create", events)
	}
}
