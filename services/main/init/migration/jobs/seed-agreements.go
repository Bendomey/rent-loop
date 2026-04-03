package jobs

import (
	"time"

	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

const landlordAgreementV1Content = `# RENTLOOP PROPERTY OWNER AGREEMENT (LANDLORD AGREEMENT)

**Effective Date:** April 3, 2026
**Version:** 1.0

This Property Owner Agreement ("Agreement") is entered into between RentLoop ("RentLoop", "we", "our", "us") and the property owner, property manager, or agent registering on the RentLoop platform ("User", "Landlord", "you").

By creating an account, clicking "I Agree", or using the RentLoop platform, you agree to be bound by this Agreement.

## 1. About RentLoop

RentLoop is a software platform that provides tools for property owners and managers to manage rental properties, tenants, leases, invoices, maintenance, and related rental operations.

RentLoop is **not**:

- A property manager
- A real estate agent or broker
- A law firm
- A payment processor
- A party to any lease agreement between landlord and tenant

RentLoop provides software tools only and is not responsible for the management of your property or your relationship with tenants.

## 2. Account Registration

To use RentLoop, you must:

- Provide accurate and complete information
- Keep your login credentials secure
- Be responsible for all activity under your account
- Ensure that any person using your account is authorized by you

RentLoop is not responsible for any loss resulting from unauthorized access to your account.

## 3. Landlord Responsibilities

As a landlord or property manager using RentLoop, you agree that you are solely responsible for:

- Managing your properties and tenants
- Ensuring lease agreements are legally valid
- Collecting rent and other payments
- Verifying tenant information
- Handling disputes with tenants
- Maintaining your property
- Complying with all rental, housing, and tax laws
- Ensuring that tenant data uploaded to RentLoop is accurate and lawfully obtained

RentLoop does not take responsibility for how you manage your property or tenants.

## 4. Tenant Data and Privacy

You may upload tenant personal information including names, phone numbers, email addresses, lease documents, and payment records.

By using RentLoop, you agree that:

- You have the legal right to collect and store tenant data
- You have informed your tenants that their data may be stored on RentLoop
- You are responsible for the accuracy and legality of the data
- RentLoop may store and process this data to provide the service

RentLoop will handle personal data in accordance with the RentLoop Privacy Policy.

## 5. Fees and Payments

RentLoop may charge subscription fees or other service fees for use of the platform.

You agree that:

- You will pay all applicable fees
- Fees may be updated with notice
- Fees are non-refundable unless stated otherwise
- Failure to pay may result in suspension or termination of your account

RentLoop is not responsible for:

- Tenant failure to pay rent
- Payment processing failures
- Bank or mobile money service issues
- Payment disputes between landlord and tenant

## 6. Acceptable Use

You agree not to use RentLoop to:

- Upload false tenant or property information
- Harass or defraud tenants
- Violate any laws
- Attempt to access another user's data
- Interfere with the platform's operation
- Avoid paying platform fees

RentLoop may suspend or terminate accounts that violate these rules.

## 7. Limitation of Liability

To the maximum extent permitted by law, RentLoop shall not be liable for any losses or damages arising from:

- Tenant disputes
- Lease disputes
- Evictions
- Property damage
- Loss of rental income
- Payment failures
- Record inaccuracies
- Data loss
- System downtime
- Third-party service failures (e.g., payment providers, email, hosting)

RentLoop provides the platform on an "as is" and "as available" basis without warranties of any kind.

## 8. Indemnification

You agree to indemnify and hold harmless RentLoop and its owners, employees, and partners from any claims, damages, liabilities, and expenses arising from:

- Your use of the platform
- Your relationship with tenants
- Lease agreements you create
- Any data you upload
- Your violation of laws or regulations
- Any disputes between you and tenants or third parties

This means if a tenant sues because of something you did, RentLoop is not responsible.

## 9. Data Storage and Service Availability

RentLoop will take reasonable steps to protect and store your data, but we do not guarantee that the platform will always be available or error-free.

You are responsible for keeping your own backups of important documents and records.

## 10. Suspension and Termination

RentLoop may suspend or terminate your account if:

- You violate this Agreement
- You fail to pay fees
- Your use creates legal risk for RentLoop
- Required by law

You may stop using the platform at any time.

## 11. Changes to This Agreement

RentLoop may update this Agreement from time to time.

When we update this Agreement:

- You will be notified
- You may be required to review and accept the updated Agreement before continuing to use the platform

Continued use of RentLoop requires acceptance of the latest version of this Agreement.

## 12. Governing Law

This Agreement shall be governed by the laws of the Republic of Ghana.

Any disputes arising from this Agreement shall be resolved in the courts of Ghana.

## 13. Acceptance of Agreement

By clicking "I Agree", creating an account, or using RentLoop, you acknowledge that:

- You have read this Agreement
- You understand this Agreement
- You agree to be legally bound by this Agreement
- You are responsible for your use of the platform
`

// SeedAgreements inserts the initial Landlord Agreement (v1.0) into the agreements table.
func SeedAgreements() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202604030001_SEED_AGREEMENTS",
		Migrate: func(tx *gorm.DB) error {
			effectiveDate := time.Date(2026, 4, 3, 0, 0, 0, 0, time.UTC)
			return tx.Exec(
				`INSERT INTO agreements (id, name, version, content, effective_date, is_active, created_at, updated_at)
				 VALUES (uuid_generate_v4(), ?, ?, ?, ?, true, NOW(), NOW())`,
				"Landlord Agreement",
				"v1.0",
				landlordAgreementV1Content,
				effectiveDate,
			).Error
		},
		Rollback: func(tx *gorm.DB) error {
			return tx.Exec(
				`DELETE FROM agreements WHERE name = ? AND version = ?`,
				"Landlord Agreement",
				"v1.0",
			).Error
		},
	}
}
