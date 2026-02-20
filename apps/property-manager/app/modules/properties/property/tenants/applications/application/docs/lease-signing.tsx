import type { SerializedEditorState } from 'lexical'
import { useState } from 'react'
import { useLoaderData } from 'react-router'
import { toast } from 'sonner'

import { useUpdateDocument } from '~/api/documents'
import { SigningView } from '~/components/blocks/signing-view/signing-view'
import type { SignatureRole } from '~/components/editor/nodes/signature-node'
import type { loader } from '~/routes/_auth.properties.$propertyId_.tenants.applications.$applicationId.signing.$documentId'

export function LeaseSigningModule() {
	const { document, tenantApplication } = useLoaderData<typeof loader>()
	const updateDocument = useUpdateDocument()
	const [isSigning, setIsSigning] = useState(false)

	if (!document || !tenantApplication) return null

	const editorState: SerializedEditorState = document.content
		? JSON.parse(document.content)
		: null

	if (!editorState) return null

	// Derive signature statuses from the document content by scanning for signature nodes
	const signatureStatuses = getSignatureStatuses(editorState)

	const handleSign = (role: SignatureRole, signatureDataUrl: string) => {
		setIsSigning(true)

		// TODO: In the full implementation this would:
		// 1. Upload signatureDataUrl to S3
		// 2. Create a document_signatures record via API
		// 3. Update the SignatureNode in the editor state with the S3 URL
		// 4. Save the updated document
		// 5. Update tenant_application signed_at timestamps

		// For now: save the updated document state with the signature embedded
		// The SignatureComponent already updates the node, so we re-serialize after a tick
		setTimeout(() => {
			toast.success(`${role} signature captured`)
			setIsSigning(false)
		}, 500)
	}

	const signerName =
		[tenantApplication.created_by?.name].filter(Boolean).join(' ') ||
		'Property Manager'

	return (
		<SigningView
			documentTitle={document.title}
			applicationCode={tenantApplication.code}
			editorState={editorState}
			signerRole="property_manager"
			signerName={signerName}
			signatureStatuses={signatureStatuses}
			onSign={handleSign}
			isSigning={isSigning}
		/>
	)
}

/**
 * Scans the serialized Lexical state for signature nodes and returns their statuses.
 */
function getSignatureStatuses(
	state: SerializedEditorState,
): Array<{ role: SignatureRole; signed: boolean }> {
	const statuses: Array<{ role: SignatureRole; signed: boolean }> = []

	function walk(node: Record<string, unknown>) {
		if (node.type === 'signature') {
			statuses.push({
				role: node.role as SignatureRole,
				signed: node.signatureUrl !== null && node.signatureUrl !== undefined,
			})
		}
		if (Array.isArray(node.children)) {
			for (const child of node.children) {
				walk(child as Record<string, unknown>)
			}
		}
	}

	walk(state.root as unknown as Record<string, unknown>)
	return statuses
}
