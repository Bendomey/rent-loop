import { FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import { useLoaderData, useParams, useRevalidator } from 'react-router'
import { useTenantApplicationContext } from '../context'
import { AddDocumentModal } from './add-document-modal'
import { AttachedDocumentView } from './attached-document-view'
import type { AttachedDocument } from './types'
import { useDeleteDocument } from '~/api/documents'
import { useUpdateTenantApplication } from '~/api/tenant-applications'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { useProperty } from '~/providers/property-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.tenants.applications.$applicationId.docs'

export function PropertyTenantApplicationDocs() {
	const { documentTemplates } = useLoaderData<typeof loader>()
	const { tenantApplication } = useTenantApplicationContext()

	const { applicationId } = useParams()
	const { clientUserProperty } = useProperty()
	const [open, setOpen] = useState(false)
	const revalidator = useRevalidator()
	const { mutateAsync: updateTenantApplication, isPending: isUpdating } =
		useUpdateTenantApplication()
	const { mutateAsync: deleteDocument, isPending: isDeletingDocument } =
		useDeleteDocument()

	const property_id = clientUserProperty?.property?.id

	const signatures = tenantApplication.lease_agreement_document_signatures ?? []
	const managerSignature = signatures.find((s) => s.role === 'PROPERTY_MANAGER')
	const tenantSignature = signatures.find((s) => s.role === 'TENANT')

	const attachedDoc: AttachedDocument | null =
		tenantApplication.lease_agreement_document_mode
			? {
					mode:
						tenantApplication.lease_agreement_document_mode === 'MANUAL'
							? 'manual'
							: 'online',
					title:
						tenantApplication.lease_agreement_document?.title ??
						'Lease Agreement',
					documentId:
						tenantApplication.lease_agreement_document_id ?? undefined,
					propertyManagerSignedAt: managerSignature?.created_at ?? null,
					propertyManagerSignedBy: managerSignature?.signed_by?.name
						? { name: managerSignature.signed_by.name }
						: managerSignature?.signed_by_name
							? { name: managerSignature.signed_by_name }
							: null,
					tenantSignedAt: tenantSignature?.created_at ?? null,
				}
			: null

	const handleClearDocument = async () => {
		if (!applicationId) return

		// if it's online, lets delete the document that was created
		if (attachedDoc?.mode === 'online' && attachedDoc.documentId) {
			await deleteDocument(attachedDoc.documentId)
		}

		await updateTenantApplication({
			id: applicationId,
			data: {
				lease_agreement_document_mode: null,
				lease_agreement_document_url: null,
				lease_agreement_document_id: null,
				lease_agreement_document_status: null,
			},
		})

		void revalidator.revalidate()
	}

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>Docs Setup</CardTitle>
				<CardDescription>
					Setup documentation details for the lease agreement.
				</CardDescription>
			</CardHeader>

			<CardContent>
				{attachedDoc ? (
					<AttachedDocumentView
						tenantApplication={tenantApplication}
						onClearDocument={handleClearDocument}
						isClearing={isDeletingDocument || isUpdating}
					/>
				) : (
					<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
						<FileText className="size-10 text-zinc-400" />
						<p className="mt-3 text-sm font-medium text-zinc-700">
							No document attached
						</p>
						<p className="mt-1 text-xs text-zinc-500">
							Upload or select a document to attach to this application.
						</p>
						<Button
							variant="outline"
							className="mt-4"
							onClick={() => setOpen(true)}
						>
							<Plus className="size-4" />
							Add Document
						</Button>
					</div>
				)}
			</CardContent>

			<AddDocumentModal
				open={open}
				onOpenChange={setOpen}
				propertyId={property_id}
				application={tenantApplication}
				attachedDoc={attachedDoc}
				documentTemplates={documentTemplates}
			/>
		</Card>
	)
}
