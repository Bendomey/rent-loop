import { Check, FileText, Plus, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import {
	Link,
	useLoaderData,
	useParams,
	useRevalidator,
	useRouteLoaderData,
} from 'react-router'
import ApproveTenantApplicationModal from '../../approve'
import CancelTenantApplicationModal from '../../cancel'
import { getDocsItems } from '../components/checklist-docs'
import { requiredItems } from '../components/checklist-types'
import { StepPageHeader, type StepPill } from '../components/step-page-header'
import { useCalculateChecklist } from '../components/use-calculate-checklist'
import { AddDocumentModal } from './add-document-modal'
import { AttachedDocumentView } from './attached-document-view'
import type { AttachedDocument } from './types'
import { useDeleteDocument } from '~/api/documents'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
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
	const [openApprove, setOpenApprove] = useState(false)
	const [openCancel, setOpenCancel] = useState(false)
	const revalidator = useRevalidator()
	const { mutateAsync: updateTenantApplication, isPending: isUpdating } =
		useAdminUpdateTenantApplication()
	const { mutateAsync: deleteDocument, isPending: isDeletingDocument } =
		useDeleteDocument()

	const tenantApplication = loaderData?.tenantApplication
	const property_id = loaderData?.clientUserProperty?.property_id
	const baseUrl = `/properties/${safeString(property_id)}/occupancy/applications/${safeString(tenantApplication?.id)}`

	// Hooks run before the guard below: React requires a stable call order, so
	// the early return can't come first — see the same note on the overview page.
	const { steps, canApprove } = useCalculateChecklist(
		tenantApplication as TenantApplication,
		baseUrl,
	)

	if (!tenantApplication) {
		return (
			<div className="m-5 flex items-center justify-center">
				<p className="text-muted-foreground text-sm">
					Lease application not found.
				</p>
			</div>
		)
	}

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

	// Decisions on the application only make sense while it's still in progress
	// — mirrors the gate the overview page's lead card uses.
	const canDecide =
		tenantApplication.status === 'TenantApplication.Status.InProgress'
	const paymentsMade =
		(tenantApplication.financial_account?.total_settled ?? 0) > 0

	// What's holding the approval gate closed — the same rule `canApprove`
	// checks, named per step so the sidebar can point at what's left.
	const outstandingSteps = steps.filter(
		(step) =>
			step.items.length > 0 && !requiredItems(step.items).every((i) => i.done),
	)

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
		<div className="m-5 mx-auto w-full max-w-7xl">
			<StepPageHeader
				title={title}
				subtitle={subtitle}
				pill={pill}
				pillTone={pillTone}
				backHref={baseUrl}
			/>

			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-8">
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

				{canDecide ? (
					<div className="col-span-12 lg:col-span-4">
						<PropertyPermissionGuard roles={['MANAGER']}>
							<Card className="shadow-none">
								<CardContent>
									<p className="font-bold">Ready to decide?</p>
									<p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
										Approve to create {pronouns.possessive} lease, or decline to
										end this application. Nothing filled in is deleted either
										way.
									</p>
									<div className="mt-3.5 flex flex-col gap-2">
										<Button
											disabled={!canApprove}
											onClick={() => setOpenApprove(true)}
										>
											<Check className="size-4" />
											Approve &amp; make the lease
										</Button>
										<Button
											variant="outline"
											disabled={paymentsMade}
											onClick={() => setOpenCancel(true)}
										>
											Decline this application
										</Button>
									</div>

									{!canApprove && outstandingSteps.length > 0 ? (
										<div className="mt-3.5 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
											<div className="flex gap-2">
												<TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
												<div className="space-y-1">
													<p className="text-sm font-medium text-amber-800 dark:text-amber-300">
														Finish these steps to approve
													</p>
													<ul className="space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
														{outstandingSteps.map((step) => (
															<li key={step.key}>
																<Link
																	to={step.href}
																	className="underline hover:no-underline"
																>
																	{step.label}
																</Link>
																{step.note ? ` — ${step.note}` : ''}
															</li>
														))}
													</ul>
												</div>
											</div>
										</div>
									) : null}
								</CardContent>
							</Card>
						</PropertyPermissionGuard>
					</div>
				) : null}
			</div>

			<CancelTenantApplicationModal
				opened={openCancel}
				setOpened={setOpenCancel}
				data={tenantApplication}
				propertyId={safeString(property_id)}
			/>
			<ApproveTenantApplicationModal
				opened={openApprove}
				setOpened={setOpenApprove}
				data={tenantApplication}
				propertyId={safeString(property_id)}
			/>
		</div>
	)
}
