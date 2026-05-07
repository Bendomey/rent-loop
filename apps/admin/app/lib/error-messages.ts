export function getErrorMessage(key: string, defaultMessage?: string) {
	const errorMessages: Record<string, string> = {
		'email already in use':
			'The email address is already associated with another account.',
		PasswordIncorrect: 'The current password you entered is incorrect.',
		CodeIncorrect: 'The code you entered is incorrect.',
	}

	return (
		errorMessages[key] ||
		defaultMessage ||
		'An unexpected error occurred. Please try again later.'
	)
}
