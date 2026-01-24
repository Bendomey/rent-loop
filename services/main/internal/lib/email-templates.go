package lib

const SUPPORT_DETAILS_TEMPLATE = `If you have any questions, feel free to contact us at {{support_email}} / {{support_phone}}.`

const (
	CLIENT_APPLICATION_SUBMITTED_SUBJECT = "Your Rentloop Application Received"
	CLIENT_APPLICATION_SUBMITTED_BODY    = `
Hi {{owner_name}},

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
	CLIENT_APPLICATION_ACCEPTED_BODY    = `
Hi {{owner_name}},

Great news! Your property owner application has been approved.  
Welcome to Rentloop — we're excited to have you on board.

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
	CLIENT_USER_ADDED_BODY    = `
Hey {{name}},

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
	CLIENT_USER_PASSWORD_RESET_SUBJECT = "Reset Your Rentloop Password"
	CLIENT_USER_PASSWORD_RESET_BODY    = `
Hey {{name}},

We received a request to reset your password.
Click the link below to set a new password:

{{property_manager_portal_url}}/reset-your-password?token={{reset_token}}

If you didn’t request this, you can safely ignore this email — your account is secure.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop Team
`
)

const (
	CLIENT_USER_ACTIVATED_SUBJECT = "Client User Activated"
	CLIENT_USER_ACTIVATED_BODY    = `
Hey {{name}},

Your account has been activated. You can now log back in.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The rentloop Team
	`
)

const (
	CLIENT_USER_DEACTIVATED_SUBJECT = "Client User Deactivated"
	CLIENT_USER_DEACTIVATED_BODY    = `
Hey {{name}},

Your account has been deactivated. Reach out to your admin.

Reason: {{reason}}

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The rentloop Team
`
)

const (
	CLIENT_USER_PASSWORD_UPDATED_SUBJECT = "Your Rentloop Password Updated"
	CLIENT_USER_PASSWORD_UPDATED_BODY    = `
Hey {{name}},

Your password has been changed successfully. if you didn't change this, reach out to support.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The rentloop Team
`
)

const (
	TENANT_INVITED_SUBJECT = "Complete your tenant application on Rentloop"
	TENANT_INVITED_BODY    = `
Hi,

You’ve been invited to apply for a tenancy on Rentloop.

To get started, please complete your tenant application using the secure link below:
{{property_manager_portal_url}}/tenants/apply?unit={{unit_id}}&refered_by={{admin_id}}

The application helps the property owner review your details and proceed with the tenancy process.
This link is intended for you only. If you weren’t expecting this email, you can safely ignore it.

If you have any questions or experience issues while applying, please contact us at {{admin_email}}.

Best regards,
The Rentloop team
`
)

const (
	TENANT_CANCELLED_SUBJECT = "Your tenant application has been cancelled"
	TENANT_CANCELLED_BODY    = `
Hello {{applicant_name}},

We are writing to inform you that your tenant application (Application Code: {{application_code}}) has been cancelled.

Reason for cancellation:
{{reason}}

If you believe this was done in error or if you would like further clarification, please feel free to contact us for assistance.

Thank you for your interest, and we wish you the best in your housing search.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop team
`
)

const (
	TENANT_APPLICATION_SUBMITTED_SUBJECT = "Tenant Application Submitted Successfully"
	TENANT_APPLICATION_SUBMITTED_BODY    = `
Hello {{applicant_name}},

Your tenant application has been successfully submitted and is now under review.

Application Details:

Unit: {{unit_name}}

Application Code: {{application_code}}

Submitted on: {{submission_date}}

Our team will review your application and contact you if additional information is needed. You will be notified once a decision has been made.

Thank you for your interest.

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop team
`
)

const (
	TENANT_APPLICATION_APPROVED_SUBJECT = "Your Tenant Application Has Been Approved"
	TENANT_APPLICATION_APPROVED_BODY    = `
Hello {{applicant_name}},

We’re pleased to inform you that your tenant application has been Approved.

Application Details:

Unit: {{unit_name}}

Application Code: {{application_code}}

Your lease has been prepared and is currently pending.
Our team will contact you shortly with next steps, including move-in details and documentation.

You can access your account anytime using the Rentloop mobile app — simply log in with your phone number: {{phone_number}}.

If you have any questions in the meantime, feel free to reach out.

Congratulations, and welcome aboard!

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,
The Rentloop team
`
)
