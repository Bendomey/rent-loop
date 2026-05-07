interface OTP {
	code: string
	channel: 'SMS' | 'EMAIL'
	phone: Nullable<string>
	email: Nullable<string>
}
