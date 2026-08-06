interface User {
	id: string
	name: string
	email: string
	phone_number: string
	profile_photo_url: Nullable<string>
	created_at: Date
	updated_at: Date
	client_users: Array<ClientUser>
}
