import { sanitizeFilename } from '~/lib/strings'

/**
 * Uploads a PDF Blob to R2 via the /api/r2/upload route action.
 * Returns the public URL of the uploaded file.
 */
export async function uploadPdfToR2(
	blob: Blob,
	filename: string,
): Promise<string> {
	const file = new File(
		[blob],
		`${sanitizeFilename(filename)}.pdf`,
		{ type: 'application/pdf' },
	)

	const formData = new FormData()
	formData.append('file', file)
	formData.append(
		'objectKey',
		`lease-agreements/${sanitizeFilename(filename)}-${new Date().toISOString()}.pdf`,
	)

	const response = await fetch('/api/r2/upload', {
		method: 'POST',
		body: formData,
	})

	if (!response.ok) {
		const errorData = await response.json()
		throw new Error(
			(errorData as { error?: string }).error || 'Failed to upload PDF',
		)
	}

	const data = (await response.json()) as { url: string }
	return data.url
}
