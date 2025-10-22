import * as pdf2html from 'pdf2html'
import type { Route } from './+types/_auth.api.files.pdf.to-lexical'
import { htmlToLexicalState } from '~/lib/actions/editor-utils.server'

export async function action({ request }: Route.ActionArgs) {
	const form = await request.formData()

	const pdfFile = form.get('file')

	if (!pdfFile) {
		return { error: 'Invalid request' }
	}

	const arrayBuffer = await (pdfFile as File).arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)

	try {
		const html = await pdf2html.html(buffer)
		await htmlToLexicalState(html)

		// TODO: call to create document on API
		const documentId = 'temp-document-id'

		return new Response(JSON.stringify({ data: documentId }), {
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		// TODO: sentry capture can be added here for better error tracking
		console.error('Error importing PDF:', error)
		return new Response(JSON.stringify({ error: 'FailedToImportPDF' }), {
			headers: { 'Content-Type': 'application/json' },
			status: 500,
		})
	}
}
