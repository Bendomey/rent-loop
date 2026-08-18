import { FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import {
	useLoaderData,
	useParams,
	useRevalidator,
	useRouteLoaderData,
} from 'react-router'
import { getDocsItems } from '../components/checklist-docs'
import { requiredItems } from '../components/checklist-types'
import { StepPageHeader, type StepPill } from '../components/step-page-header'
import { AddDocumentModal } from './add-document-modal'
import { AttachedDocumentView } from './attached-document-view'
import type { AttachedDocument } from './types'
import { useDeleteDocument } from '~/api/documents'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { pronounsFor } from '~/lib/pronouns'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import type { loader as applicationLoader } from '~/routes/_auth.properties.$propertyId.occupancy.applications.$applicationId'
import type { loader } from '~/routes/_auth.properties.$propertyId.occupancy.applications.$applicationId.docs'

export function PropertyTenantApplicationDocs() {
	const { documentTemplates } = useLoaderData<typeof loader>()
	// Every step is a direct child of `$applicationId` now — the `_step` layout
	// that used to hand the application down through an outlet context is gone —
	// so the page reads the parent route's loader itself.
	const loaderData = useRouteLoaderData<
		Awaited<ReturnType<typeof applicationLoader>>
	>('routes/_auth.properties.$propertyId.occupancy.applications.$applicationId')

	const { applicationId } = useParams()
	const { clientUser } = useClient()
	const [open, setOpen] = useState(false)
	const revalidator = useRevalidator()
	const { mutateAsync: updateTenantApplication, isPending: isUpdating } =
		useAdminUpdateTenantApplication()
	const { mutateAsync: deleteDocument, isPending: isDeletingDocument } =
		useDeleteDocument()

	const tenantApplication = loaderData?.tenantApplication

	if (!tenantApplication) {
		return (
			<div className="m-5 flex items-center justify-center">
				<p className="text-muted-foreground text-sm">
					Lease application not found.
				</p>
			</div>
		)
	}

	const property_id = loaderData?.clientUserProperty?.property_id

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
					propertyManagerSignedBy: managerSignature?.signed_by?.user?.name
						? { name: managerSignature.signed_by.user?.name }
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
			await deleteDocument({
				clientId: safeString(clientUser?.client_id),
				id: attachedDoc.documentId,
			})
		}

		await updateTenantApplication({
			client_id: safeString(clientUser?.client_id),
			id: applicationId,
			property_id: safeString(property_id),
			data: {
				lease_agreement_document_mode: null,
				lease_agreement_document_url: null,
				lease_agreement_document_id: null,
				lease_agreement_document_status: null,
			},
		})

		void revalidator.revalidate()
	}

	const baseUrl = `/properties/${safeString(property_id)}/occupancy/applications/${tenantApplication.id}`
	const pronouns = pronounsFor(tenantApplication.gender)
	const applicantName = tenantApplication.first_name ?? 'the applicant'

	// Docs are optional — an application with no agreement attached has an empty
	// item list, which passes vacuously. That is why "nothing attached" is a
	// step still to work on rather than something needing attention.
	const items = requiredItems(getDocsItems(tenantApplication))
	const signed = ['SIGNED', 'SIGNING'].includes(
		safeString(tenantApplication.lease_agreement_document_status),
	)
	const readonly =
		tenantApplication.status === 'TenantApplication.Status.Completed'

	const { title, subtitle, pill, pillTone } = ((): {
		title: string
		subtitle: string
		pill: string
		pillTone: StepPill
	} => {
		if (signed || readonly)
			return {
				title: `${applicantName}’s lease papers`,
				subtitle: 'The agreement is signed, so it cannot change now.',
				pill: 'Fixed',
				pillTone: 'fixed',
			}
		if (attachedDoc && items.every((item) => item.done))
			return {
				title: `${applicantName}’s lease papers`,
				subtitle: `Everyone has signed. Nothing else is owed on ${pronouns.possessive} paperwork.`,
				pill: 'Done',
				pillTone: 'done',
			}
		if (attachedDoc)
			return {
				title: `${applicantName}’s lease papers`,
				subtitle: 'The agreement is attached. It is done once everyone signs.',
				pill: 'Step 5 of 5',
				pillTone: 'step',
			}
		return {
			title: `Papers for ${applicantName}’s lease`,
			subtitle:
				'Attach the agreement, or approve without one — this step is optional.',
			pill: 'Step 5 of 5',
			pillTone: 'step',
		}
	})()

	return (
		<div className="m-5">
			<StepPageHeader
				title={title}
				subtitle={subtitle}
				pill={pill}
				pillTone={pillTone}
				backHref={baseUrl}
			/>

			<Card className="shadow-none">
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
							{tenantApplication?.status ===
								'TenantApplication.Status.InProgress' && (
								<Button
									variant="outline"
									className="mt-4"
									onClick={() => setOpen(true)}
								>
									<Plus className="size-4" />
									Add Document
								</Button>
							)}
						</div>
					)}
				</CardContent>

				<AddDocumentModal
					open={open}
					onOpenChange={setOpen}
					propertyId={safeString(property_id)}
					application={tenantApplication}
					attachedDoc={attachedDoc}
					documentTemplates={documentTemplates}
				/>
			</Card>
		</div>
	)
}
