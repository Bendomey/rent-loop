interface ClientUser {
	id: string
}

interface Client {
	id: string
	name: string
	address: string
	country: string
	region: string
	city: string
	latitude: number
	longitude: number
	website_url: Nullable<string>
	support_phone: Nullable<string>
	support_email: Nullable<string>
}
