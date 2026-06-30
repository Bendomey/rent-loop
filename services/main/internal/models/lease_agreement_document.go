package models

// LeaseAgreementDocument manages the document pipeline for a lease agreement.
// Status machine: "DRAFT" -> "FINALIZED" -> "SIGNING" -> "SIGNED"
// FINALIZED is set explicitly by the PM to lock content.
// SIGNING is set automatically when the first signing token is created.
// SIGNED is set automatically when the last required party submits their signature.
type LeaseAgreementDocument struct {
	BaseModelSoftDelete
	LeaseID     string `gorm:"not null"` // one active pipeline record per lease (enforced via partial unique index)
	Lease       *Lease
	Mode        string  `gorm:"not null"` // "MANUAL" | "ONLINE"
	DocumentID  *string // FK to Document (ONLINE mode only)
	Document    *Document
	DocumentUrl *string             // final PDF URL; set on MANUAL attach or after ONLINE PDF generation
	Status      string              `gorm:"not null;default:'DRAFT'"` // "DRAFT" | "FINALIZED" | "SIGNING" | "SIGNED"
	Signatures  []DocumentSignature `gorm:"foreignKey:LeaseAgreementDocumentID"`
}
