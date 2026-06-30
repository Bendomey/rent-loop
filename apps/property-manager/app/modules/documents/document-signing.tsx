import { useQueryClient } from '@tanstack/react-query'
import type { SerializedEditorState } from 'lexical'
import { useState } from 'react'
import { useLoaderData, useParams, useRevalidator } from 'react-router'
import { toast } from 'sonner'

import { useAdminUpdateDocument } from '~/api/documents'
import { useSignDocumentDirect } from '~/api/signing'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { QUERY_KEYS } from '~/lib/constants'
import { SigningView } from '~/components/blocks/signing-view/signing-view'
import type { SignatureRole } from '~/components/editor/nodes/signature-node'
import {
	getSignatureStatuses,
	injectSignatureIntoState,
} from '~/lib/lexical.utils'
import {
	buildTenantApplicationFieldMap,
	resolveTemplateFields,
} from '~/lib/resolve-template-fields'
import { safeString } from '~/lib/strings'
import { dataUrlToBlob } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId_.documents.$documentId.signing'

export function DocumentSigningModule() {
	const { document, tenantApplication, leaseId } =
		useLoaderData<typeof loader>()
	const { clientUser } = useClient()
	const { propertyId } = useParams()
	const signDocumentDirect = useSignDocumentDirect()
	const updateDocument = useAdminUpdateDocument()
	const updateTenantApplication = useAdminUpdateTenantApplication()
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const [isSigning, setIsSigning] = useState(false)

	const isLeaseFlow = !!leaseId

	if (!document || !propertyId) return null

	const editorState: SerializedEditorState | null = document.content
		? (JSON.parse(document.content) as SerializedEditorState)
		: null

	if (!editorState) return null

	const fieldMap = tenantApplication
		? buildTenantApplicationFieldMap(tenantApplication)
		: {}
	const resolvedEditorState = resolveTemplateFields(editorState, fieldMap)
	const signatureStatuses = getSignatureStatuses(resolvedEditorState)

	const signerName =
		tenantApplication?.created_by?.user?.name ?? 'Property Manager'

	const uploadSignature = async (dataUrl: string) => {
		const blob = dataUrlToBlob(dataUrl)
		const file = new File([blob], 'signature.png', { type: 'image/png' })
		const formData = new FormData()
		formData.append('file', file)
		formData.append(
			'objectKey',
			`signatures/${document.id}-${Date.now()}-pm.png`,
		)

		const uploadResponse = await fetch('/api/r2/upload', {
			method: 'POST',
			body: formData,
		})
		const uploadResult = (await uploadResponse.json()) as { url?: string }

		if (!uploadResponse.ok || !uploadResult.url) {
			toast.error('Failed to upload signature')
			return undefined
		}

		return uploadResult
	}

	const handleSign = async (role: SignatureRole, signatureDataUrl: string) => {
		setIsSigning(true)

		try {
			const uploadResult = await uploadSignature(signatureDataUrl)
			if (!uploadResult?.url) return

			await signDocumentDirect.mutateAsync({
				client_id: safeString(clientUser?.client_id),
				property_id: propertyId,
				document_id: document.id,
				signature_url: safeString(uploadResult.url),
				...(tenantApplication
					? { tenant_application_id: tenantApplication.id }
					: {}),
				...(isLeaseFlow ? { lease_id: leaseId } : {}),
			})

			const signedAt = new Date().toISOString()
			const updatedState = injectSignatureIntoState(
				resolvedEditorState,
				role,
				uploadResult.url,
				signerName,
				signedAt,
			)

			await updateDocument.mutateAsync({
				clientId: safeString(clientUser?.client_id),
				id: document.id,
				content: JSON.stringify(updatedState),
			})

			if (tenantApplication) {
				const allSigned = getSignatureStatuses(updatedState).every(
					(s) => s.signed,
				)
				await updateTenantApplication.mutateAsync({
					client_id: safeString(clientUser?.client_id),
					id: tenantApplication.id,
					property_id: propertyId,
					data: {
						lease_agreement_document_status: allSigned ? 'SIGNED' : 'SIGNING',
					},
				})
			}

			if (isLeaseFlow) {
				await queryClient.refetchQueries({
					queryKey: [QUERY_KEYS.LEASE_AGREEMENT_DOCUMENT],
					type: 'all',
				})
			}

			toast.success('Document signed successfully')
			void revalidator.revalidate()
		} catch {
			toast.error('Failed to sign document')
		} finally {
			setIsSigning(false)
		}
	}

	const signedCount = signatureStatuses.filter((s) => s.signed).length

	return (
		<SigningView
			key={signedCount}
			documentTitle={document.title ?? 'Document'}
			applicationCode={tenantApplication?.code}
			editorState={resolvedEditorState}
			signerRole="property_manager"
			signerName={signerName}
			signatureStatuses={signatureStatuses}
			onSign={handleSign}
			isSigning={isSigning}
		/>
	)
}
