package emailtemplates

// ─── Client Application ───────────────────────────────────────────────────────

type ClientApplicationAdminNotificationData struct {
	ApplicantName    string
	ApplicantEmail   string
	ApplicantPhone   string
	ApplicantType    string
	ApplicantSubType string
	ApplicantCity    string
	ApplicantRegion  string
}

type ClientApplicationSubmittedData struct {
	OwnerName string
}

type ClientApplicationRejectedData struct {
	OwnerName       string
	RejectionReason string
}

type ClientApplicationAcceptedData struct {
	OwnerName string
	Email     string
	Password  string
}

// ─── Client User ──────────────────────────────────────────────────────────────

type ClientUserAddedData struct {
	Name       string
	ClientName string
	Email      string
	Password   string
}

type ClientUserAddedExistingAccountData struct {
	Name       string
	ClientName string
}

type ClientUserActivatedData struct {
	Name string
}

type ClientUserDeactivatedData struct {
	Name   string
	Reason string
}

type ClientUserPasswordResetData struct {
	Name       string
	ResetToken string
}

type ClientUserPasswordUpdatedData struct {
	Name string
}

// ─── Tenant Application ───────────────────────────────────────────────────────

type TenantInvitedData struct {
	UnitID     string
	AdminID    string
	AdminEmail string
}

type TenantApplicationSubmittedData struct {
	ApplicantName   string
	UnitName        string
	ApplicationCode string
	SubmissionDate  string
}

type TenantApplicationApprovedData struct {
	ApplicantName   string
	UnitName        string
	ApplicationCode string
	PhoneNumber     string
}

type TenantApplicationCancelledData struct {
	ApplicantName   string
	ApplicationCode string
	Reason          string
}

type TenantCSVCreatedData struct {
	ApplicationCode string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

type AuthVerificationCodeData struct {
	VerificationCode string
	ExpiryDuration   string
}

// ─── Lease ────────────────────────────────────────────────────────────────────

type LeaseActivatedData struct {
	TenantName string
	UnitName   string
	MoveInDate string
}

type LeaseCancelledData struct {
	TenantName         string
	UnitName           string
	CancellationReason string
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

type InvoiceCreatedData struct {
	TenantName  string
	InvoiceCode string
	Currency    string
	Amount      string
}

type InvoiceVoidedData struct {
	TenantName  string
	InvoiceCode string
}

type InvoicePaidData struct {
	TenantName  string
	InvoiceCode string
	UnitName    string
	Currency    string
	Amount      string
}

type RentInvoiceGeneratedData struct {
	TenantName  string
	InvoiceCode string
	UnitName    string
	Currency    string
	Amount      string
}

// InvoiceReminderData is shared by all pre-due and overdue reminder templates.
type InvoiceReminderData struct {
	TenantName  string
	InvoiceCode string
	UnitName    string
	Currency    string
	Amount      string
	DueDate     string
}

// ─── Document Signing ─────────────────────────────────────────────────────────

type SigningTokenData struct {
	SignerName string
	Token      string
	ExpiresAt  string
}

// ─── Announcement ─────────────────────────────────────────────────────────────

type AnnouncementData struct {
	AnnouncementType    string
	AnnouncementTitle   string
	AnnouncementContent string
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

type MaintenanceRequestCreatedData struct {
	TenantName string
	UnitName   string
	Title      string
	Category   string
	Priority   string
}

// ─── Payment ──────────────────────────────────────────────────────────────────

type OfflinePaymentSubmittedData struct {
	TenantName  string
	UnitName    string
	InvoiceCode string
	Currency    string
	Amount      string
}

type ChecklistAcknowledgedData struct {
	TenantName    string
	UnitName      string
	ChecklistType string
	Action        string
}

// ─── Booking ──────────────────────────────────────────────────────────────────

type BookingCreatedData struct {
	GuestName    string
	UnitName     string
	CheckInDate  string
	CheckOutDate string
	Rate         string
	Currency     string
	TrackingCode string
}

type BookingConfirmedData struct {
	GuestName    string
	UnitName     string
	CheckInDate  string
	CheckInCode  string
	CheckOutDate string
	TrackingCode string
}

type BookingCancelledData struct {
	GuestName          string
	UnitName           string
	CheckInDate        string
	CheckOutDate       string
	TrackingCode       string
	CancellationReason string
}
