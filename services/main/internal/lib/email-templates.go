package lib

const SUPPORT_DETAILS_TEMPLATE = `
If you have any questions, feel free to contact us at {{support_email}}/{{support_phone}}.
`

const CLIENT_APPLICATION_SUBMITTED_SUBJECT = "Your Rentloop Application Received"
const CLIENT_APPLICATION_SUBMITTED_BODY = `
Hi {{owner_name}},

Thank you for submitting your property owner application on Rentloop!  
We've received your details and our team is currently reviewing your submission.

You'll receive an update once your application has been reviewed.  

{{SUPPORT_DETAILS_TEMPLATE}}

Best regards,  
The Rentloop Team
`

const CLIENT_APPLICATION_REJECTED_SUBJECT = "Your Rentloop Application Rejected"
const CLIENT_APPLICATION_REJECTED_BODY = `
Hi {{owner_name}},

Thank you for your interest in becoming a property owner on Rentloop.

After reviewing your application, we're unable to approve it at this time.  
Reason: {{rejection_reason}}

We encourage you to review the feedback above and reapply once the issue has been resolved.  

{{SUPPORT_DETAILS_TEMPLATE}}

Thank you for understanding,
The Rentloop Team
`

const CLIENT_APPLICATION_ACCEPTED_SUBJECT = "Your Rentloop Application Accepted"
const CLIENT_APPLICATION_ACCEPTED_BODY = `
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
