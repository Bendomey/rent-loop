import type { SerializedEditorState } from 'lexical'
import { useState } from 'react'
import { useLoaderData, useRevalidator } from 'react-router'
import { toast } from 'sonner'

import { useUpdateDocument } from '~/api/documents'
import { useSignDocumentDirect } from '~/api/signing'
import { useUpdateTenantApplication } from '~/api/tenant-applications'
import { SigningView } from '~/components/blocks/signing-view/signing-view'
import type { SignatureRole } from '~/components/editor/nodes/signature-node'
import {
	getSignatureStatuses,
	injectSignatureIntoState,
} from '~/lib/lexical.utils'
import { safeString } from '~/lib/strings'
import { dataUrlToBlob } from '~/lib/utils'
import type { loader } from '~/routes/_auth.properties.$propertyId_.tenants.applications.$applicationId.signing.$documentId'

export function LeaseSigningModule() {
	const { tenantApplication } = useLoaderData<typeof loader>()
	const signDocumentDirect = useSignDocumentDirect()
	const updateDocument = useUpdateDocument()
	const updateTenantApplication = useUpdateTenantApplication()
	const revalidator = useRevalidator()
	const [isSigning, setIsSigning] = useState(false)

	if (!tenantApplication) return null

	const editorState: SerializedEditorState = tenantApplication
		.lease_agreement_document?.content
		? JSON.parse(tenantApplication.lease_agreement_document.content)
		: null

	if (!editorState) return null

	const signatureStatuses = getSignatureStatuses(editorState)

	const signerName =
		[tenantApplication.created_by?.name].filter(Boolean).join(' ') ||
		'Property Manager'

	const uploadSignature = async (dataUrl: string) => {
		const blob = dataUrlToBlob(dataUrl)
		const file = new File([blob], 'signature.png', { type: 'image/png' })
		const formData = new FormData()
		formData.append('file', file)
		formData.append(
			'objectKey',
			`signatures/${tenantApplication.id}-${Date.now()}-pm.png`,
		)

		const uploadResponse = await fetch('/api/r2/upload', {
			method: 'POST',
			body: formData,
		})
		const uploadResult = (await uploadResponse.json()) as { url?: string }

		if (!uploadResponse.ok || !uploadResult.url) {
			toast.error('Failed to upload signature')
			return
		}

		return uploadResult
	}

	const handleSign = async (role: SignatureRole, signatureDataUrl: string) => {
		if (!tenantApplication.lease_agreement_document) return
		setIsSigning(true)

		try {
			// 1. Upload signature image to R2
			const uploadResult = await uploadSignature(signatureDataUrl)
			if (!uploadResult?.url) return

			// 2. Submit direct signature record (backend creates document_signatures entry)
			await signDocumentDirect.mutateAsync({
				document_id: tenantApplication.lease_agreement_document.id,
				signature_url: safeString(uploadResult.url),
				tenant_application_id: tenantApplication.id,
			})

			// 3. Stamp the matching SignatureNode in the serialized editor state
			const signedAt = new Date().toISOString()
			const updatedState = injectSignatureIntoState(
				editorState,
				role,
				uploadResult.url,
				signerName,
				signedAt,
			)

			// 4. Save the updated document content
			await updateDocument.mutateAsync({
				id: tenantApplication.lease_agreement_document.id,
				content: JSON.stringify(updatedState),
			})

			// 5. Update application status based on remaining unsigned signatures
			const allSigned = getSignatureStatuses(updatedState).every(
				(s) => s.signed,
			)
			await updateTenantApplication.mutateAsync({
				id: tenantApplication.id,
				data: {
					lease_agreement_document_status: allSigned ? 'SIGNED' : 'SIGNING',
				},
			})

			toast.success('Document signed successfully')
			void revalidator.revalidate()
		} catch {
			toast.error('Failed to sign document')
		} finally {
			setIsSigning(false)
		}
	}

	return (
		<SigningView
			documentTitle={
				tenantApplication.lease_agreement_document?.title ?? 'Lease Document'
			}
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
