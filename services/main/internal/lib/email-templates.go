package lib

const SUPPORT_DETAILS_TEMPLATE = `If you have any questions, feel free to contact us at {{support_email}} / {{support_phone}}.`

const (
	CLIENT_APPLICATION_ADMIN_NOTIFICATION_SUBJECT = "New Property Manager Application Received"
	CLIENT_APPLICATION_ADMIN_NOTIFICATION_BODY    = `Hi Team,

A new property manager application has been submitted on Rentloop.

Applicant Details:
- Name: {{applicant_name}}
- Email: {{applicant_email}}
- Phone: {{applicant_phone}}
- Type: {{applicant_type}}
- Sub-Type: {{applicant_sub_type}}
- City: {{applicant_city}}, {{applicant_region}}

Please review the application in the admin dashboard.

The Rentloop System
`
)

const (
	CLIENT_APPLICATION_SUBMITTED_SUBJECT = "Your Rentloop Application Received"
	CLIENT_APPLICATION_SUBMITTED_BODY    = `Hi {{owner_name}},

Thank you for submitting your property owner application on Rentloop!  
We've received your details and our team is currently reviewing your submission.

You'll receive an update once your application has been reviewed.  

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,  
The Rentloop Team
`
)

const (
	CLIENT_APPLICATION_REJECTED_SUBJECT = "Your Rentloop Application Rejected"
	CLIENT_APPLICATION_REJECTED_BODY    = `
Hi {{owner_name}},

Thank you for your interest in becoming a property owner on Rentloop.

After reviewing your application, we're unable to approve it at this time.  
Reason: {{rejection_reason}}

We encourage you to review the feedback above and reapply once the issue has been resolved.  

{{SUPPORT_DETAILS_TEMPLATE}}

Thank you for understanding,
The Rentloop Team
`
)

const (
	CLIENT_APPLICATION_ACCEPTED_SUBJECT = "Your Rentloop Application Accepted"
	CLIENT_APPLICATION_ACCEPTED_BODY    = `Hi {{owner_name}},

Great news! Your property owner application has been approved.  
Welcome to Rentloop - we're excited to have you on board.

You can now log in to your Rentloop dashboard to add your properties, manage listings, and start connecting with tenants.

Access your dashboard here:
Url: {{property_manager_portal_url}}
Email: {{email}}
Password: {{password}}

Please consider changing your password after your first login for security purposes.

{{SUPPORT_DETAILS_TEMPLATE}}

Welcome aboard,  
The Rentloop Team
`
)

const (
	CLIENT_USER_ADDED_SUBJECT = "Welcome to Rentloop"
	CLIENT_USER_ADDED_BODY    = `Hey {{name}},

You have been invited to join {{client_name}}. Login with the details below.

Credentials:
Url: {{property_manager_portal_url}}
Email: {{email}}
Password: {{password}}

Note: Kindly change your password on your first login to properly secure your account

{{SUPPORT_DETAILS_TEMPLATE}}

Welcome aboard,
The Rentloop Team
`
)

const (
	CLIENT_USER_ADDED_EXISTING_ACCOUNT_SUBJECT = "You've been added to a new account on Rentloop"
	CLIENT_USER_ADDED_EXISTING_ACCOUNT_BODY    = `Hey {{name}},

You've been added to {{client_name}} on Rentloop.

You can log in using your existing credentials:
Url: {{property_manager_portal_url}}

{{SUPPORT_DETAILS_TEMPLATE}}

The Rentloop Team
`
)

const (
	CLIENT_USER_PASSWORD_RESET_SUBJECT = "Reset Your Rentloop Password"
	CLIENT_USER_PASSWORD_RESET_BODY    = `Hey {{name}},

We received a request to reset your password.
Click the link below to set a new password:

{{property_manager_portal_url}}/reset-your-password?token={{reset_token}}

If you didn’t request this, you can safely ignore this email - your account is secure.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	CLIENT_USER_ACTIVATED_SUBJECT = "Client User Activated"
	CLIENT_USER_ACTIVATED_BODY    = `Hey {{name}},

Your account has been activated. You can now log back in.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The rentloop Team
	`
)

const (
	CLIENT_USER_DEACTIVATED_SUBJECT = "Client User Deactivated"
	CLIENT_USER_DEACTIVATED_BODY    = `Hey {{name}},

Your account has been deactivated. Reach out to your admin.

Reason: {{reason}}

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The rentloop Team
`
)

const (
	CLIENT_USER_PASSWORD_UPDATED_SUBJECT = "Your Rentloop Password Updated"
	CLIENT_USER_PASSWORD_UPDATED_BODY    = `Hey {{name}},

Your password has been changed successfully. if you didn't change this, reach out to support.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The rentloop Team
`
)

const (
	TENANT_INVITED_SUBJECT = "Complete your tenant application on Rentloop"
	TENANT_INVITED_BODY    = `Hi,

You’ve been invited to apply for a tenancy on Rentloop.

To get started, please complete your tenant application using the secure link below:
{{website_url}}/tenants/apply?unit={{unit_id}}&referred_by={{admin_id}}

The application helps the property owner review your details and proceed with the tenancy process.
This link is intended for you only. If you weren’t expecting this email, you can safely ignore it.

If you have any questions or experience issues while applying, please contact us at {{admin_email}}.

Best regards,
The Rentloop team
`
)

const (
	TENANT_CANCELLED_SUBJECT = "Your tenant application has been cancelled"
	TENANT_CANCELLED_BODY    = `Hello {{applicant_name}},

We are writing to inform you that your tenant application (Application Code: {{application_code}}) has been cancelled.

Reason for cancellation:
{{reason}}

Application Tracking Page: {{website_url}}/tenant-applications/{{application_code}}

If you believe this was done in error or if you would like further clarification, please feel free to contact us for assistance.

Thank you for your interest, and we wish you the best in your housing search.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop team
`
)

const (
	TENANT_APPLICATION_SUBMITTED_SUBJECT = "Tenant Application Submitted Successfully"
	TENANT_APPLICATION_SUBMITTED_BODY    = `Hello {{applicant_name}},

Your tenant application has been successfully submitted and is now under review.

Application Details:

Unit: {{unit_name}}
Application Code: {{application_code}}
Submitted on: {{submission_date}}
Application Tracking Page: {{website_url}}/tenant-applications/{{application_code}}

Our team will review your application and contact you if additional information is needed. You will be notified once a decision has been made.
Thank you for your interest.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop team
`
)

const (
	TENANT_APPLICATION_APPROVED_SUBJECT = "Your Tenant Application Has Been Approved"
	TENANT_APPLICATION_APPROVED_BODY    = `Hello {{applicant_name}},

We’re pleased to inform you that your tenant application has been Approved.

Application Details:

Unit: {{unit_name}}
Application Code: {{application_code}}
Application Tracking Page: {{website_url}}/tenant-applications/{{application_code}}

Your lease has been prepared and is currently pending.
Our team will contact you shortly with next steps, including move-in details and documentation.

You can access your account anytime using the Rentloop mobile app - simply log in with your phone number: {{phone_number}}.

If you have any questions in the meantime, feel free to reach out.

Congratulations, and welcome aboard!

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop team
`
)

const (
	AUTH_VERIFICATION_CODE_SUBJECT = "Your Rentloop Verification Code"
	AUTH_VERIFICATION_CODE_BODY    = `Hello,

Your verification code is:

{{verification_code}}

This code is valid for the next {{expiry_duration}}. Please enter it in the Rentloop app to verify your identity.

If you did not request this code, you can safely ignore this message.

For your security, never share this code with anyone. Our team will never ask for it.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop team
`
)

const (
	LEASE_ACTIVATED_SUBJECT = "Your Rentloop Lease Is Now Active"
	LEASE_ACTIVATED_BODY    = `Hi {{tenant_name}},

Great news - your lease for {{unit_name}} has been successfully activated.

You can move in on: {{move_in_date}}

You can now proceed with move-in arrangements and any next steps outlined in your agreement.

{{SUPPORT_DETAILS_TEMPLATE}}

Welcome aboard,
The Rentloop Team
`
)

const (
	RENT_INVOICE_GENERATED_SUBJECT = "Your Rent Invoice is Ready"
	RENT_INVOICE_GENERATED_BODY    = `Hi {{tenant_name}},

Your rent invoice ({{invoice_code}}) for {{unit_name}} has been generated and is now due for payment.

Amount: {{currency}} {{amount}}

Please make your payment at your earliest convenience to keep your lease in good standing.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	INVOICE_PRE_DUE_1D_SUBJECT = "Reminder: your rent is due tomorrow"
	INVOICE_PRE_DUE_1D_BODY    = `Hi {{tenant_name}},

This is a friendly reminder that your rent invoice ({{invoice_code}}) for {{unit_name}} is due tomorrow.

Amount: {{currency}} {{amount}}
Due Date: {{due_date}}

Please ensure your payment is made on time to avoid any late fees.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	INVOICE_OVERDUE_1D_SUBJECT = "Payment reminder: your rent is 1 day overdue"
	INVOICE_OVERDUE_1D_BODY    = `Hi {{tenant_name}},

Your rent invoice ({{invoice_code}}) for {{unit_name}} was due on {{due_date}} and remains unpaid.

Amount: {{currency}} {{amount}}

Please make your payment as soon as possible to avoid further notices.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	INVOICE_OVERDUE_3D_SUBJECT = "Payment reminder: your rent is 3 days overdue"
	INVOICE_OVERDUE_3D_BODY    = `Hi {{tenant_name}},

Your rent invoice ({{invoice_code}}) for {{unit_name}} is now 3 days overdue. The payment of {{currency}} {{amount}} was due on {{due_date}}.

Please settle your balance promptly to avoid further action.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	INVOICE_OVERDUE_7D_SUBJECT = "Urgent: your rent is 7 days overdue"
	INVOICE_OVERDUE_7D_BODY    = `Hi {{tenant_name}},

Your rent invoice ({{invoice_code}}) for {{unit_name}} is now 7 days overdue.

Outstanding amount: {{currency}} {{amount}}
Original due date: {{due_date}}

Please make your payment immediately or contact us to discuss your situation.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	INVOICE_OVERDUE_14D_SUBJECT = "Final notice: your rent is 14 days overdue"
	INVOICE_OVERDUE_14D_BODY    = `Hi {{tenant_name}},

This is a final notice. Your rent invoice ({{invoice_code}}) for {{unit_name}} is now 14 days overdue.

Outstanding amount: {{currency}} {{amount}}
Original due date: {{due_date}}

Please make your payment immediately. Continued non-payment may result in further action under the terms of your lease agreement.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	INVOICE_PAID_SUBJECT = "Payment confirmed - thank you!"
	INVOICE_PAID_BODY    = `Hi {{tenant_name}},

We've received your payment for invoice ({{invoice_code}}) for {{unit_name}}.

Amount paid: {{currency}} {{amount}}

Thank you for keeping your account up to date.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	SIGNING_TOKEN_INVITE_SUBJECT = "You have a document to sign on Rentloop"
	SIGNING_TOKEN_INVITE_BODY    = `Hi {{signer_name}},

You have been invited to review and sign a document on Rentloop.

Please use the secure link below to complete your signature:
{{property_manager_portal_url}}/sign/{{token}}

This link will expire on {{expires_at}}.

If you weren't expecting this invitation, you can safely ignore this message.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	SIGNING_TOKEN_RESENT_SUBJECT = "Reminder: You have a document to sign on Rentloop"
	SIGNING_TOKEN_RESENT_BODY    = `Hi {{signer_name}},

This is a reminder that you have a document awaiting your signature on Rentloop.

Please use the secure link below to review and complete your signature:
{{property_manager_portal_url}}/sign/{{token}}

Your signing link has been refreshed and will now expire on {{expires_at}}.

If you weren't expecting this, you can safely ignore this message.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	ANNOUNCEMENT_EMAIL_SUBJECT = "New Announcement from Your Property Manager"
	ANNOUNCEMENT_EMAIL_BODY    = `Hello,

You have a new announcement from your property manager.

{{announcement_type}}: {{announcement_title}}

{{announcement_content}}

You can also view this announcement in the Rentloop Go app for more details.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`

	ANNOUNCEMENT_SMS_BODY = `{{announcement_title}}: {{announcement_content}}`
)

const (
	LEASE_CANCELLED_SUBJECT = "Your Rentloop Lease Was Cancelled"
	LEASE_CANCELLED_BODY    = `Hi {{tenant_name}},

Thank you for your interest in leasing {{unit_name}} on Rentloop.

Unfortunately, your lease could not be completed at this time.  
Reason: {{cancellation_reason}}

You’re welcome to review the details above and apply again when ready.

{{SUPPORT_DETAILS_TEMPLATE}}

Thank you for your understanding,
The Rentloop Team
`
)

const (
	WAITLIST_JOINED_SUBJECT = "You're on the Rentloop waitlist! 🎉"
	WAITLIST_JOINED_BODY    = `Hi {{full_name}},

Thanks for joining the Rentloop waitlist! 🎉
We're working hard to bring you the smartest rental management platform. You'll be among the first to know when we launch and get early access.

Stay tuned - great things are coming.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
	WAITLIST_JOINED_SMS_BODY = `Hi {{full_name}}, you're on the waitlist! We'll let you know when we launch. Stay tuned.`
)

const (
	PM_MAINTENANCE_REQUEST_CREATED_SUBJECT = "New Maintenance Request Submitted"
	PM_MAINTENANCE_REQUEST_CREATED_BODY    = `Hi,

A tenant has submitted a new maintenance request for one of your units.

Tenant: {{tenant_name}}
Unit: {{unit_name}}
Title: {{title}}
Category: {{category}}
Priority: {{priority}}

Please log in to your Rentloop dashboard to review and manage this request.

Dashboard: {{property_manager_portal_url}}

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	PM_OFFLINE_PAYMENT_SUBMITTED_SUBJECT = "Tenant Has Made Some Payments"
	PM_OFFLINE_PAYMENT_SUBMITTED_BODY    = `Hi,

A tenant has submitted an offline payment that is pending your verification.

Tenant: {{tenant_name}}
Unit: {{unit_name}}
Invoice: {{invoice_code}}
Amount: {{currency}} {{amount}}

Please log in to your Rentloop dashboard to verify this payment.

Dashboard: {{property_manager_portal_url}}

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	PM_CHECKLIST_ACKNOWLEDGED_SUBJECT = "Tenant Has Responded to a Unit Report"
	PM_CHECKLIST_ACKNOWLEDGED_BODY    = `Hi,

A tenant has responded to a {{checklist_type}} checklist for one of your units.

Tenant: {{tenant_name}}
Unit: {{unit_name}}
Response: {{action}}

Please log in to your Rentloop dashboard to review the checklist response.

Dashboard: {{property_manager_portal_url}}

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

// ============================================================================
// SMS TEMPLATES
// Keep SMS messages short (160 chars ideal, 320 max) and use only GSM-7 chars.
// Avoid: em-dash, curly quotes, emojis. Use: hyphen, straight quotes, ASCII.
// ============================================================================

const (
	CLIENT_APPLICATION_SUBMITTED_SMS_BODY = `Hi {{owner_name}}, we've received your application. We'll review it and get back to you soon.`
	CLIENT_APPLICATION_REJECTED_SMS_BODY  = `Hi {{owner_name}}, your application was not approved. Reason: {{rejection_reason}}. Contact us for details.`
	CLIENT_APPLICATION_ACCEPTED_SMS_BODY  = `Hi {{owner_name}}, your application is approved! Login: {{property_manager_portal_url}} Email: {{email}} Password: {{password}}`
)

const (
	CLIENT_USER_ADDED_SMS_BODY                  = `Hi {{name}}, you've been added to {{client_name}}. Login: {{property_manager_portal_url}} Email: {{email}} Password: {{password}}`
	CLIENT_USER_ADDED_EXISTING_ACCOUNT_SMS_BODY = `Hi {{name}}, you've been added to {{client_name}} on Rentloop. Login at {{property_manager_portal_url}} with your existing credentials.`
	CLIENT_USER_ACTIVATED_SMS_BODY              = `Hi {{name}}, your account has been activated. You can now log in.`
	CLIENT_USER_DEACTIVATED_SMS_BODY            = `Hi {{name}}, your account has been deactivated. Reason: {{reason}}. Contact your admin.`
	CLIENT_USER_PASSWORD_UPDATED_SMS_BODY       = `Hi {{name}}, your password has been changed. If you didn't do this, contact support.`
	CLIENT_USER_PASSWORD_RESET_SMS_BODY         = `Reset your password: {{property_manager_portal_url}}/reset-your-password?token={{reset_token}}`
)

const (
	TENANT_INVITED_SMS_BODY               = `You've been invited to apply for a tenancy. Apply here: {{website_url}}/tenants/apply?unit={{unit_id}}&referred_by={{admin_id}}`
	TENANT_APPLICATION_SUBMITTED_SMS_BODY = `Hi {{applicant_name}}, your application ({{application_code}}) for {{unit_name}} has been submitted. We'll be in touch.`
	TENANT_CANCELLED_SMS_BODY             = `Hi {{applicant_name}}, your application ({{application_code}}) has been cancelled. Reason: {{reason}}`
	TENANT_APPLICATION_APPROVED_SMS_BODY  = `Hi {{applicant_name}}, your application for {{unit_name}} is approved! Log in to the Rentloop app with phone: {{phone_number}}`
)

const (
	AUTH_VERIFICATION_CODE_SMS_BODY = `Your verification code is {{verification_code}}. Valid for {{expiry_duration}}. Do not share this code.`
)

const (
	LEASE_ACTIVATED_SMS_BODY = `Hi {{tenant_name}}, your lease for {{unit_name}} is now active. Move-in date: {{move_in_date}}.`
	LEASE_CANCELLED_SMS_BODY = `Hi {{tenant_name}}, your lease for {{unit_name}} was cancelled. Reason: {{cancellation_reason}}`
)

const (
	RENT_INVOICE_GENERATED_SMS_BODY = `Hi {{tenant_name}}, your rent invoice ({{invoice_code}}) for {{unit_name}} is ready. Amount: {{currency}} {{amount}}.`
	INVOICE_PRE_DUE_1D_SMS_BODY     = `Reminder: Invoice {{invoice_code}} for {{unit_name}} is due tomorrow. Amount: {{currency}} {{amount}}.`
	INVOICE_OVERDUE_1D_SMS_BODY     = `Invoice {{invoice_code}} for {{unit_name}} is 1 day overdue. Amount: {{currency}} {{amount}}. Please pay now.`
	INVOICE_OVERDUE_3D_SMS_BODY     = `Invoice {{invoice_code}} for {{unit_name}} is 3 days overdue. Amount: {{currency}} {{amount}}. Please pay promptly.`
	INVOICE_OVERDUE_7D_SMS_BODY     = `Urgent: Invoice {{invoice_code}} is 7 days overdue. Amount: {{currency}} {{amount}}. Pay immediately.`
	INVOICE_OVERDUE_14D_SMS_BODY    = `Final notice: Invoice {{invoice_code}} is 14 days overdue. Amount: {{currency}} {{amount}}. Pay now to avoid action.`
	INVOICE_PAID_SMS_BODY           = `Payment received for invoice {{invoice_code}}. Amount: {{currency}} {{amount}}. Thank you!`
)

const (
	SIGNING_TOKEN_INVITE_SMS_BODY = `Hi {{signer_name}}, you have a document to sign. Sign here: {{property_manager_portal_url}}/sign/{{token}} (expires {{expires_at}})`
	SIGNING_TOKEN_RESENT_SMS_BODY = `Reminder: Sign your document here: {{property_manager_portal_url}}/sign/{{token}} (expires {{expires_at}})`
)

const (
	INVOICE_CREATED_SUBJECT = "New Invoice Ready for Payment"
	INVOICE_CREATED_BODY    = `Hi {{tenant_name}},

An invoice ({{invoice_code}}) for {{currency}} {{amount}} has been issued and is now ready for payment.

Please make your payment at your earliest convenience.

Best regards,
The Rentloop Team
`
	INVOICE_CREATED_SMS_BODY = `Hi {{tenant_name}}, invoice {{invoice_code}} for {{currency}} {{amount}} is ready for payment.`
)

const (
	INVOICE_VOIDED_SUBJECT = "Your Invoice Has Been Cancelled"
	INVOICE_VOIDED_BODY    = `Hi {{tenant_name}},

Invoice ({{invoice_code}}) has been cancelled and is no longer payable.

If you have any questions about this, please reach out to your landlord.

Best regards,
The Rentloop Team
`
	INVOICE_VOIDED_SMS_BODY = `Hi {{tenant_name}}, invoice {{invoice_code}} has been cancelled and is no longer payable.`
)
