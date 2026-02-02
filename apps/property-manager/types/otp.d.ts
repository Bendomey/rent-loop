interface OTP {
	code: string
	channel: 'sms' | 'email'
	phone: Nullable<string>
	email: Nullable<string>
}
