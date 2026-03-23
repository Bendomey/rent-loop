package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/accounting"
	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/sirupsen/logrus"
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

	remainingBalance, remainingBalanceErr := getRemainingInvoiceBalance(ctx, GetRemainingInvoiceBalanceInput{
		repo:     s.repo,
		invoice:  *invoice,
		statuses: []string{"SUCCESSFUL", "PENDING"},
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

	go func() {
		bgCtx := context.Background()
		if invoice.ContextLeaseID != nil && s.leaseService != nil {
			lease, leaseErr := s.leaseService.GetByIDWithPopulate(bgCtx, repository.GetLeaseQuery{
				ID:       *invoice.ContextLeaseID,
				Populate: &[]string{"ActivatedBy", "Unit", "Tenant"},
			})
			if leaseErr != nil || lease.ActivatedById == nil || lease.ActivatedBy == nil ||
				lease.ActivatedBy.Email == "" {
				return
			}
			message := strings.NewReplacer(
				"{{tenant_name}}", lease.Tenant.FirstName,
				"{{unit_name}}", lease.Unit.Name,
				"{{invoice_code}}", invoice.Code,
				"{{amount}}", lib.FormatAmount(lib.PesewasToCedis(invoice.TotalAmount)),
				"{{currency}}", invoice.Currency,
			).Replace(lib.ApplyGlobalVariableTemplate(s.appCtx.Config, lib.PM_OFFLINE_PAYMENT_SUBMITTED_BODY))
			pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
				Recipient: lease.ActivatedBy.Email,
				Subject:   lib.PM_OFFLINE_PAYMENT_SUBMITTED_SUBJECT,
				TextBody:  message,
			})
		} else if invoice.ContextTenantApplicationID != nil && s.tenantApplicationService != nil {
			ta, taErr := s.tenantApplicationService.GetOneTenantApplication(bgCtx, repository.GetTenantApplicationQuery{
				TenantApplicationID: *invoice.ContextTenantApplicationID,
				Populate:            &[]string{"CreatedBy"},
			})
			if taErr != nil || ta.CreatedBy.Email == "" {
				return
			}
			message := strings.NewReplacer(
				"{{tenant_name}}", ta.FirstName+" "+ta.LastName,
				"{{unit_name}}", "",
				"{{invoice_code}}", invoice.Code,
				"{{amount}}", lib.FormatAmount(lib.PesewasToCedis(invoice.TotalAmount)),
				"{{currency}}", invoice.Currency,
			).Replace(lib.ApplyGlobalVariableTemplate(s.appCtx.Config, lib.PM_OFFLINE_PAYMENT_SUBMITTED_BODY))
			pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
				Recipient: ta.CreatedBy.Email,
				Subject:   lib.PM_OFFLINE_PAYMENT_SUBMITTED_SUBJECT,
				TextBody:  message,
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
	populate := []string{"Invoice", "Invoice.PayerTenant.TenantAccount", "Invoice.ContextLease.Unit"}
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

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	now := time.Now()
	invoiceFullyPaid := false

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
		remainingBalance, remainingBalanceErr := getRemainingInvoiceBalance(transCtx, GetRemainingInvoiceBalanceInput{
			repo:     s.repo,
			invoice:  payment.Invoice,
			statuses: []string{"SUCCESSFUL"},
		})
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
			invoiceFullyPaid = true
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

		// Post payment receipt journal entry: Debit Cash/Bank, Credit AR
		transactionDate := now.Format(time.RFC3339)
		accounts := s.appCtx.Config.ChartOfAccounts
		reference := fmt.Sprintf("PMT-%s", payment.Invoice.Code)
		if payment.Reference != nil {
			reference = *payment.Reference
		}

		_, journalErr := s.accountingService.RecordInvoicePayment(transCtx, accounting.CreateJournalEntryRequest{
			Status:          string(accounting.JournalEntryStatusPosted),
			Reference:       reference,
			TransactionDate: &transactionDate,
			Metadata: map[string]any{
				"payment_id":   input.PaymentID,
				"invoice_id":   payment.Invoice.ID.String(),
				"invoice_code": payment.Invoice.Code,
				"amount":       payment.Amount,
				"currency":     payment.Currency,
			},
			Lines: []accounting.CreateJournalEntryLineRequest{
				{
					AccountID: accounts.CashBankAccountID,
					Debit:     payment.Amount,
					Credit:    0,
					Notes:     lib.StringPointer(fmt.Sprintf("Cash receipt for invoice %s", payment.Invoice.Code)),
				},
				{
					AccountID: accounts.AccountsReceivableID,
					Debit:     0,
					Credit:    payment.Amount,
					Notes: lib.StringPointer(
						fmt.Sprintf("AR reduction on payment for invoice %s", payment.Invoice.Code),
					),
				},
			},
		})
		if journalErr != nil {
			transaction.Rollback()
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

	// Fire-and-forget payment confirmation notifications when invoice is fully paid
	if invoiceFullyPaid && payment.Invoice.PayerTenant != nil {
		tenant := payment.Invoice.PayerTenant
		unitName := ""
		if payment.Invoice.ContextLease != nil {
			unitName = payment.Invoice.ContextLease.Unit.Name
		}
		message := strings.NewReplacer(
			"{{tenant_name}}", tenant.FirstName,
			"{{invoice_code}}", payment.Invoice.Code,
			"{{unit_name}}", unitName,
			"{{currency}}", payment.Invoice.Currency,
			"{{amount}}", lib.FormatAmount(lib.PesewasToCedis(int64(payment.Invoice.TotalAmount))),
		).Replace(lib.INVOICE_PAID_BODY)

		if tenant.Email != nil {
			go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
				Recipient: *tenant.Email,
				Subject:   lib.INVOICE_PAID_SUBJECT,
				TextBody:  message,
			})
		}

		go func() {
			if err := s.appCtx.Clients.GatekeeperAPI.SendSMS(context.Background(), gatekeeper.SendSMSInput{
				Recipient: tenant.Phone,
				Message:   message,
			}); err != nil {
				logrus.Errorf(
					"failed to send invoice paid SMS for invoice %s to tenant %s: %v",
					payment.Invoice.Code,
					tenant.ID.String(),
					err,
				)
			}
		}()

		if tenant.TenantAccount != nil {
			tenantAccountID := tenant.TenantAccount.ID.String()
			invoiceID := payment.Invoice.ID.String()
			templatedMessage := lib.ApplyGlobalVariableTemplate(s.appCtx.Config, message)
			go func() {
				if err := s.notificationService.SendToTenantAccount(
					context.Background(),
					tenantAccountID,
					lib.INVOICE_PAID_SUBJECT,
					templatedMessage,
					map[string]string{
						"type":         "INVOICE_PAID",
						"invoice_id":   invoiceID,
						"invoice_code": payment.Invoice.Code,
					},
				); err != nil {
					logrus.Errorf(
						"failed to send tenant account notification for invoice %s to tenant account %s: %v",
						payment.Invoice.Code,
						tenantAccountID,
						err,
					)
				}
			}()
		}
	}

	return payment, nil
}

type GetRemainingInvoiceBalanceInput struct {
	repo     repository.PaymentRepository
	invoice  models.Invoice
	statuses []string
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
