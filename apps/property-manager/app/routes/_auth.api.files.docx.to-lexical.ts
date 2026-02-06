import * as mammoth from 'mammoth'
import { redirect } from 'react-router'
import type { Route } from './+types/_auth.api.files.docx.to-lexical'
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
			const property_id = form.get('property_id') as string

	const pdfFile = form.get('file')

	if (!pdfFile) {
		return { error: 'Invalid request' }
	}

	const arrayBuffer = await (pdfFile as File).arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)

	try {
		const response = await mammoth.convertToHtml({
			buffer,
		})

		if (response.messages.length) {
			console.warn('Warnings during conversion:', response.messages)
		}

		const { lexicalState, charCount } = await htmlToLexicalState(response.value)
		const pdfName = (pdfFile as File).name
			? removeFileExtension((pdfFile as File).name)
			: 'Untitled Document'

		const createResponse = await createDocumentSSR(
			{
				title: pdfName,
				content: JSON.stringify(lexicalState),
				size: charCount,
				tags: [],
								property_id: property_id,
			},
			{
				baseUrl,
				authToken,
			},
		)
		if (!createResponse) {
			throw new Error('Failed to create document')
		}

		return new Response(JSON.stringify({ data: createResponse.id }), {
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		// TODO: sentry capture can be added here for better error tracking
		console.error('Error importing DOCX:', error)
		return new Response(JSON.stringify({ error: 'FailedToImportDOCX' }), {
			headers: { 'Content-Type': 'application/json' },
			status: 500,
		})
	}
}
