package lib

// SUPPORT_DETAILS_TEMPLATE is injected into SMS bodies via ApplyGlobalVariableTemplate.
const SUPPORT_DETAILS_TEMPLATE = `If you have any questions, feel free to contact us at {{support_email}} / {{support_phone}}.`

// ─── Email Subjects ───────────────────────────────────────────────────────────

const (
	CLIENT_APPLICATION_ADMIN_NOTIFICATION_SUBJECT = "New Property Manager Application Received"
	CLIENT_APPLICATION_SUBMITTED_SUBJECT          = "Your Rentloop Application Received"
	CLIENT_APPLICATION_REJECTED_SUBJECT           = "Your Rentloop Application Rejected"
	CLIENT_APPLICATION_ACCEPTED_SUBJECT           = "Your Rentloop Application Accepted"
)

const (
	CLIENT_USER_ADDED_SUBJECT                  = "Welcome to Rentloop"
	CLIENT_USER_ADDED_EXISTING_ACCOUNT_SUBJECT = "You've been added to a new account on Rentloop"
	CLIENT_USER_PASSWORD_RESET_SUBJECT         = "Reset Your Rentloop Password"
	CLIENT_USER_ACTIVATED_SUBJECT              = "Client User Activated"
	CLIENT_USER_DEACTIVATED_SUBJECT            = "Client User Deactivated"
	CLIENT_USER_PASSWORD_UPDATED_SUBJECT       = "Your Rentloop Password Updated"
)

const (
	TENANT_INVITED_SUBJECT               = "Complete your tenant application on Rentloop"
	TENANT_CANCELLED_SUBJECT             = "Your tenant application has been cancelled"
	TENANT_APPLICATION_SUBMITTED_SUBJECT = "Tenant Application Submitted Successfully"
	TENANT_APPLICATION_APPROVED_SUBJECT  = "Your Tenant Application Has Been Approved"
	TENANT_CSV_CREATED_SUBJECT           = "Complete Your Tenant Profile on Rentloop"
)

const AUTH_VERIFICATION_CODE_SUBJECT = "Your Rentloop Verification Code"

const (
	LEASE_ACTIVATED_SUBJECT = "Your Rentloop Lease Is Now Active"
	LEASE_CANCELLED_SUBJECT = "Your Rentloop Lease Was Cancelled"
)

const RENT_INVOICE_GENERATED_SUBJECT = "Your Rent Invoice is Ready"

const (
	INVOICE_PRE_DUE_1D_SUBJECT  = "Reminder: your rent is due tomorrow"
	INVOICE_OVERDUE_1D_SUBJECT  = "Payment reminder: your rent is 1 day overdue"
	INVOICE_OVERDUE_3D_SUBJECT  = "Payment reminder: your rent is 3 days overdue"
	INVOICE_OVERDUE_7D_SUBJECT  = "Urgent: your rent is 7 days overdue"
	INVOICE_OVERDUE_14D_SUBJECT = "Final notice: your rent is 14 days overdue"
)

const (
	INVOICE_PAID_SUBJECT    = "Payment confirmed - thank you!"
	INVOICE_CREATED_SUBJECT = "New Invoice Ready for Payment"
	INVOICE_VOIDED_SUBJECT  = "Your Invoice Has Been Cancelled"
)

const (
	SIGNING_TOKEN_INVITE_SUBJECT = "You have a document to sign on Rentloop"
	SIGNING_TOKEN_RESENT_SUBJECT = "Reminder: You have a document to sign on Rentloop"
)

const ANNOUNCEMENT_EMAIL_SUBJECT = "New Announcement from Your Property Manager"

const (
	PM_MAINTENANCE_REQUEST_CREATED_SUBJECT = "New Maintenance Request Submitted"
	PM_OFFLINE_PAYMENT_SUBMITTED_SUBJECT   = "Tenant Has Made Some Payments"
	PM_CHECKLIST_ACKNOWLEDGED_SUBJECT      = "Tenant Has Responded to a Unit Report"
)

// ─── SMS Templates ────────────────────────────────────────────────────────────
// Keep SMS messages short (160 chars ideal, 320 max) and use only GSM-7 chars.
// Avoid: em-dash, curly quotes, emojis. Use: hyphen, straight quotes, ASCII.

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
	TENANT_APPLICATION_SUBMITTED_SMS_BODY = `Hi {{applicant_name}}, your application ({{application_code}}) for {{unit_name}} has been submitted. Track your application here: {{website_url}}/tenant-applications/{{application_code}}. We'll be in touch.`
	TENANT_CANCELLED_SMS_BODY             = `Hi {{applicant_name}}, your application ({{application_code}}) has been cancelled. Reason: {{reason}}`
	TENANT_APPLICATION_APPROVED_SMS_BODY  = `Hi {{applicant_name}}, your application for {{unit_name}} is approved! Log in to the Rentloop app with phone: {{phone_number}}`
)

const AUTH_VERIFICATION_CODE_SMS_BODY = `Your verification code is {{verification_code}}. Valid for {{expiry_duration}}. Do not share this code.`

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
	INVOICE_CREATED_SMS_BODY = `Hi {{tenant_name}}, invoice {{invoice_code}} for {{currency}} {{amount}} is ready for payment.`
	INVOICE_VOIDED_SMS_BODY  = `Hi {{tenant_name}}, invoice {{invoice_code}} has been cancelled and is no longer payable.`
)

const (
	SIGNING_TOKEN_INVITE_SMS_BODY = `Hi {{signer_name}}, you have a document to sign. Sign here: {{property_manager_portal_url}}/sign/{{token}} (expires {{expires_at}})`
	SIGNING_TOKEN_RESENT_SMS_BODY = `Reminder: Sign your document here: {{property_manager_portal_url}}/sign/{{token}} (expires {{expires_at}})`
)

const ANNOUNCEMENT_SMS_BODY = `{{announcement_title}}: {{announcement_content}}`

const TENANT_CSV_CREATED_SMS_BODY = `Your landlord started a tenancy application for you on Rentloop. Complete your profile: {{website_url}}/tenant-applications/{{application_code}}`

const (
	BOOKING_CREATED_SUBJECT            = "New Booking Created"
	BOOKING_CREATED_SMS_BODY           = `Hi {{tenant_name}}, your booking for {{unit_name}} from {{check_in_date}} to {{check_out_date}} is created. Track your booking here: {{website_url}}/bookings/track/{{booking_code}}`
	BOOKING_CONFIRMED_SUBJECT          = "Your Booking is Confirmed"
	BOOKING_CONFIRMED_SMS_BODY         = `Hi {{tenant_name}}, your booking for {{unit_name}} is confirmed. Visit the tracking page to retrieve your check in code. \n\nTracking Page: {{website_url}}/bookings/track/{{booking_code}}`
	BOOKING_CANCELLED_SUBJECT          = "Your Booking is Cancelled"
	BOOKING_CANCELLED_SMS_BODY         = `Hi {{tenant_name}}, your booking for {{unit_name}} from {{check_in_date}} to {{check_out_date}} has been cancelled. Reason: {{cancellation_reason}}`
	BOOKING_CHECKIN_REMINDER_SUBJECT   = "Reminder: Your Check-In is Tomorrow"
	BOOKING_CHECKIN_REMINDER_SMS_BODY  = `Hi {{tenant_name}}, this is a reminder that your check-in for {{unit_name}} is tomorrow. Check-in time: {{check_in_time}}.`
	BOOKING_CHECKOUT_REMINDER_SUBJECT  = "Reminder: Your Check-Out is Tomorrow"
	BOOKING_CHECKOUT_REMINDER_SMS_BODY = `Hi {{tenant_name}}, this is a reminder that your check-out for {{unit_name}} is tomorrow. Check-out time: {{check_out_time}}.`
)
