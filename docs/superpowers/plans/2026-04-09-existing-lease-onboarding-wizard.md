# Existing Lease Onboarding Wizard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a batch wizard that lets new landlords register up to 20 existing tenant-lease pairs in one submission, bypassing the full tenant-application flow.

**Architecture:** A new `BulkOnboardLeases` method on `TenantApplicationService` (all deps already injected) runs a single DB transaction per batch: create TenantApplication (Completed) → create Invoice (PAID, if deposits provided, bypassing Fincore) → GetOrCreateTenant → GetOrCreateTenantAccount → CreateLease (Active) → update unit status → fire notifications. The frontend is a React context-managed batch wizard with a persistent table overview and a 4-step per-tenant wizard, mirroring the existing tenant-application wizard pattern.

**Tech Stack:** Go (chi, GORM, go-playground/validator), React Router v7, React 19, TanStack Query v5, React Hook Form + Zod, Tailwind CSS v4, Shadcn/Radix UI, existing `useUploadObject` hook for PDF upload.

---

## File Map

**Backend — create/modify:**
- Modify: `services/main/internal/services/tenant-application.go` — add `BulkOnboardLeases` to interface + implementation
- Modify: `services/main/internal/handlers/lease.go` — add `BulkOnboardLeases` handler method
- Modify: `services/main/internal/router/client-user.go` — register new route

**Frontend — create:**
- Create: `apps/property-manager/app/api/leases/index.ts` (modify) — add `useBulkOnboardLeases` mutation
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/context.tsx`
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/step1.tsx`
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/step2.tsx`
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/step3.tsx`
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/step4.tsx`
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/index.tsx`
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/index.tsx`
- Create: `apps/property-manager/app/routes/_auth.properties.$propertyId.tenants.leases.bulk-onboard.tsx`

**Frontend — modify:**
- Modify: `apps/property-manager/app/modules/index.ts` — export new module
- Modify: `apps/property-manager/app/modules/properties/property/tenants/leases/index.tsx` — add entry-point callout

---

## Task 1: Add `BulkOnboardLeases` to `TenantApplicationService`

**Files:**
- Modify: `services/main/internal/services/tenant-application.go`

- [ ] **Step 1: Add `BulkOnboardLeases` to the `TenantApplicationService` interface**

In `services/main/internal/services/tenant-application.go`, add to the `TenantApplicationService` interface (after `ApproveTenantApplication`):

```go
BulkOnboardLeases(ctx context.Context, input BulkOnboardLeasesInput) error
```

- [ ] **Step 2: Define the input types**

Add these types after the `ApproveTenantApplicationInput` struct:

```go
type BulkOnboardLeaseEntry struct {
	UnitId                         string
	FirstName                      string
	OtherNames                     *string
	LastName                       string
	Email                          *string
	Phone                          string
	Gender                         string
	DateOfBirth                    time.Time
	Nationality                    string
	MaritalStatus                  string
	CurrentAddress                 string
	IDType                         string
	IDNumber                       string
	EmergencyContactName           string
	EmergencyContactPhone          string
	RelationshipToEmergencyContact string
	Occupation                     *string // defaults to "N/A" if nil
	Employer                       *string // defaults to "N/A" if nil
	RentFee                        int64
	RentFeeCurrency                string
	PaymentFrequency               *string
	MoveInDate                     time.Time
	StayDurationFrequency          string
	StayDuration                   int64
	PaidThroughDate                *time.Time
	InitialDepositFee              int64
	InitialDepositFeeCurrency      string
	SecurityDepositFee             int64
	SecurityDepositFeeCurrency     string
	LeaseAgreementDocumentUrl      string
}

type BulkOnboardLeasesInput struct {
	ClientUserID string
	PropertyID   string
	Entries      []BulkOnboardLeaseEntry
}
```

- [ ] **Step 3: Implement `BulkOnboardLeases` on `tenantApplicationService`**

Add this method at the end of `services/main/internal/services/tenant-application.go`:

```go
func (s *tenantApplicationService) BulkOnboardLeases(ctx context.Context, input BulkOnboardLeasesInput) error {
	if len(input.Entries) == 0 || len(input.Entries) > 20 {
		return pkg.BadRequestError("BatchSizeOutOfRange", nil)
	}

	// Pre-flight: validate all units belong to property and are available
	for _, entry := range input.Entries {
		unit, err := s.unitService.GetUnitByID(ctx, entry.UnitId)
		if err != nil {
			return err
		}
		if unit.PropertyID != input.PropertyID {
			return pkg.BadRequestError("UnitsNotUnderProperty", nil)
		}
		if unit.Status != "Unit.Status.Available" && unit.Status != "Unit.Status.PartiallyOccupied" {
			return pkg.BadRequestError("UnitNoLongerAvailable", nil)
		}
	}

	now := time.Now()

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	type notificationPayload struct {
		firstName   string
		unitName    string
		appCode     string
		phone       string
		email       *string
		accountPhone string
	}
	var notifications []notificationPayload

	for _, entry := range input.Entries {
		unit, err := s.unitService.GetUnitByID(ctx, entry.UnitId)
		if err != nil {
			transaction.Rollback()
			return err
		}

		occupation := "N/A"
		if entry.Occupation != nil {
			occupation = *entry.Occupation
		}
		employer := "N/A"
		if entry.Employer != nil {
			employer = *entry.Employer
		}

		// 1. Create TenantApplication (Completed immediately)
		tenantApp := models.TenantApplication{
			DesiredUnitId:                  entry.UnitId,
			RentFee:                        entry.RentFee,
			RentFeeCurrency:                entry.RentFeeCurrency,
			PaymentFrequency:               entry.PaymentFrequency,
			DesiredMoveInDate:              &entry.MoveInDate,
			StayDurationFrequency:          &entry.StayDurationFrequency,
			StayDuration:                   &entry.StayDuration,
			LeaseAgreementDocumentMode:     func() *string { s := "MANUAL"; return &s }(),
			LeaseAgreementDocumentUrl:      &entry.LeaseAgreementDocumentUrl,
			FirstName:                      entry.FirstName,
			OtherNames:                     entry.OtherNames,
			LastName:                       entry.LastName,
			Email:                          entry.Email,
			Phone:                          entry.Phone,
			Gender:                         entry.Gender,
			DateOfBirth:                    entry.DateOfBirth,
			Nationality:                    entry.Nationality,
			MaritalStatus:                  entry.MaritalStatus,
			CurrentAddress:                 entry.CurrentAddress,
			IDType:                         entry.IDType,
			IDNumber:                       entry.IDNumber,
			EmergencyContactName:           entry.EmergencyContactName,
			EmergencyContactPhone:          entry.EmergencyContactPhone,
			RelationshipToEmergencyContact: entry.RelationshipToEmergencyContact,
			Occupation:                     occupation,
			Employer:                       employer,
			OccupationAddress:              "N/A",
			InitialDepositFee:              &entry.InitialDepositFee,
			InitialDepositFeeCurrency:      entry.InitialDepositFeeCurrency,
			SecurityDepositFee:             &entry.SecurityDepositFee,
			SecurityDepositFeeCurrency:     entry.SecurityDepositFeeCurrency,
			CreatedById:                    input.ClientUserID,
			Status:                         "TenantApplication.Status.Completed",
			CompletedAt:                    &now,
			CompletedById:                  &input.ClientUserID,
		}
		if createAppErr := s.repo.Create(transCtx, &tenantApp); createAppErr != nil {
			transaction.Rollback()
			return pkg.InternalServerError(createAppErr.Error(), &pkg.RentLoopErrorParams{
				Err: createAppErr,
				Metadata: map[string]string{
					"function": "BulkOnboardLeases",
					"action":   "creating tenant application",
				},
			})
		}

		// 2. Create invoice as PAID (historical record, no Fincore posting)
		if entry.InitialDepositFee > 0 || entry.SecurityDepositFee > 0 {
			appID := tenantApp.ID.String()
			propertyID := input.PropertyID
			var lineItems []LineItemInput
			total := int64(0)
			if entry.InitialDepositFee > 0 {
				lineItems = append(lineItems, LineItemInput{
					Label:       "Initial Deposit",
					Category:    "INITIAL_DEPOSIT",
					Quantity:    1,
					UnitAmount:  entry.InitialDepositFee,
					TotalAmount: entry.InitialDepositFee,
					Currency:    entry.InitialDepositFeeCurrency,
				})
				total += entry.InitialDepositFee
			}
			if entry.SecurityDepositFee > 0 {
				lineItems = append(lineItems, LineItemInput{
					Label:       "Security Deposit",
					Category:    "SECURITY_DEPOSIT",
					Quantity:    1,
					UnitAmount:  entry.SecurityDepositFee,
					TotalAmount: entry.SecurityDepositFee,
					Currency:    entry.SecurityDepositFeeCurrency,
				})
				total += entry.SecurityDepositFee
			}
			paidAt := now
			_, invoiceErr := s.invoiceService.CreateInvoice(transCtx, CreateInvoiceInput{
				PropertyID:                 &propertyID,
				PayerType:                  "TENANT_APPLICATION",
				PayeeType:                  "PROPERTY_OWNER",
				ContextType:                "TENANT_APPLICATION",
				ContextTenantApplicationID: &appID,
				TotalAmount:                total,
				Taxes:                      0,
				SubTotal:                   total,
				Currency:                   entry.InitialDepositFeeCurrency,
				Status:                     "PAID",
				LineItems:                  lineItems,
			})
			if invoiceErr != nil {
				transaction.Rollback()
				return invoiceErr
			}
			_ = paidAt // paidAt set on the invoice struct via status="PAID" — the service sets IssuedAt only for ISSUED; PAID sets PaidAt manually below if needed
		}

		// 3. Get or create Tenant
		tenantInput := CreateTenantInput{
			FirstName:                      entry.FirstName,
			OtherNames:                     entry.OtherNames,
			LastName:                       entry.LastName,
			Email:                          entry.Email,
			Phone:                          entry.Phone,
			Gender:                         entry.Gender,
			DateOfBirth:                    entry.DateOfBirth,
			Nationality:                    entry.Nationality,
			MaritalStatus:                  entry.MaritalStatus,
			IDType:                         entry.IDType,
			IDNumber:                       entry.IDNumber,
			EmergencyContactName:           entry.EmergencyContactName,
			EmergencyContactPhone:          entry.EmergencyContactPhone,
			RelationshipToEmergencyContact: entry.RelationshipToEmergencyContact,
			Occupation:                     occupation,
			Employer:                       employer,
			OccupationAddress:              "N/A",
			CreatedById:                    input.ClientUserID,
		}
		tenant, tenantErr := s.tenantService.GetOrCreateTenant(transCtx, tenantInput)
		if tenantErr != nil {
			transaction.Rollback()
			return tenantErr
		}

		// 4. Get or create TenantAccount
		tenantAccount, accountErr := s.tenantAccountService.GetOrCreateTenantAccount(transCtx, CreateTenantAccountInput{
			TenantId:    tenant.ID.String(),
			PhoneNumber: entry.Phone,
		})
		if accountErr != nil {
			transaction.Rollback()
			return accountErr
		}

		// 5. Create Lease (Active)
		appIDStr := tenantApp.ID.String()
		meta := map[string]any{
			"initial_deposit_fee":          entry.InitialDepositFee,
			"initial_deposit_fee_currency": entry.InitialDepositFeeCurrency,
			"security_deposit_fee":         entry.SecurityDepositFee,
			"security_deposit_fee_currency": entry.SecurityDepositFeeCurrency,
		}
		if entry.PaidThroughDate != nil {
			meta["paid_through_date"] = entry.PaidThroughDate.Format(time.RFC3339)
		}
		_, leaseErr := s.leaseService.CreateLease(transCtx, CreateLeaseInput{
			Status:                    "Lease.Status.Active",
			UnitId:                    entry.UnitId,
			TenantId:                  tenant.ID.String(),
			TenantApplicationId:       appIDStr,
			RentFee:                   entry.RentFee,
			RentFeeCurrency:           entry.RentFeeCurrency,
			PaymentFrequency:          entry.PaymentFrequency,
			Meta:                      meta,
			MoveInDate:                entry.MoveInDate,
			StayDurationFrequency:     entry.StayDurationFrequency,
			StayDuration:              entry.StayDuration,
			LeaseAgreementDocumentUrl: entry.LeaseAgreementDocumentUrl,
		})
		if leaseErr != nil {
			transaction.Rollback()
			return leaseErr
		}

		// We must manually set ActivatedAt/ActivatedById on the lease because CreateLease doesn't accept those.
		// Do a direct update within the transaction — simpler than adding fields to CreateLeaseInput.
		if updateErr := transaction.WithContext(transCtx).
			Model(&models.Lease{}).
			Where("tenant_application_id = ?", appIDStr).
			Updates(map[string]any{
				"activated_at":      now,
				"activated_by_id":   input.ClientUserID,
				"next_billing_date": nil,
			}).Error; updateErr != nil {
			transaction.Rollback()
			return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
				Err: updateErr,
				Metadata: map[string]string{
					"function": "BulkOnboardLeases",
					"action":   "setting lease activated_at",
				},
			})
		}

		// 6. Update unit status
		occupyingLeases, err := s.leaseService.CountOccupyingByUnitID(transCtx, unit.ID.String())
		if err != nil {
			transaction.Rollback()
			return err
		}
		var newUnitStatus string
		if occupyingLeases >= int64(unit.MaxOccupantsAllowed) {
			newUnitStatus = "Unit.Status.Occupied"
		} else if occupyingLeases > 0 {
			newUnitStatus = "Unit.Status.PartiallyOccupied"
		}
		if newUnitStatus != "" && unit.Status != newUnitStatus {
			if updateErr := s.unitService.SetSystemUnitStatus(transCtx, UpdateUnitStatusInput{
				PropertyID: unit.PropertyID,
				UnitID:     unit.ID.String(),
				Status:     newUnitStatus,
			}); updateErr != nil {
				transaction.Rollback()
				return updateErr
			}
		}

		notifications = append(notifications, notificationPayload{
			firstName:    entry.FirstName,
			unitName:     unit.Name,
			appCode:      tenantApp.Code,
			phone:        entry.Phone,
			email:        entry.Email,
			accountPhone: tenantAccount.PhoneNumber,
		})
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "BulkOnboardLeases",
				"action":   "committing transaction",
			},
		})
	}

	// Fire notifications after commit (non-blocking goroutines)
	for _, n := range notifications {
		n := n
		r := strings.NewReplacer(
			"{{applicant_name}}", n.firstName,
			"{{unit_name}}", n.unitName,
			"{{application_code}}", n.appCode,
			"{{phone_number}}", n.accountPhone,
		)
		message := r.Replace(lib.TENANT_APPLICATION_APPROVED_BODY)
		smsMessage := r.Replace(lib.TENANT_APPLICATION_APPROVED_SMS_BODY)

		if n.email != nil {
			email := *n.email
			go pkg.SendEmail(s.appCtx.Config, pkg.SendEmailInput{
				Recipient: email,
				Subject:   lib.TENANT_APPLICATION_APPROVED_SUBJECT,
				TextBody:  message,
			})
		}
		go s.appCtx.Clients.GatekeeperAPI.SendSMS(context.Background(), gatekeeper.SendSMSInput{
			Recipient: n.phone,
			Message:   smsMessage,
		})
	}

	return nil
}
```

- [ ] **Step 4: Run the backend to confirm it compiles**

```bash
cd services/main && make lint-fix
```

Expected: no compilation errors. Fix any type mismatches before continuing.

- [ ] **Step 5: Commit**

```bash
cd services/main
git add internal/services/tenant-application.go
git commit -m "feat: add BulkOnboardLeases to TenantApplicationService"
```

---

## Task 2: Add `BulkOnboardLeases` handler to `LeaseHandler`

**Files:**
- Modify: `services/main/internal/handlers/lease.go`

- [ ] **Step 1: Define the request body struct**

Add to `services/main/internal/handlers/lease.go` (after the existing `CancelLeaseRequest` struct):

```go
type BulkOnboardLeaseEntryRequest struct {
	UnitId                         string     `json:"unit_id"                           validate:"required,uuid4"`
	FirstName                      string     `json:"first_name"                         validate:"required,min=2"`
	OtherNames                     *string    `json:"other_names,omitempty"`
	LastName                       string     `json:"last_name"                          validate:"required,min=2"`
	Email                          *string    `json:"email,omitempty"                    validate:"omitempty,email"`
	Phone                          string     `json:"phone"                              validate:"required"`
	Gender                         string     `json:"gender"                             validate:"required,oneof=Male Female"`
	DateOfBirth                    time.Time  `json:"date_of_birth"                      validate:"required"`
	Nationality                    string     `json:"nationality"                        validate:"required"`
	MaritalStatus                  string     `json:"marital_status"                     validate:"required,oneof=Single Married Divorced Widowed"`
	CurrentAddress                 string     `json:"current_address"                    validate:"required"`
	IDType                         string     `json:"id_type"                            validate:"required,oneof=NationalID Passport DriverLicense"`
	IDNumber                       string     `json:"id_number"                          validate:"required"`
	EmergencyContactName           string     `json:"emergency_contact_name"             validate:"required"`
	EmergencyContactPhone          string     `json:"emergency_contact_phone"            validate:"required"`
	RelationshipToEmergencyContact string     `json:"relationship_to_emergency_contact"  validate:"required"`
	Occupation                     *string    `json:"occupation,omitempty"`
	Employer                       *string    `json:"employer,omitempty"`
	RentFee                        int64      `json:"rent_fee"                           validate:"required,gte=1"`
	RentFeeCurrency                string     `json:"rent_fee_currency"                  validate:"required"`
	PaymentFrequency               *string    `json:"payment_frequency,omitempty"        validate:"omitempty,oneof=HOURLY DAILY MONTHLY QUARTERLY BIANNUALLY ANNUALLY ONETIME"`
	MoveInDate                     time.Time  `json:"move_in_date"                       validate:"required"`
	StayDurationFrequency          string     `json:"stay_duration_frequency"            validate:"required,oneof=HOURS DAYS MONTHS"`
	StayDuration                   int64      `json:"stay_duration"                      validate:"required,gte=1"`
	PaidThroughDate                *time.Time `json:"paid_through_date,omitempty"`
	InitialDepositFee              int64      `json:"initial_deposit_fee"                validate:"gte=0"`
	InitialDepositFeeCurrency      string     `json:"initial_deposit_fee_currency"       validate:"required"`
	SecurityDepositFee             int64      `json:"security_deposit_fee"               validate:"gte=0"`
	SecurityDepositFeeCurrency     string     `json:"security_deposit_fee_currency"      validate:"required"`
	LeaseAgreementDocumentUrl      string     `json:"lease_agreement_document_url"       validate:"required,url"`
}

type BulkOnboardLeasesRequest struct {
	Entries []BulkOnboardLeaseEntryRequest `json:"entries" validate:"required,min=1,max=20,dive"`
}
```

- [ ] **Step 2: Add the handler method with Swagger godoc**

Add after `CancelLease` in `services/main/internal/handlers/lease.go`:

```go
// BulkOnboardLeases godoc
//
//	@Summary		Bulk onboard existing leases (Client User)
//	@Description	Onboard up to 20 existing tenant-lease pairs in a single transaction. Creates TenantApplication, Invoice (if deposits provided), Tenant, TenantAccount, and Lease records. Designed for landlords migrating existing tenants into Rent-Loop.
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string						true	"Property ID"
//	@Param			body		body		BulkOnboardLeasesRequest	true	"Bulk onboard request body (max 20 entries)"
//	@Success		204			{object}	nil							"Bulk onboard successful"
//	@Failure		400			{object}	lib.HTTPError				"Validation or business rule error (e.g. UnitNoLongerAvailable)"
//	@Failure		401			{object}	string						"Invalid or absent authentication token"
//	@Failure		422			{object}	lib.HTTPError				"Request body validation error"
//	@Failure		500			{object}	string						"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases:bulk-onboard [post]
func (h *LeaseHandler) BulkOnboardLeases(w http.ResponseWriter, r *http.Request) {
	clientUser, clientUserOk := lib.ClientUserFromContext(r.Context())
	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	propertyID := chi.URLParam(r, "property_id")

	var body BulkOnboardLeasesRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	entries := make([]services.BulkOnboardLeaseEntry, 0, len(body.Entries))
	for _, e := range body.Entries {
		entries = append(entries, services.BulkOnboardLeaseEntry{
			UnitId:                         e.UnitId,
			FirstName:                      e.FirstName,
			OtherNames:                     e.OtherNames,
			LastName:                       e.LastName,
			Email:                          e.Email,
			Phone:                          e.Phone,
			Gender:                         e.Gender,
			DateOfBirth:                    e.DateOfBirth,
			Nationality:                    e.Nationality,
			MaritalStatus:                  e.MaritalStatus,
			CurrentAddress:                 e.CurrentAddress,
			IDType:                         e.IDType,
			IDNumber:                       e.IDNumber,
			EmergencyContactName:           e.EmergencyContactName,
			EmergencyContactPhone:          e.EmergencyContactPhone,
			RelationshipToEmergencyContact: e.RelationshipToEmergencyContact,
			Occupation:                     e.Occupation,
			Employer:                       e.Employer,
			RentFee:                        e.RentFee,
			RentFeeCurrency:                e.RentFeeCurrency,
			PaymentFrequency:               e.PaymentFrequency,
			MoveInDate:                     e.MoveInDate,
			StayDurationFrequency:          e.StayDurationFrequency,
			StayDuration:                   e.StayDuration,
			PaidThroughDate:                e.PaidThroughDate,
			InitialDepositFee:              e.InitialDepositFee,
			InitialDepositFeeCurrency:      e.InitialDepositFeeCurrency,
			SecurityDepositFee:             e.SecurityDepositFee,
			SecurityDepositFeeCurrency:     e.SecurityDepositFeeCurrency,
			LeaseAgreementDocumentUrl:      e.LeaseAgreementDocumentUrl,
		})
	}

	err := h.services.TenantApplicationService.BulkOnboardLeases(r.Context(), services.BulkOnboardLeasesInput{
		ClientUserID: clientUser.ID,
		PropertyID:   propertyID,
		Entries:      entries,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
```

- [ ] **Step 3: Compile check**

```bash
cd services/main && make lint-fix
```

Expected: no compilation errors.

- [ ] **Step 4: Commit**

```bash
git add internal/handlers/lease.go
git commit -m "feat: add BulkOnboardLeases handler to LeaseHandler"
```

---

## Task 3: Register the route

**Files:**
- Modify: `services/main/internal/router/client-user.go`

- [ ] **Step 1: Add the route inside the `/{property_id}` route group**

In `services/main/internal/router/client-user.go`, inside the `r.Route("/{property_id}", ...)` block (after the existing `r.Get("/leases", ...)` line):

```go
r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
    Post("/leases:bulk-onboard", handlers.LeaseHandler.BulkOnboardLeases)
```

- [ ] **Step 2: Regenerate Swagger docs and compile check**

```bash
cd services/main && make lint-fix
```

Expected: Swagger docs regenerate, no errors.

- [ ] **Step 3: Commit**

```bash
git add internal/router/client-user.go docs/
git commit -m "feat: register POST /leases:bulk-onboard route and regenerate swagger"
```

---

## Task 4: Add `useBulkOnboardLeases` API mutation (Frontend)

**Files:**
- Modify: `apps/property-manager/app/api/leases/index.ts`

- [ ] **Step 1: Add the TypeScript input types and mutation**

At the end of `apps/property-manager/app/api/leases/index.ts`, add:

```ts
export interface BulkOnboardLeaseEntryInput {
  unit_id: string
  first_name: string
  other_names?: string
  last_name: string
  email?: string
  phone: string
  gender: 'Male' | 'Female'
  date_of_birth: string // ISO string
  nationality: string
  marital_status: 'Single' | 'Married' | 'Divorced' | 'Widowed'
  current_address: string
  id_type: 'NationalID' | 'Passport' | 'DriverLicense'
  id_number: string
  emergency_contact_name: string
  emergency_contact_phone: string
  relationship_to_emergency_contact: string
  occupation?: string
  employer?: string
  rent_fee: number
  rent_fee_currency: string
  payment_frequency?: string
  move_in_date: string // ISO string
  stay_duration_frequency: 'HOURS' | 'DAYS' | 'MONTHS'
  stay_duration: number
  paid_through_date?: string // ISO string
  initial_deposit_fee: number
  initial_deposit_fee_currency: string
  security_deposit_fee: number
  security_deposit_fee_currency: string
  lease_agreement_document_url: string
}

const bulkOnboardLeases = async (props: {
  clientId: string
  propertyId: string
  entries: BulkOnboardLeaseEntryInput[]
}) => {
  try {
    await fetchClient(
      `/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/leases:bulk-onboard`,
      {
        method: 'POST',
        body: JSON.stringify({ entries: props.entries }),
      },
    )
  } catch (error: unknown) {
    if (error instanceof Response) {
      const response = await error.json()
      throw new Error(response.errors?.message || 'Unknown error')
    }
    if (error instanceof Error) throw error
  }
}

export const useBulkOnboardLeases = () =>
  useMutation({ mutationFn: bulkOnboardLeases })
```

- [ ] **Step 2: Commit**

```bash
cd apps/property-manager
git add app/api/leases/index.ts
git commit -m "feat: add useBulkOnboardLeases mutation"
```

---

## Task 5: Create the batch context

**Files:**
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/context.tsx`

- [ ] **Step 1: Create the context file**

```tsx
import { createContext, useContext, useState } from 'react'
import type { BulkOnboardLeaseEntryInput } from '~/api/leases'

export interface DraftLeaseEntry {
  id: string // local uuid for table keying — use crypto.randomUUID()
  unit_id: string
  unit_name: string
  tenant_name: string // derived: first_name + ' ' + last_name
  rent_fee: number
  rent_fee_currency: string
  lease_agreement_document_url: string
  formData: Partial<BulkOnboardLeaseEntryInput>
  isComplete: boolean
  missingFields: string[]
}

interface BulkOnboardContextType {
  entries: DraftLeaseEntry[]
  editingEntryId: string | null // null = table view; set to entry.id = edit mode; 'new' = new entry wizard
  isSubmitting: boolean
  addOrUpdateEntry: (entry: DraftLeaseEntry) => void
  removeEntry: (id: string) => void
  startEdit: (id: string | null) => void
  setIsSubmitting: (v: boolean) => void
}

const BulkOnboardContext = createContext<BulkOnboardContextType | undefined>(undefined)

export function BulkOnboardProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<DraftLeaseEntry[]>([])
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addOrUpdateEntry = (entry: DraftLeaseEntry) => {
    setEntries((prev) => {
      const existing = prev.findIndex((e) => e.id === entry.id)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = entry
        return next
      }
      return [...prev, entry]
    })
  }

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const startEdit = (id: string | null) => setEditingEntryId(id)

  return (
    <BulkOnboardContext.Provider
      value={{ entries, editingEntryId, isSubmitting, addOrUpdateEntry, removeEntry, startEdit, setIsSubmitting }}
    >
      {children}
    </BulkOnboardContext.Provider>
  )
}

export function useBulkOnboard() {
  const ctx = useContext(BulkOnboardContext)
  if (!ctx) throw new Error('useBulkOnboard must be used within BulkOnboardProvider')
  return ctx
}

export function isDraftComplete(entry: Partial<BulkOnboardLeaseEntryInput> & { lease_agreement_document_url?: string }): {
  isComplete: boolean
  missingFields: string[]
} {
  const required: Array<keyof BulkOnboardLeaseEntryInput> = [
    'unit_id', 'first_name', 'last_name', 'phone', 'gender', 'date_of_birth',
    'nationality', 'marital_status', 'current_address', 'id_type', 'id_number',
    'emergency_contact_name', 'emergency_contact_phone', 'relationship_to_emergency_contact',
    'rent_fee', 'rent_fee_currency', 'move_in_date', 'stay_duration_frequency', 'stay_duration',
    'initial_deposit_fee_currency', 'security_deposit_fee_currency',
    'lease_agreement_document_url',
  ]
  const missingFields = required.filter((k) => !entry[k] && entry[k] !== 0)
  return { isComplete: missingFields.length === 0, missingFields }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/context.tsx
git commit -m "feat: add BulkOnboard batch context"
```

---

## Task 6: Wizard Step 1 — Unit Selection

**Files:**
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/step1.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useBulkOnboard } from '../context'
import { UnitSelect } from '~/components/SingleSelect/unit-select'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { TypographyH2, TypographyMuted, TypographySmall } from '~/components/ui/typography'
import { safeString } from '~/lib/strings'
import { useProperty } from '~/providers/property-provider'

const Schema = z.object({
  unit_id: z.string({ error: 'Please select a unit' }).min(1),
  unit_name: z.string(),
})

type FormValues = z.infer<typeof Schema>

interface Step1Props {
  initialValues?: Partial<FormValues>
  onNext: (values: FormValues) => void
  onCancel: () => void
}

export function WizardStep1({ initialValues, onNext, onCancel }: Step1Props) {
  const { clientUserProperty } = useProperty()
  const { entries, editingEntryId } = useBulkOnboard()
  const propertyId = safeString(clientUserProperty?.property_id)

  // Exclude units already used in the current batch (except the one being edited)
  const excludedUnitIds = entries
    .filter((e) => e.id !== editingEntryId)
    .map((e) => e.unit_id)

  const { setValue, watch, formState, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: initialValues ?? {},
  })

  const onSubmit = (data: FormValues) => onNext(data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto mb-10 space-y-8 md:max-w-2xl">
      <div className="mt-10 space-y-2 border-b pb-6">
        <TypographyH2 className="text-2xl font-bold">Select Unit</TypographyH2>
        <TypographyMuted>Choose which unit this tenant is occupying.</TypographyMuted>
      </div>

      <div className="space-y-4 rounded-lg border bg-slate-50 dark:bg-slate-900 p-6">
        <Label className="text-base font-semibold">Unit</Label>
        <UnitSelect
          label=""
          property_id={propertyId}
          value={watch('unit_id')}
          excludedUnitIds={excludedUnitIds}
          statusFilter={['Unit.Status.Available', 'Unit.Status.PartiallyOccupied']}
          onChange={({ id, name }) => {
            setValue('unit_id', id, { shouldDirty: true, shouldValidate: true })
            setValue('unit_name', name)
          }}
        />
        {formState.errors?.unit_id ? (
          <TypographySmall className="text-destructive">
            {formState.errors.unit_id.message}
          </TypographySmall>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Back to Overview
        </Button>
        <Button
          type="submit"
          disabled={!formState.isDirty && !initialValues?.unit_id}
          className="bg-rose-600 hover:bg-rose-700"
        >
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
```

**Note:** The `UnitSelect` component currently accepts `property_id` and `value`. You will need to check if it supports `excludedUnitIds` and `statusFilter` props — if not, pass `onChange` and implement filtering by checking the selected unit after selection, or add those props to the component. If `UnitSelect` doesn't support these props, the simplest workaround is to validate post-selection: check if `unit_id` is in `excludedUnitIds` and show an inline error.

- [ ] **Step 2: Commit**

```bash
git add apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/step1.tsx
git commit -m "feat: add bulk onboard wizard step1 (unit selection)"
```

---

## Task 7: Wizard Step 2 — Tenant Info

**Files:**
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/step2.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '~/components/ui/select'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'

const Schema = z.object({
  first_name: z.string({ error: 'Required' }).min(2),
  other_names: z.string().optional(),
  last_name: z.string({ error: 'Required' }).min(2),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string({ error: 'Required' }).min(9),
  gender: z.enum(['Male', 'Female'], { error: 'Required' }),
  date_of_birth: z.date({ error: 'Required' }),
  nationality: z.string({ error: 'Required' }).min(2),
  marital_status: z.enum(['Single', 'Married', 'Divorced', 'Widowed'], { error: 'Required' }),
  current_address: z.string({ error: 'Required' }).min(3),
  id_type: z.enum(['NationalID', 'Passport', 'DriverLicense'], { error: 'Required' }),
  id_number: z.string({ error: 'Required' }).min(2),
  emergency_contact_name: z.string({ error: 'Required' }).min(2),
  emergency_contact_phone: z.string({ error: 'Required' }).min(9),
  relationship_to_emergency_contact: z.string({ error: 'Required' }).min(2),
  occupation: z.string().optional(),
  employer: z.string().optional(),
})

export type Step2Values = z.infer<typeof Schema>

interface Step2Props {
  initialValues?: Partial<Step2Values>
  onNext: (values: Step2Values) => void
  onBack: () => void
  onCancel: () => void
}

export function WizardStep2({ initialValues, onNext, onBack, onCancel }: Step2Props) {
  const form = useForm<Step2Values>({
    resolver: zodResolver(Schema),
    defaultValues: {
      ...initialValues,
      date_of_birth: initialValues?.date_of_birth
        ? new Date(initialValues.date_of_birth)
        : undefined,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="mx-auto mb-10 space-y-6 md:max-w-2xl">
        <div className="mt-10 space-y-2 border-b pb-6">
          <TypographyH2 className="text-2xl font-bold">Tenant Information</TypographyH2>
          <TypographyMuted>Basic details about the tenant.</TypographyMuted>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField control={form.control} name="first_name" render={({ field }) => (
            <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="last_name" render={({ field }) => (
            <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="other_names" render={({ field }) => (
            <FormItem><FormLabel>Other Names</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Phone *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem><FormLabel>Gender *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="date_of_birth" render={({ field }) => (
            <FormItem><FormLabel>Date of Birth *</FormLabel>
              <DatePickerInput
                value={field.value ? localizedDayjs(field.value).toDate() : undefined}
                onChange={(d) => field.onChange(d)}
              />
              <FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="nationality" render={({ field }) => (
            <FormItem><FormLabel>Nationality *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="marital_status" render={({ field }) => (
            <FormItem><FormLabel>Marital Status *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                <SelectContent>
                  {['Single', 'Married', 'Divorced', 'Widowed'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="current_address" render={({ field }) => (
            <FormItem className="md:col-span-2"><FormLabel>Current Address *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="text-base font-semibold">ID Information</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField control={form.control} name="id_type" render={({ field }) => (
            <FormItem><FormLabel>ID Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="NationalID">National ID</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="DriverLicense">Driver License</SelectItem>
                </SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="id_number" render={({ field }) => (
            <FormItem><FormLabel>ID Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="text-base font-semibold">Emergency Contact</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField control={form.control} name="emergency_contact_name" render={({ field }) => (
            <FormItem><FormLabel>Contact Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="emergency_contact_phone" render={({ field }) => (
            <FormItem><FormLabel>Contact Phone *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="relationship_to_emergency_contact" render={({ field }) => (
            <FormItem><FormLabel>Relationship *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="text-base font-semibold">Employment (Optional)</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField control={form.control} name="occupation" render={({ field }) => (
            <FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="employer" render={({ field }) => (
            <FormItem><FormLabel>Employer / School</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="flex items-center justify-between border-t pt-6">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Back to Overview</Button>
            <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
          </div>
          <Button type="submit" className="bg-rose-600 hover:bg-rose-700">
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/step2.tsx
git commit -m "feat: add bulk onboard wizard step2 (tenant info)"
```

---

## Task 8: Wizard Step 3 — Lease Terms

**Files:**
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/step3.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '~/components/ui/select'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'

const Schema = z.object({
  rent_fee: z.number({ error: 'Required' }).min(1, 'Must be > 0'),
  rent_fee_currency: z.string({ error: 'Required' }),
  payment_frequency: z.enum(['HOURLY', 'DAILY', 'MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'ANNUALLY', 'ONETIME']).optional(),
  move_in_date: z.date({ error: 'Required' }),
  stay_duration: z.number({ error: 'Required' }).min(1),
  stay_duration_frequency: z.enum(['HOURS', 'DAYS', 'MONTHS'], { error: 'Required' }),
  paid_through_date: z.date().optional(),
  initial_deposit_fee: z.number().min(0).default(0),
  initial_deposit_fee_currency: z.string({ error: 'Required' }),
  security_deposit_fee: z.number().min(0).default(0),
  security_deposit_fee_currency: z.string({ error: 'Required' }),
})

export type Step3Values = z.infer<typeof Schema>

interface Step3Props {
  initialValues?: Partial<Step3Values>
  onNext: (values: Step3Values) => void
  onBack: () => void
  onCancel: () => void
}

const CURRENCIES = ['GHS', 'USD', 'EUR', 'GBP']
const FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'BIANNUALLY', label: 'Bi-Annually' },
  { value: 'ANNUALLY', label: 'Annually' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'HOURLY', label: 'Hourly' },
  { value: 'ONETIME', label: 'One Time' },
]
const DURATION_FREQUENCIES = [
  { value: 'MONTHS', label: 'Months' },
  { value: 'DAYS', label: 'Days' },
  { value: 'HOURS', label: 'Hours' },
]

export function WizardStep3({ initialValues, onNext, onBack, onCancel }: Step3Props) {
  const form = useForm<Step3Values>({
    resolver: zodResolver(Schema),
    defaultValues: {
      rent_fee_currency: 'GHS',
      initial_deposit_fee: 0,
      initial_deposit_fee_currency: 'GHS',
      security_deposit_fee: 0,
      security_deposit_fee_currency: 'GHS',
      stay_duration_frequency: 'MONTHS',
      ...initialValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="mx-auto mb-10 space-y-6 md:max-w-2xl">
        <div className="mt-10 space-y-2 border-b pb-6">
          <TypographyH2 className="text-2xl font-bold">Lease Terms</TypographyH2>
          <TypographyMuted>Financial setup and lease duration.</TypographyMuted>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField control={form.control} name="rent_fee" render={({ field }) => (
            <FormItem>
              <FormLabel>Rent Fee *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="rent_fee_currency" render={({ field }) => (
            <FormItem><FormLabel>Currency *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="payment_frequency" render={({ field }) => (
            <FormItem className="md:col-span-2"><FormLabel>Payment Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger></FormControl>
                <SelectContent>{FREQUENCIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="move_in_date" render={({ field }) => (
            <FormItem><FormLabel>Move-In Date *</FormLabel>
              <DatePickerInput
                value={field.value ? localizedDayjs(field.value).toDate() : undefined}
                onChange={(d) => field.onChange(d)}
              />
              <FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="stay_duration" render={({ field }) => (
            <FormItem><FormLabel>Lease Duration *</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
              </FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="stay_duration_frequency" render={({ field }) => (
            <FormItem><FormLabel>Duration Unit *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{DURATION_FREQUENCIES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="paid_through_date" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Last Payment / Paid Through Date</FormLabel>
              <DatePickerInput
                value={field.value ? localizedDayjs(field.value).toDate() : undefined}
                onChange={(d) => field.onChange(d)}
              />
              <FormDescription>Used to determine when the next rent billing cycle starts.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="text-base font-semibold">Deposits (Optional)</p>
          <p className="text-muted-foreground text-sm">Leave at 0 if no deposit was collected.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField control={form.control} name="initial_deposit_fee" render={({ field }) => (
            <FormItem><FormLabel>Initial Deposit</FormLabel>
              <FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
              <FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="initial_deposit_fee_currency" render={({ field }) => (
            <FormItem><FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="security_deposit_fee" render={({ field }) => (
            <FormItem><FormLabel>Security Deposit</FormLabel>
              <FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
              <FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="security_deposit_fee_currency" render={({ field }) => (
            <FormItem><FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
        </div>

        <div className="flex items-center justify-between border-t pt-6">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Back to Overview</Button>
            <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
          </div>
          <Button type="submit" className="bg-rose-600 hover:bg-rose-700">
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/step3.tsx
git commit -m "feat: add bulk onboard wizard step3 (lease terms)"
```

---

## Task 9: Wizard Step 4 — PDF Upload

**Files:**
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/step4.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { ArrowLeft, FileText, UploadCloud } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH2, TypographyMuted, TypographySmall } from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'

interface Step4Props {
  initialUrl?: string
  onSave: (url: string) => void
  onBack: () => void
  onCancel: () => void
}

export function WizardStep4({ initialUrl, onSave, onBack, onCancel }: Step4Props) {
  const { upload, isLoading, objectUrl, error } = useUploadObject('lease-agreements')
  const inputRef = useRef<HTMLInputElement>(null)

  const resolvedUrl = objectUrl ?? initialUrl

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are accepted.')
      return
    }
    await upload(file)
  }

  return (
    <div className="mx-auto mb-10 space-y-8 md:max-w-2xl">
      <div className="mt-10 space-y-2 border-b pb-6">
        <TypographyH2 className="text-2xl font-bold">Upload Lease Agreement</TypographyH2>
        <TypographyMuted>Upload the existing PDF lease agreement for this tenant.</TypographyMuted>
      </div>

      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-10 dark:border-slate-700 dark:bg-slate-900 hover:border-rose-400 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {isLoading ? (
          <Spinner />
        ) : resolvedUrl ? (
          <>
            <FileText className="mb-3 h-10 w-10 text-rose-600" />
            <p className="text-sm font-medium text-rose-600">PDF uploaded successfully</p>
            <p className="text-muted-foreground mt-1 text-xs">Click to replace</p>
          </>
        ) : (
          <>
            <UploadCloud className="mb-3 h-10 w-10 text-slate-400" />
            <p className="text-sm font-medium">Click to upload PDF</p>
            <p className="text-muted-foreground mt-1 text-xs">PDF files only</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error ? (
        <TypographySmall className="text-destructive">Upload failed. Please try again.</TypographySmall>
      ) : null}

      <div className="flex items-center justify-between border-t pt-6">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Back to Overview</Button>
          <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
        </div>
        <Button
          type="button"
          disabled={!resolvedUrl || isLoading}
          className="bg-rose-600 hover:bg-rose-700"
          onClick={() => resolvedUrl && onSave(resolvedUrl)}
        >
          Save & Back to Table
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/step4.tsx
git commit -m "feat: add bulk onboard wizard step4 (PDF upload)"
```

---

## Task 10: Wizard Shell

**Files:**
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/index.tsx`

- [ ] **Step 1: Create the wizard shell that wires all 4 steps together**

```tsx
import { useState } from 'react'
import { WizardStep1 } from './step1'
import { WizardStep2 } from './step2'
import type { Step2Values } from './step2'
import { WizardStep3 } from './step3'
import type { Step3Values } from './step3'
import { WizardStep4 } from './step4'
import { isDraftComplete, useBulkOnboard } from '../context'
import type { DraftLeaseEntry } from '../context'
import type { BulkOnboardLeaseEntryInput } from '~/api/leases'
import { localizedDayjs } from '~/lib/date'

const TOTAL_STEPS = 4

interface WizardData {
  unit_id: string
  unit_name: string
  step2: Step2Values
  step3: Step3Values
  lease_agreement_document_url: string
}

interface BulkOnboardWizardProps {
  editingEntry?: DraftLeaseEntry
}

export function BulkOnboardWizard({ editingEntry }: BulkOnboardWizardProps) {
  const { addOrUpdateEntry, startEdit } = useBulkOnboard()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<Partial<WizardData>>(() => {
    if (!editingEntry) return {}
    const fd = editingEntry.formData
    return {
      unit_id: editingEntry.unit_id,
      unit_name: editingEntry.unit_name,
      step2: fd as unknown as Step2Values,
      step3: fd as unknown as Step3Values,
      lease_agreement_document_url: editingEntry.lease_agreement_document_url,
    }
  })

  const progressPct = (step / TOTAL_STEPS) * 100

  const handleSave = (leaseUrl: string) => {
    const formData: BulkOnboardLeaseEntryInput = {
      unit_id: data.unit_id!,
      first_name: data.step2!.first_name,
      other_names: data.step2!.other_names,
      last_name: data.step2!.last_name,
      email: data.step2!.email || undefined,
      phone: data.step2!.phone,
      gender: data.step2!.gender,
      date_of_birth: localizedDayjs(data.step2!.date_of_birth).toISOString(),
      nationality: data.step2!.nationality,
      marital_status: data.step2!.marital_status,
      current_address: data.step2!.current_address,
      id_type: data.step2!.id_type,
      id_number: data.step2!.id_number,
      emergency_contact_name: data.step2!.emergency_contact_name,
      emergency_contact_phone: data.step2!.emergency_contact_phone,
      relationship_to_emergency_contact: data.step2!.relationship_to_emergency_contact,
      occupation: data.step2!.occupation,
      employer: data.step2!.employer,
      rent_fee: data.step3!.rent_fee,
      rent_fee_currency: data.step3!.rent_fee_currency,
      payment_frequency: data.step3!.payment_frequency,
      move_in_date: localizedDayjs(data.step3!.move_in_date).toISOString(),
      stay_duration_frequency: data.step3!.stay_duration_frequency,
      stay_duration: data.step3!.stay_duration,
      paid_through_date: data.step3!.paid_through_date
        ? localizedDayjs(data.step3!.paid_through_date).toISOString()
        : undefined,
      initial_deposit_fee: data.step3!.initial_deposit_fee,
      initial_deposit_fee_currency: data.step3!.initial_deposit_fee_currency,
      security_deposit_fee: data.step3!.security_deposit_fee,
      security_deposit_fee_currency: data.step3!.security_deposit_fee_currency,
      lease_agreement_document_url: leaseUrl,
    }

    const { isComplete, missingFields } = isDraftComplete(formData)

    const entry: DraftLeaseEntry = {
      id: editingEntry?.id ?? crypto.randomUUID(),
      unit_id: data.unit_id!,
      unit_name: data.unit_name!,
      tenant_name: `${formData.first_name} ${formData.last_name}`,
      rent_fee: formData.rent_fee,
      rent_fee_currency: formData.rent_fee_currency,
      lease_agreement_document_url: leaseUrl,
      formData,
      isComplete,
      missingFields,
    }

    addOrUpdateEntry(entry)
    startEdit(null)
  }

  return (
    <main className="w-full">
      <div className="-mx-2 w-full md:-mx-7">
        <div
          className="bg-rose-600 transition-all duration-300"
          style={{ height: '3px', width: `${progressPct}%` }}
        />
        <div className="flex min-h-[88vh] items-center justify-center">
          <div className="w-full max-w-4xl px-4 md:px-0">
            {step === 1 && (
              <WizardStep1
                initialValues={data.unit_id ? { unit_id: data.unit_id, unit_name: data.unit_name } : undefined}
                onNext={(v) => { setData((d) => ({ ...d, unit_id: v.unit_id, unit_name: v.unit_name })); setStep(2) }}
                onCancel={() => startEdit(null)}
              />
            )}
            {step === 2 && (
              <WizardStep2
                initialValues={data.step2}
                onNext={(v) => { setData((d) => ({ ...d, step2: v })); setStep(3) }}
                onBack={() => setStep(1)}
                onCancel={() => startEdit(null)}
              />
            )}
            {step === 3 && (
              <WizardStep3
                initialValues={data.step3}
                onNext={(v) => { setData((d) => ({ ...d, step3: v })); setStep(4) }}
                onBack={() => setStep(2)}
                onCancel={() => startEdit(null)}
              />
            )}
            {step === 4 && (
              <WizardStep4
                initialUrl={data.lease_agreement_document_url}
                onSave={handleSave}
                onBack={() => setStep(3)}
                onCancel={() => startEdit(null)}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/wizard/index.tsx
git commit -m "feat: add bulk onboard wizard shell"
```

---

## Task 11: Table View (Module Root)

**Files:**
- Create: `apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/index.tsx`

- [ ] **Step 1: Create the table view module**

```tsx
import { AlertCircle, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { BulkOnboardWizard } from './wizard'
import { BulkOnboardProvider, useBulkOnboard } from './context'
import { useBulkOnboardLeases } from '~/api/leases'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '~/components/ui/table'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

const MAX_ENTRIES = 20

function BulkOnboardTable() {
  const { entries, editingEntryId, startEdit, removeEntry, isSubmitting, setIsSubmitting } = useBulkOnboard()
  const { clientUserProperty } = useProperty()
  const { clientUser } = useClient()
  const navigate = useNavigate()
  const { mutateAsync: bulkOnboard } = useBulkOnboardLeases()

  const propertyId = safeString(clientUserProperty?.property_id)
  const clientId = safeString(clientUser?.client_id)

  if (editingEntryId !== null) {
    const editingEntry = entries.find((e) => e.id === editingEntryId)
    return <BulkOnboardWizard editingEntry={editingEntry} />
  }

  const allComplete = entries.length > 0 && entries.every((e) => e.isComplete)

  const handleSubmitAll = async () => {
    if (!allComplete || isSubmitting) return
    setIsSubmitting(true)
    try {
      await bulkOnboard({
        clientId,
        propertyId,
        entries: entries.map((e) => e.formData as Parameters<typeof bulkOnboard>[0]['entries'][number]),
      })
      toast.success(`${entries.length} lease${entries.length > 1 ? 's' : ''} onboarded successfully.`)
      void navigate(`/properties/${propertyId}/tenants/leases`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-6 my-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <TypographyH2 className="text-xl font-bold">Onboard Existing Tenants</TypographyH2>
          <TypographyMuted>
            {clientUserProperty?.property?.name} · {entries.length} / {MAX_ENTRIES} added
          </TypographyMuted>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={entries.length >= MAX_ENTRIES || isSubmitting}
            onClick={() => startEdit('new')}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Tenant
          </Button>
          <Button
            disabled={!allComplete || isSubmitting}
            className="bg-rose-600 hover:bg-rose-700"
            onClick={handleSubmitAll}
          >
            {isSubmitting ? 'Submitting…' : `Submit All (${entries.length})`}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-1 rounded-full bg-rose-600 transition-all"
          style={{ width: `${(entries.length / MAX_ENTRIES) * 100}%` }}
        />
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <TypographyMuted className="mb-4">No tenants added yet.</TypographyMuted>
          <Button onClick={() => startEdit('new')} className="bg-rose-600 hover:bg-rose-700">
            <Plus className="mr-1 h-4 w-4" /> Add First Tenant
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border shadow-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.tenant_name}</TableCell>
                  <TableCell>{entry.unit_name}</TableCell>
                  <TableCell>
                    {formatAmount(convertPesewasToCedis(entry.rent_fee))} {entry.rent_fee_currency}
                  </TableCell>
                  <TableCell>
                    {entry.isComplete ? (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        <AlertCircle className="mr-1 h-3 w-3" /> {entry.missingFields[0] ?? 'Incomplete'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(entry.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => removeEntry(entry.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {entries.length >= MAX_ENTRIES && (
        <p className="text-muted-foreground rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-sm">
          Maximum of {MAX_ENTRIES} tenants per submission reached. Submit this batch first, then start a new one.
        </p>
      )}
    </div>
  )
}

export function BulkOnboardModule() {
  return (
    <BulkOnboardProvider>
      <BulkOnboardTable />
    </BulkOnboardProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/property-manager/app/modules/properties/property/tenants/leases/bulk-onboard/index.tsx
git commit -m "feat: add bulk onboard table view module"
```

---

## Task 12: Route File

**Files:**
- Create: `apps/property-manager/app/routes/_auth.properties.$propertyId.tenants.leases.bulk-onboard.tsx`

- [ ] **Step 1: Create the route file**

```tsx
import type { Route } from './+types/_auth.properties.$propertyId.tenants.leases.bulk-onboard'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { BulkOnboardModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
  const clientUserProperty = context.get(propertyContext)
  return {
    origin: getDomainUrl(request),
    clientUserProperty,
  }
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
  return getSocialMetas({
    title: `Onboard Existing Tenants | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
    url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
    origin: loaderData.origin,
  })
}

export default BulkOnboardModule
```

- [ ] **Step 2: Export from modules/index.ts**

Add to `apps/property-manager/app/modules/index.ts`:

```ts
export * from './properties/property/tenants/leases/bulk-onboard'
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd apps/property-manager && yarn types:check
```

Expected: no type errors. Fix any before continuing.

- [ ] **Step 4: Commit**

```bash
git add app/routes/_auth.properties.$propertyId.tenants.leases.bulk-onboard.tsx app/modules/index.ts
git commit -m "feat: add bulk onboard route"
```

---

## Task 13: Entry Point on Leases List Page

**Files:**
- Modify: `apps/property-manager/app/modules/properties/property/tenants/leases/index.tsx`

- [ ] **Step 1: Add a callout card when there are zero active leases**

Read the current `leases/index.tsx` to find where the table renders. Add this callout above the table (or in the empty state) — the `data` from `useGetPropertyLeases` returns `rows`:

```tsx
// Near the top of the component, after the existing imports — add:
import { History, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CardContent } from '~/components/ui/card'
```

Add this block above the `<DataTable ...>` or in the empty-state area. Find where the component renders content and add before the table:

```tsx
{/* Entry point for bulk onboard — show when the list is empty */}
{!isPending && data?.rows?.length === 0 && (
  <Card className="shadow-none border-dashed">
    <CardContent className="flex items-center justify-between py-5">
      <div className="flex items-center gap-3">
        <History className="h-6 w-6 text-rose-600 shrink-0" />
        <div>
          <p className="font-semibold text-sm">Have existing tenants?</p>
          <p className="text-muted-foreground text-sm">Quickly onboard all your current tenants and their leases.</p>
        </div>
      </div>
      <Link to={`/properties/${propertyId}/tenants/leases/bulk-onboard`}>
        <Button variant="outline" size="sm">
          Get started <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </Link>
    </CardContent>
  </Card>
)}
```

- [ ] **Step 2: Run lint + type check**

```bash
cd apps/property-manager && yarn lint && yarn types:check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/modules/properties/property/tenants/leases/index.tsx
git commit -m "feat: add bulk onboard entry point callout to leases list"
```

---

## Self-Review Checklist

- [x] **BulkOnboardLeases service** — creates TenantApplication (Completed), Invoice (PAID if deposits > 0, skips Fincore), Tenant, TenantAccount, Lease (Active, ActivatedAt set inline), unit status update, post-commit notifications
- [x] **Batch cap** — validated in service (`len > 20` → error) and in handler request struct (`validate:"max=20"`)
- [x] **Unit validation** — pre-flight: property ownership + status check before any writes
- [x] **Rollback on any step failure** — every error path calls `transaction.Rollback()`
- [x] **N/A defaults** — `Occupation`, `Employer`, `OccupationAddress` default to `"N/A"` server-side
- [x] **Invoice PAID bypass** — `Status: "PAID"` passed to `CreateInvoice` → Fincore block only runs for `ISSUED`, so no journal entry
- [x] **paid_through_date** — stored in `Meta` JSON on Lease
- [x] **Notifications** — collected then fired in goroutines after `transaction.Commit()`
- [x] **Swagger godoc** — added on `BulkOnboardLeases` handler
- [x] **Dark mode** — all UI uses Shadcn primitives and CSS variables; `dark:` variants used where raw colors appear
- [x] **Entry point** — callout on leases list when `rows.length === 0`
- [x] **Route exported** — `modules/index.ts` updated
- [x] **Type names consistent** — `BulkOnboardLeaseEntry`, `BulkOnboardLeasesInput`, `BulkOnboardLeaseEntryInput`, `DraftLeaseEntry` used consistently across all tasks

**Potential issue to verify during implementation:** The `UnitSelect` component may not accept `excludedUnitIds` or `statusFilter` props. In Task 6 Step 1 there is a note about this — check the component signature and handle accordingly (inline validation is the fallback).
