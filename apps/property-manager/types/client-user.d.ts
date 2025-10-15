interface ClientUser {
	id: string
	client_id: string
	client: Nullable<Client>
	name: string
	phone_number: string
	email: string
	role: 'OWNER' | 'ADMIN' | 'STAFF'
	status: 'ClientUser.Status.Active' | 'ClientUser.Status.Inactive'
	created_at: Date
	updated_at: Date
}
