

export function getErrorMessage(key: string, defaultMessage?: string) {
    const errorMessages: Record<string, string> = {
        'email already in use': 'The email address is already associated with another account.',
    }

    return errorMessages[key] || defaultMessage || 'An unexpected error occurred. Please try again later.'
}