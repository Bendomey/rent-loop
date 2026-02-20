import * as pdf2html from 'pdf2html'
import { redirect } from 'react-router'
import type { Route } from './+types/_auth.api.files.pdf.to-lexical'
import { createDocumentSSR } from '~/api/documents'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { htmlToLexicalState } from '~/lib/actions/editor-utils.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { removeFileExtension } from '~/lib/strings'

export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')

	if (!authToken) {
		return redirect('/login')
	}

	const form = await request.formData()
	const property_id = form.get('property_id') as string | undefined

	const pdfFile = form.get('file')

	if (!pdfFile) {
		return { error: 'Invalid request' }
	}

	const arrayBuffer = await (pdfFile as File).arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)

	try {
		const html = await pdf2html.html(buffer)
		const { lexicalState, charCount } = await htmlToLexicalState(html)
		const pdfName = (pdfFile as File).name
			? removeFileExtension((pdfFile as File).name)
			: 'Untitled Document'

		const response = await createDocumentSSR(
			{
				title: pdfName,
				content: JSON.stringify(lexicalState),
				size: charCount,
				tags: [],
				property_id: property_id,
				type: 'TEMPLATE',
			},
			{
				baseUrl,
				authToken,
			},
		)
		if (!response) {
			throw new Error('Failed to create document')
		}

		return new Response(JSON.stringify({ data: response.id }), {
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
