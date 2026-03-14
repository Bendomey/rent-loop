interface MaintenanceRequest {
	id: string
	code: string
	unit_id: string
	unit?: PropertyUnit
	lease_id: Nullable<string>
	created_by_tenant_id: Nullable<string>
	created_by_client_user_id: Nullable<string>
	title: string
	description: string
	attachments: string[]
	priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'
	category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'OTHER'
	status: 'NEW' | 'IN_PROGRESS' | 'IN_REVIEW' | 'RESOLVED' | 'CANCELED'
	visibility: 'TENANT_VISIBLE' | 'INTERNAL_ONLY'
	assigned_worker_id: Nullable<string>
	assigned_worker?: ClientUser
	assigned_manager_id: Nullable<string>
	assigned_manager?: ClientUser
	started_at: Nullable<string>
	reviewed_at: Nullable<string>
	resolved_at: Nullable<string>
	canceled_at: Nullable<string>
	cancellation_reason: Nullable<string>
	created_at: string
	updated_at: string
}

type MaintenanceRequestStatus = MaintenanceRequest['status']
type MaintenanceRequestPriority = MaintenanceRequest['priority']
type MaintenanceRequestCategory = MaintenanceRequest['category']

interface FetchMaintenanceRequestFilter {
	status?: MaintenanceRequestStatus
	priority?: MaintenanceRequestPriority
	category?: MaintenanceRequestCategory
	property_id?: string
	unit_id?: string
	assigned_worker_id?: string
}
