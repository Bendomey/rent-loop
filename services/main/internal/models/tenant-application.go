package models

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"gorm.io/gorm"
)

// TenantApplication represents an application submitted by a prospective tenant for a specific unit.
// BasicInfoCompleted -> DocsSigned -> Paid -> MoveInScheduled -> Completed
type TenantApplication struct {
	BaseModelSoftDelete
	Code   string `gorm:"uniqueIndex"`
	Status string `gorm:"not null;default:'TenantApplication.Status.InProgress'"` // TenantApplication.Status.InProgress, TenantApplication.Status.Cancelled, TenantApplication.Status.Completed

	CompletedAt   *time.Time
	CompletedById *string
	CompletedBy   *ClientUser

	CancelledAt   *time.Time
	CancelledById *string
	CancelledBy   *ClientUser

	// Source tracks how the application was created:
	// "SELF" = tenant applied themselves, "ADMIN" = landlord created it, "CSV_BULK" = created via CSV/Excel upload
	Source *string

	DesiredUnitId *string
	DesiredUnit   Unit

	// move in details
	DesiredMoveInDate     *time.Time
	StayDurationFrequency *string // HOURLY | WEEKLY | DAILY | MONTHLY
	StayDuration          *int64

	// financial setup — inherited from unit when DesiredUnitId is set
	RentFee          *int64
	RentFeeCurrency  *string
	PaymentFrequency *string // Hourly, Daily, Monthly, Quarterly, BiAnnually, Annually, OneTime

	InitialDepositFee         *int64
	InitialDepositFeeCurrency string `gorm:"not null;default:'GHS'"`

	SecurityDepositFee         *int64 // if it's null or 0 then it's not opted in!
	SecurityDepositFeeCurrency string `gorm:"not null;default:'GHS'"`

	// initial deposit + security deposit (if opted in)
	ApplicationPaymentInvoice *Invoice `gorm:"foreignKey:ContextTenantApplicationID"`

	// docs setup
	LeaseAgreementDocumentMode *string // MANUAL | ONLINE
	LeaseAgreementDocumentUrl  *string

	// ONLINE
	LeaseAgreementDocumentID     *string
	LeaseAgreementDocument       *Document
	LeaseAgreementDocumentStatus *string // "DRAFT" | "FINALIZED" | "SIGNING" | "SIGNED"

	LeaseAgreementDocumentSignatures []DocumentSignature `gorm:"foreignKey:TenantApplicationID"`

	// Basic details — all nullable to support partial data entry via CSV/bulk upload
	FirstName       *string
	OtherNames      *string
	LastName        *string
	Email           *string
	Phone           string  `gorm:"not null;"`
	Gender          *string // Male, Female
	DateOfBirth     *time.Time
	Nationality     *string
	MaritalStatus   *string // Single, Married, Divorced, Widowed
	ProfilePhotoUrl *string
	IDType          *string // NationalID, Passport, DriverLicense
	IDNumber        *string
	IDFrontUrl      *string
	IDBackUrl       *string

	PreviousLandlordName  *string
	PreviousLandlordPhone *string
	PreviousTenancyPeriod *string

	CurrentAddress                 *string
	EmergencyContactName           *string
	EmergencyContactPhone          *string
	RelationshipToEmergencyContact *string

	Occupation        *string // student
	Employer          *string // or school name
	EmployerType      *string // "WORKER" | "STUDENT"
	OccupationAddress *string // or school address
	ProofOfIncomeUrl  *string // or admission letter url

	CreatedById string
	CreatedBy   ClientUser
}

func (t *TenantApplication) BeforeCreate(tx *gorm.DB) error {
	uniqueCode, genErr := lib.GenerateCode(tx, &TenantApplication{})
	if genErr != nil {
		raven.CaptureError(genErr, map[string]string{
			"function": "BeforeCreateTenantApplicationHook",
			"action":   "Generating a unique code",
		})
		return genErr
	}

	t.Code = *uniqueCode
	return nil
}
