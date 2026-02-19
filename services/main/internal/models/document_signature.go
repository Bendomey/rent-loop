package models

// DocumentSignature represents a signature on a document, such as a lease agreement, termination agreement.
// It links to the document, the tenant application (if applicable), and the lease (if applicable).
// It also captures who signed it, their role, and the IP address from which they signed.
type DocumentSignature struct {
	BaseModelSoftDelete
	DocumentID          string `gorm:"not null;"`
	Document            Document
	TenantApplicationID *string // nullable — links to the application
	TenantApplication   *TenantApplication
	LeaseID             *string // nullable — links to the lease
	Lease               *Lease
	Role                string // "PROPERTY_MANAGER" | "TENANT" | "PM_WITNESS" | "TENANT_WITNESS"
	SignatureUrl        string // S3 URL of the drawn signature image
	SignedByName        *string
	SignedByID          *string //
	SignedBy            *ClientUser

	IPAddress string
}
