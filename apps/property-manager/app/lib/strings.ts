// Returns strings that matches the given string in the given array regardless of the case.
export const getMatchingStrings = (str: string, arr: StringList): string[] => {
	const reg = new RegExp(str, 'i')
	return arr.filter((tag) => reg.test(tag))
}

export const safeString = (
	str: PossiblyUndefined<Nullable<string>>,
): string => {
	if (!str) return ''

	return str.trim()
}

export const toFirstUpperCase = (str: string): string => {
	if (!str) return ''

	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const removeFileExtension = (filename: string): string => {
	const lastDotIndex = filename.lastIndexOf('.')
	if (lastDotIndex === -1) return filename
	return filename.substring(0, lastDotIndex)
}

// Sanitizes a filename by replacing unsafe characters with underscores.
export function sanitizeFilename(filename: string): string {
	return filename.replace(/[^a-zA-Z0-9.-_]/g, '_')
}
