export function getErrorMessage(key: string, defaultMessage?: string) {
	const errorMessages: Record<string, string> = {
		CodeIncorrect: 'The code you entered is incorrect.',
	}

	return (
		errorMessages[key] ||
		defaultMessage ||
		'An unexpected error occurred. Please try again later.'
	)
}
