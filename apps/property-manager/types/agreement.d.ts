interface Agreement {
	id: string
	name: string
	version: string
	content: string
	effective_date: Date
	is_active: boolean
	user_has_accepted: boolean
	created_at: Date
	updated_at: Date
}
