interface Notification {
	id: string
	organization_id: string
	recipient_id: string
	recipient_type: 'CLIENT_USER' | 'TENANT_ACCOUNT'
	event: string
	category: string | null
	visibility: 'IN_APP' | 'HIDDEN'
	title: string | null
	body: string | null
	data: Record<string, unknown> | null
	read_at: string | null
	status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'
	scheduled_at: string | null
	expires_at: string | null
	created_at: string
	updated_at: string
}
