import fs from 'fs'
import pdf2html from 'pdf2html'
import type { Route } from './+types/_auth.api.files.pdf.to-thumbnail'

export async function action({ request }: Route.ActionArgs) {
	const form = await request.formData()

	const pdfFile = form.get('file')

	if (!pdfFile) {
		return { error: 'Invalid request' }
	}

	const arrayBuffer = await (pdfFile as File).arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)

	try {
		const thumbnailPath = await pdf2html.thumbnail(buffer, {
			page: 1,
			width: 200,
			imageType: 'png',
		})

		const base64 = fs.readFileSync(thumbnailPath, { encoding: 'base64' })
		const mimeType = 'image/png'
		const dataUrl = `data:${mimeType};base64,${base64}`

		return new Response(JSON.stringify({ data: dataUrl }), {
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		// TODO: sentry capture can be added here for better error tracking
		console.error('Error generating thumbnail:', error)
		return new Response(
			JSON.stringify({ error: 'FailedToGenerateThumbnail' }),
			{
				headers: { 'Content-Type': 'application/json' },
				status: 500,
			},
		)
	}
}
