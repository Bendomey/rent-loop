package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/accounting"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"gorm.io/gorm"
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
	appCtx                   pkg.AppContext
	repo                     repository.PaymentRepository
	paymentAccountService    PaymentAccountService
	invoiceService           InvoiceService
	accountingService        AccountingService
	notificationService      NotificationService
	leaseService             LeaseService
	tenantApplicationService TenantApplicationService
}

type PaymentServiceDeps struct {
	AppCtx                   pkg.AppContext
	Repo                     repository.PaymentRepository
	PaymentAccountService    PaymentAccountService
	InvoiceService           InvoiceService
	AccountingService        AccountingService
	NotificationService      NotificationService
	LeaseService             LeaseService
	TenantApplicationService TenantApplicationService
}

func NewPaymentService(deps PaymentServiceDeps) PaymentService {
	return &paymentService{
		appCtx:                   deps.AppCtx,
		repo:                     deps.Repo,
		paymentAccountService:    deps.PaymentAccountService,
		invoiceService:           deps.InvoiceService,
		accountingService:        deps.AccountingService,
		notificationService:      deps.NotificationService,
		leaseService:             deps.LeaseService,
		tenantApplicationService: deps.TenantApplicationService,
	}
}

type CreateOfflinePaymentInput struct {
	PaymentAccountID        string
	InvoiceID               string
	Provider                string
	Amount                  int64
	Reference               *string
	Metadata                *map[string]any
	InitiatedByClientUserID *string // set when a manager initiates; suppresses the submission notification
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

	// check if there're pending payments and fail those deliberately before creating a new one with the new amount.
	pendingPayments, pendingPaymentsErr := s.repo.List(ctx, repository.ListPaymentsFilter{
		InvoiceID: &input.InvoiceID,
		Statuses:  &[]string{"PENDING"},
	})
	if pendingPaymentsErr != nil {
		return nil, pkg.InternalServerError(pendingPaymentsErr.Error(), &pkg.RentLoopErrorParams{
			Metadata: map[string]string{
				"invoice_id": input.InvoiceID,
				"function":   "CreateOfflinePayment",
				"action":     "listing pending payments",
			},
		})
	}

	for i := range *pendingPayments {
		if err := failOfflinePayment(ctx, s.repo, &(*pendingPayments)[i], "superseded by a new payment"); err != nil {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Metadata: map[string]string{
					"invoice_id": input.InvoiceID,
					"payment_id": (*pendingPayments)[i].ID.String(),
					"function":   "CreateOfflinePayment",
					"action":     "failing pending payment",
				},
			})
		}
	}

	remainingBalance, remainingBalanceErr := getRemainingInvoiceBalance(ctx, GetRemainingInvoiceBalanceInput{
		repo:     s.repo,
		invoice:  *invoice,
		statuses: []string{"SUCCESSFUL"},
	})
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

	if input.InitiatedByClientUserID != nil {
		initialMetadata["initiated_by"] = map[string]any{
			"client_user_id": *input.InitiatedByClientUserID,
		}
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

	if input.InitiatedByClientUserID != nil {
		return &payment, nil
	}

	go func() {
		bgCtx := context.Background()
		if invoice.ContextLeaseID != nil && s.leaseService != nil {
			lease, leaseErr := s.leaseService.GetByIDWithPopulate(bgCtx, repository.GetLeaseQuery{
				ID:       *invoice.ContextLeaseID,
				Populate: &[]string{"ActivatedBy", "ActivatedBy.User", "Unit", "Tenant"},
			})
			if leaseErr != nil || lease.ActivatedById == nil || lease.ActivatedBy == nil ||
				lease.ActivatedBy.User.Email == "" {
				return
			}
			pmEmail := lease.ActivatedBy.User.Email
			_, _ = s.notificationService.CreateNotification(bgCtx, CreateNotificationInput{
				OrganizationID: lib.SafeString(&lease.ActivatedBy.ClientID),
				RecipientID:    lease.ActivatedBy.ID.String(),
				RecipientType:  models.NotificationRecipientTypeClientUser,
				Event:          "PAYMENT_OFFLINE_SUBMITTED",
				Title:          "Offline Payment Submitted",
				Body:           fmt.Sprintf("%s submitted an offline payment for invoice %s.", lease.Tenant.FirstName, invoice.Code),
				Data: map[string]any{
					"tenant_name":  lease.Tenant.FirstName,
					"unit_name":    lease.Unit.Name,
					"invoice_code": invoice.Code,
					"currency":     invoice.Currency,
					"amount":       lib.FormatAmount(lib.PesewasToCedis(invoice.TotalAmount)),
				},
				Channels:       []string{models.NotificationChannelInApp, models.NotificationChannelEmail},
				RecipientEmail: &pmEmail,
			})
		} else if invoice.ContextTenantApplicationID != nil && s.tenantApplicationService != nil {
			ta, taErr := s.tenantApplicationService.GetOneTenantApplication(bgCtx, repository.GetTenantApplicationQuery{
				TenantApplicationID: *invoice.ContextTenantApplicationID,
				Populate:            &[]string{"CreatedBy", "CreatedBy.User"},
			})
			if taErr != nil || ta.CreatedBy.User.Email == "" {
				return
			}
			tenantName := strings.Join(strings.Fields(lib.SafeString(ta.FirstName)+" "+lib.SafeString(ta.LastName)), " ")
			pmEmail := ta.CreatedBy.User.Email
			_, _ = s.notificationService.CreateNotification(bgCtx, CreateNotificationInput{
				OrganizationID: lib.SafeString(&ta.CreatedBy.ClientID),
				RecipientID:    ta.CreatedBy.ID.String(),
				RecipientType:  models.NotificationRecipientTypeClientUser,
				Event:          "PAYMENT_OFFLINE_SUBMITTED",
				Title:          "Offline Payment Submitted",
				Body:           fmt.Sprintf("%s submitted an offline payment for invoice %s.", tenantName, invoice.Code),
				Data: map[string]any{
					"tenant_name":  tenantName,
					"unit_name":    "",
					"invoice_code": invoice.Code,
					"currency":     invoice.Currency,
					"amount":       lib.FormatAmount(lib.PesewasToCedis(invoice.TotalAmount)),
				},
				Channels:       []string{models.NotificationChannelInApp, models.NotificationChannelEmail},
				RecipientEmail: &pmEmail,
			})
		}
	}()

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
	// Get payment with tenant info for notifications
	populate := []string{
		"Invoice",
		"Invoice.LineItems",
		"Invoice.PayerLease.Tenant.TenantAccount",
		"Invoice.ContextLease.Unit",
	}
	payment, paymentErr := s.repo.GetByIDWithQuery(ctx, repository.GetPaymentQuery{
		PaymentID: input.PaymentID,
		Populate:  &populate,
	})

	if paymentErr != nil {
		if !errors.Is(paymentErr, gorm.ErrRecordNotFound) {
			return nil, pkg.InternalServerError(paymentErr.Error(), &pkg.RentLoopErrorParams{
				Err: paymentErr,
				Metadata: map[string]string{
					"function": "VerifyOfflinePayment",
					"action":   "get payment by id",
				},
			})
		}

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

	outerTx, hasOuterTx := lib.TransactionFromContext(ctx)
	hasOuterTx = hasOuterTx && outerTx != nil
	var transaction *gorm.DB
	if hasOuterTx {
		transaction = outerTx
	} else {
		transaction = s.appCtx.DB.Begin()
		if transaction.Error != nil {
			return nil, pkg.InternalServerError("failed to begin transaction", &pkg.RentLoopErrorParams{
				Err: transaction.Error,
			})
		}
	}
	transCtx := lib.WithTransaction(ctx, transaction)

	now := time.Now()
	invoiceFullyPaid := false

	// Update payment metadata with verification response
	existingMetadata := map[string]any{}
	if payment.Metadata != nil {
		if err := json.Unmarshal(*payment.Metadata, &existingMetadata); err != nil {
			if !hasOuterTx {
				transaction.Rollback()
			}
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
		if !hasOuterTx {
			transaction.Rollback()
		}
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
			if !hasOuterTx {
				transaction.Rollback()
			}
			return nil, pkg.InternalServerError("failed to update payment", &pkg.RentLoopErrorParams{
				Err: updatePaymentErr,
				Metadata: map[string]string{
					"payment_id": input.PaymentID,
					"action":     "updating payment to SUCCESSFUL",
				},
			})
		}

		// Calculate remaining balance after this payment
		remainingBalance, remainingBalanceErr := getRemainingInvoiceBalance(transCtx, GetRemainingInvoiceBalanceInput{
			repo:     s.repo,
			invoice:  payment.Invoice,
			statuses: []string{"SUCCESSFUL"},
		})
		if remainingBalanceErr != nil {
			if !hasOuterTx {
				transaction.Rollback()
			}
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
			invoiceFullyPaid = true
		} else {
			// Partial payment - mark as PARTIALLY_PAID
			newInvoiceStatus = "PARTIALLY_PAID"
		}

		_, updateInvoiceErr := s.invoiceService.UpdateInvoicePaymentStatus(transCtx, UpdateInvoicePaymentStatusInput{
			InvoiceID: payment.Invoice.ID.String(),
			Status:    newInvoiceStatus,
			PaidAt:    paidAt,
		})
		if updateInvoiceErr != nil {
			if !hasOuterTx {
				transaction.Rollback()
			}
			return nil, pkg.InternalServerError("failed to update invoice status", &pkg.RentLoopErrorParams{
				Err: updateInvoiceErr,
				Metadata: map[string]string{
					"payment_id": input.PaymentID,
					"invoice_id": payment.Invoice.ID.String(),
					"new_status": newInvoiceStatus,
				},
			})
		}

		// Post payment settlement journal entry
		transactionDate := now.Format(time.RFC3339)
		accounts := s.appCtx.Config.ChartOfAccounts
		reference := fmt.Sprintf("PMT-%s", payment.Invoice.Code)
		if payment.Reference != nil {
			reference = *payment.Reference
		}

		paymentLines := buildPaymentJournalLines(&payment.Invoice, payment.Amount, accounts)
		_, journalErr := s.accountingService.RecordInvoicePayment(transCtx, accounting.CreateJournalEntryRequest{
			Status:          string(accounting.JournalEntryStatusPosted),
			Reference:       reference,
			TransactionDate: &transactionDate,
			Metadata: map[string]any{
				"payment_id":   input.PaymentID,
				"invoice_id":   payment.Invoice.ID.String(),
				"invoice_code": payment.Invoice.Code,
				"amount":       payment.Amount,
				"currency":     payment.Invoice.Currency,
				"client_id":    lib.SafeString(payment.Invoice.ClientID),
				"property_id":  lib.SafeString(payment.Invoice.PropertyID),
			},
			Lines: paymentLines,
		})
		if journalErr != nil {
			if !hasOuterTx {
				transaction.Rollback()
			}
			return nil, pkg.InternalServerError("failed to record payment journal entry", &pkg.RentLoopErrorParams{
				Err: journalErr,
				Metadata: map[string]string{
					"payment_id": input.PaymentID,
					"invoice_id": payment.Invoice.ID.String(),
				},
			})
		}
	} else {
		// Update payment to FAILED
		payment.Status = "FAILED"
		payment.FailedAt = &now

		updatePaymentErr := s.repo.Update(transCtx, payment)
		if updatePaymentErr != nil {
			if !hasOuterTx {
				transaction.Rollback()
			}
			return nil, pkg.InternalServerError("failed to update payment", &pkg.RentLoopErrorParams{
				Err: updatePaymentErr,
				Metadata: map[string]string{
					"payment_id": input.PaymentID,
					"action":     "updating payment to FAILED",
				},
			})
		}
	}

	if !hasOuterTx {
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
	}

	// Fire-and-forget payment confirmation notifications when invoice is fully paid
	if invoiceFullyPaid && payment.Invoice.PayerLease != nil && payment.Invoice.PayerLease.TenantId != "" {
		tenant := payment.Invoice.PayerLease.Tenant
		unitName := ""
		if payment.Invoice.ContextLease != nil {
			unitName = payment.Invoice.ContextLease.Unit.Name
		}
		invoiceID := payment.Invoice.ID.String()
		amount := lib.FormatAmount(lib.PesewasToCedis(int64(payment.Invoice.TotalAmount)))

		recipientID := tenant.ID.String()
		channels := []string{models.NotificationChannelEmail, models.NotificationChannelSMS}
		if tenant.TenantAccount != nil {
			recipientID = tenant.TenantAccount.ID.String()
			channels = append(channels, models.NotificationChannelInApp, models.NotificationChannelPush)
		}
		orgID := ""
		if payment.Invoice.ClientID != nil {
			orgID = *payment.Invoice.ClientID
		}
		go func() {
			_, _ = s.notificationService.CreateNotification(context.Background(), CreateNotificationInput{
				OrganizationID: orgID,
				RecipientID:    recipientID,
				RecipientType:  models.NotificationRecipientTypeTenantAccount,
				Event:          "INVOICE_PAID",
				Title:          "Invoice Paid",
				Body:           fmt.Sprintf("Your invoice %s has been marked as paid.", payment.Invoice.Code),
				Data: map[string]any{
					"tenant_name":  tenant.FirstName,
					"invoice_id":   invoiceID,
					"invoice_code": payment.Invoice.Code,
					"unit_name":    unitName,
					"currency":     payment.Invoice.Currency,
					"amount":       amount,
				},
				Channels:       channels,
				RecipientEmail: tenant.Email,
				RecipientPhone: &tenant.Phone,
			})
		}()
	}

	return payment, nil
}

type GetRemainingInvoiceBalanceInput struct {
	repo     repository.PaymentRepository
	invoice  models.Invoice
	statuses []string
}

func failOfflinePayment(
	ctx context.Context,
	repo repository.PaymentRepository,
	payment *models.Payment,
	reason string,
) error {
	existingMetadata := map[string]any{}
	if payment.Metadata != nil {
		_ = json.Unmarshal(*payment.Metadata, &existingMetadata)
	}
	existingMetadata["offline_response"] = map[string]any{
		"reason": reason,
	}
	if metadataJSON, err := lib.InterfaceToJSON(existingMetadata); err == nil {
		payment.Metadata = metadataJSON
	}
	now := time.Now()
	payment.Status = "FAILED"
	payment.FailedAt = &now
	return repo.Update(ctx, payment)
}

func getRemainingInvoiceBalance(
	ctx context.Context,
	input GetRemainingInvoiceBalanceInput,
) (int64, error) {
	totalPaid, err := input.repo.SumAmountByInvoice(ctx, input.invoice.ID.String(), input.statuses)
	if err != nil {
		return 0, err
	}

	return input.invoice.TotalAmount - totalPaid, nil
}
