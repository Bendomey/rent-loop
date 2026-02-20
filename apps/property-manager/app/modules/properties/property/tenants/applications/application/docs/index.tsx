import { FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import { useParams, useRouteLoaderData } from 'react-router'
import { AddDocumentModal } from './add-document-modal'
import { AttachedDocumentView } from './attached-document-view'
import type { AttachedDocument } from './types'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { useProperty } from '~/providers/property-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.tenants.applications.$applicationId'

// TODO: replace with real lease data from API
// const mockAttachedDoc: AttachedDocument | null = null
const mockAttachedDoc: AttachedDocument = {
	mode: 'online',
	title: 'Standard Lease Agreement',
	documentId: 'doc1',
	// propertyManagerSignedAt: new Date('2024-01-15T10:30:00Z'),
	propertyManagerSignedAt: null,
	propertyManagerSignedBy: null,
	// propertyManagerSignedBy: { name: 'Alice Johnson' },
	// tenantSignedAt: new Date('2024-01-15T10:30:00Z'),
	tenantSignedAt: null,
}

export function PropertyTenantApplicationDocs() {
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>(
		'routes/_auth.properties.$propertyId.tenants.applications.$applicationId',
	)
	const { applicationId } = useParams()
	const { clientUserProperty } = useProperty()
	const [open, setOpen] = useState(false)

	const property_id = clientUserProperty?.property?.id
	const attachedDoc = mockAttachedDoc

	if (!loaderData?.tenantApplication) return null

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
						tenantApplication={loaderData.tenantApplication}
						onChangeDocument={() => setOpen(true)}
						onClearDocument={() => {
							// TODO: call API to remove attached document
						}}
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
				applicationId={applicationId}
				attachedDoc={attachedDoc}
			/>
		</Card>
	)
}
