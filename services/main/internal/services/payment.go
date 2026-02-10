package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type PaymentService interface {
	CreateOfflinePayment(context context.Context, input CreateOfflinePaymentInput) (*models.Payment, error)
	VerifyOfflinePayment(context context.Context, input VerifyOfflinePaymentInput) (*models.Payment, error)
	// GetPayment(context context.Context, query repository.GetPaymentQuery) (*models.Payment, error)
	// ListPayments(
	// 	context context.Context,
	// 	filterQuery repository.ListPaymentsFilter,
	// ) ([]models.Payment, error)
	// CountPayments(context context.Context, filterQuery repository.ListPaymentsFilter) (int64, error)
	// UpdatePayment(context context.Context, input UpdatePaymentInput) (*models.Payment, error)
	// DeletePayment(context context.Context, input repository.DeletePaymentInput) error
}

type paymentService struct {
	appCtx                pkg.AppContext
	repo                  repository.PaymentRepository
	paymentAccountService PaymentAccountService
	invoiceService        InvoiceService
}

type PaymentServiceDeps struct {
	AppCtx                pkg.AppContext
	Repo                  repository.PaymentRepository
	PaymentAccountService PaymentAccountService
	InvoiceService        InvoiceService
}

func NewPaymentService(deps PaymentServiceDeps) PaymentService {
	return &paymentService{
		appCtx:                deps.AppCtx,
		repo:                  deps.Repo,
		paymentAccountService: deps.PaymentAccountService,
		invoiceService:        deps.InvoiceService,
	}
}

type CreateOfflinePaymentInput struct {
	PaymentAccountID string
	InvoiceID        string
	Provider         string
	Amount           int64
	Reference        *string
	Metadata         *map[string]any
}

func (s *paymentService) CreateOfflinePayment(
	ctx context.Context,
	input CreateOfflinePaymentInput,
) (*models.Payment, error) {
	if input.Amount <= 0 {
		return nil, pkg.BadRequestError("payment amount must be greater than zero", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"amount": fmt.Sprintf("%d", input.Amount),
			},
		})
	}

	// make sure payment account exists/and is active/and its an offline rail.
	paymentAccount, paymentAccountErr := s.paymentAccountService.GetPaymentAccount(
		ctx,
		repository.GetPaymentAccountQuery{
			ID:       input.PaymentAccountID,
			Populate: nil,
		},
	)
	if paymentAccountErr != nil {
		return nil, paymentAccountErr
	}

	if paymentAccount.Status != "ACTIVE" {
		return nil, pkg.BadRequestError("payment account is not active", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"payment_account_id": input.PaymentAccountID,
				"status":             paymentAccount.Status,
			},
		})
	}

	if paymentAccount.Rail != "OFFLINE" {
		return nil, pkg.BadRequestError(
			"payment account rail must be OFFLINE for offline payments",
			&pkg.RentLoopErrorParams{
				Metadata: map[string]string{
					"payment_account_id": input.PaymentAccountID,
					"rail":               paymentAccount.Rail,
				},
			},
		)
	}

	// make sure invoice
	// - exists/is not fully paid.
	//- make sure the rail exists in the invoice accepted rails.
	// - make sure the amount is not more than the invoice balance.
	invoice, invoiceErr := s.invoiceService.GetByQuery(ctx, repository.GetInvoiceQuery{
		Query: map[string]any{
			"id": input.InvoiceID,
		},
		Populate: nil,
	})
	if invoiceErr != nil {
		return nil, invoiceErr
	}

	if !lib.StringInSlice(invoice.Status, []string{"ISSUED", "PARTIALLY_PAID"}) {
		return nil, pkg.BadRequestError("invoice is not in a valid state to accept payments", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"invoice_id": input.InvoiceID,
				"status":     invoice.Status,
			},
		})
	}

	if !lib.StringInSlice("OFFLINE", invoice.AllowedPaymentRails) {
		return nil, pkg.BadRequestError("invoice does not accept offline payments", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"invoice_id":            input.InvoiceID,
				"allowed_payment_rails": lib.StringSliceToString(invoice.AllowedPaymentRails),
				"required_rail":         "OFFLINE",
			},
		})
	}

	remainingBalance, remainingBalanceErr := getRemainingInvoiceBalance(ctx, s.repo, *invoice)
	if remainingBalanceErr != nil {
		return nil, pkg.InternalServerError(remainingBalanceErr.Error(), &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"invoice_id": input.InvoiceID,
				"function":   "getRemainingInvoiceBalance",
				"action":     "calculating remaining invoice balance",
			},
		})
	}

	if input.Amount > remainingBalance {
		return nil, pkg.BadRequestError("payment amount exceeds invoice balance", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"invoice_id":        input.InvoiceID,
				"invoice_total":     fmt.Sprintf("%d", invoice.TotalAmount),
				"payment_amount":    fmt.Sprintf("%d", input.Amount),
				"remaining_balance": fmt.Sprintf("%d", remainingBalance),
			},
		})
	}

	payment := models.Payment{
		InvoiceID: input.InvoiceID,
		Rail:      "OFFLINE",
		Provider:  &input.Provider,
		Amount:    input.Amount,
		Currency:  invoice.Currency,
		Reference: input.Reference,
		Status:    "PENDING",
	}

	initialMetadata := map[string]any{
		"payment_account": map[string]any{
			"id":         paymentAccount.ID,
			"rail":       paymentAccount.Rail,
			"provider":   paymentAccount.Provider,
			"identifier": paymentAccount.Identifier,
			"status":     paymentAccount.Status,
			"is_default": paymentAccount.IsDefault,
		},
	}

	if input.Metadata != nil {
		initialMetadata["offline_data"] = map[string]any{}

		for k, v := range *input.Metadata {
			// save under "offline" object
			initialMetadata["offline_data"].(map[string]any)[k] = v
		}
	}

	metadataJSON, metadataJSONErr := lib.InterfaceToJSON(initialMetadata)
	if metadataJSONErr != nil {
		return nil, pkg.InternalServerError(metadataJSONErr.Error(), &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"invoice_id": input.InvoiceID,
				"cause":      "failed to marshal payment metadata",
			},
		})
	}
	payment.Metadata = metadataJSON

	err := s.repo.CreatePayment(ctx, &payment)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"function":   "CreateOfflinePayment",
				"action":     "creating offline payment record",
				"invoice_id": input.InvoiceID,
			},
		})
	}

	return &payment, nil
}

type VerifyOfflinePaymentInput struct {
	VerifiedByID string
	PaymentID    string
	IsSuccessful bool
	Metadata     *map[string]any
}

func (s *paymentService) VerifyOfflinePayment(
	ctx context.Context,
	input VerifyOfflinePaymentInput,
) (*models.Payment, error) {
	// Get payment
	populate := []string{"Invoice"}
	payment, paymentErr := s.repo.GetByIDWithQuery(ctx, repository.GetPaymentQuery{
		PaymentID: input.PaymentID,
		Populate:  &populate,
	})
	if paymentErr != nil {
		return nil, pkg.NotFoundError("PaymentNotFound", &pkg.RentLoopErrorParams{
			Err: paymentErr,
			Metadata: map[string]string{
				"payment_id": input.PaymentID,
			},
		})
	}

	// Validate payment is OFFLINE rail
	if payment.Rail != "OFFLINE" {
		return nil, pkg.BadRequestError("can only verify offline payments", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"payment_id": input.PaymentID,
				"rail":       payment.Rail,
			},
		})
	}

	// Validate payment is in PENDING status
	if payment.Status != "PENDING" {
		return nil, pkg.BadRequestError("payment is not in pending status", &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"payment_id": input.PaymentID,
				"status":     payment.Status,
			},
		})
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	now := time.Now()

	// Update payment metadata with verification response
	existingMetadata := map[string]any{}
	if payment.Metadata != nil {
		if err := json.Unmarshal(*payment.Metadata, &existingMetadata); err != nil {
			transaction.Rollback()
			return nil, pkg.InternalServerError("failed to parse payment metadata", &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"payment_id": input.PaymentID,
				},
			})
		}
	}

	// Add verification response to metadata
	verifyResponse := map[string]any{
		"verified_by_id": input.VerifiedByID,
		"verified_at":    now.Format(time.RFC3339),
		"is_successful":  input.IsSuccessful,
	}
	if input.Metadata != nil {
		for k, v := range *input.Metadata {
			verifyResponse[k] = v
		}
	}
	existingMetadata["offline_verify_response"] = verifyResponse

	metadataJSON, metadataJSONErr := lib.InterfaceToJSON(existingMetadata)
	if metadataJSONErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError("failed to marshal payment metadata", &pkg.RentLoopErrorParams{
			Err: metadataJSONErr,
			Metadata: map[string]string{
				"payment_id": input.PaymentID,
			},
		})
	}
	payment.Metadata = metadataJSON

	if input.IsSuccessful {
		// Update payment to SUCCESSFUL
		payment.Status = "SUCCESSFUL"
		payment.SuccessfulAt = &now

		updatePaymentErr := s.repo.Update(transCtx, payment)
		if updatePaymentErr != nil {
			transaction.Rollback()
			return nil, pkg.InternalServerError("failed to update payment", &pkg.RentLoopErrorParams{
				Err: updatePaymentErr,
				Metadata: map[string]string{
					"payment_id": input.PaymentID,
					"action":     "updating payment to SUCCESSFUL",
				},
			})
		}

		// Calculate remaining balance after this payment
		remainingBalance, remainingBalanceErr := getRemainingInvoiceBalance(transCtx, s.repo, payment.Invoice)
		if remainingBalanceErr != nil {
			transaction.Rollback()
			return nil, pkg.InternalServerError("failed to calculate remaining balance", &pkg.RentLoopErrorParams{
				Err: remainingBalanceErr,
				Metadata: map[string]string{
					"payment_id": input.PaymentID,
					"invoice_id": payment.Invoice.ID.String(),
				},
			})
		}

		// Update invoice status based on remaining balance
		var newInvoiceStatus string
		var paidAt *time.Time

		if remainingBalance <= 0 {
			// Full payment - mark as PAID
			newInvoiceStatus = "PAID"
			paidAt = &now
		} else {
			// Partial payment - mark as PARTIALLY_PAID
			newInvoiceStatus = "PARTIALLY_PAID"
		}

		_, updateInvoiceErr := s.invoiceService.UpdateInvoice(transCtx, UpdateInvoiceInput{
			InvoiceID: payment.Invoice.ID.String(),
			Status:    &newInvoiceStatus,
			PaidAt:    paidAt,
		})
		if updateInvoiceErr != nil {
			transaction.Rollback()
			return nil, pkg.InternalServerError("failed to update invoice status", &pkg.RentLoopErrorParams{
				Err: updateInvoiceErr,
				Metadata: map[string]string{
					"payment_id": input.PaymentID,
					"invoice_id": payment.Invoice.ID.String(),
					"new_status": newInvoiceStatus,
				},
			})
		}
	} else {
		// Update payment to FAILED
		payment.Status = "FAILED"
		payment.FailedAt = &now

		updatePaymentErr := s.repo.Update(transCtx, payment)
		if updatePaymentErr != nil {
			transaction.Rollback()
			return nil, pkg.InternalServerError("failed to update payment", &pkg.RentLoopErrorParams{
				Err: updatePaymentErr,
				Metadata: map[string]string{
					"payment_id": input.PaymentID,
					"action":     "updating payment to FAILED",
				},
			})
		}
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError("failed to commit transaction", &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"payment_id": input.PaymentID,
				"function":   "VerifyOfflinePayment",
			},
		})
	}

	return payment, nil
}

func getRemainingInvoiceBalance(
	ctx context.Context,
	repo repository.PaymentRepository,
	invoice models.Invoice,
) (int64, error) {
	totalPaid, err := repo.SumAmountByInvoice(ctx, invoice.ID.String(), []string{"SUCCESSFUL", "PENDING"})
	if err != nil {
		return 0, err
	}

	return invoice.TotalAmount - totalPaid, nil
}
