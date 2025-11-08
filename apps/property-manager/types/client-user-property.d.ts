interface ClientUserProperty {
	id: string
	client_user_id: string
	client_user: Nullable<ClientUserProperty>
	property_id: string
	property: Nullable<Property>
	role: 'MANAGER' | 'STAFF'
	created_by_id: Nullable<string>
	created_by: Nullable<ClientUser>
	created_at: Date
	updated_at: Date
}

interface FetchClientUserPropertyFilter {
	role?: ClientUserProperty['role']
}
