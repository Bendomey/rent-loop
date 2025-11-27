interface ClientUserProperty {
	id: string
	client_user_id: string
	client_user: Nullable<ClientUser>
	property_id: string
	property: Nullable<Property>
	role: 'MANAGER' | 'STAFF'
	created_by_id: Nullable<string>
	created_by: Nullable<ClientUser>
	created_at: Date
	updated_at: Date
}

interface FetchClientUserPropertyFilter {
	role?: string
	property_id?: string
	client_user_id?: string
}
