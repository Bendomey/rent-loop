import { useQueryClient } from '@tanstack/react-query'
import {
	AlertTriangle,
	CheckCircle,
	FileText,
	Info,
	Loader2,
	Pen,
	PenLine,
	Plus,
	Upload,
	X,
} from 'lucide-react'
import React, { useCallback, useRef, useState } from 'react'
import { Link, useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { DocumentList } from '../../../applications/application/docs/document-list'
import { PromptSignatureButton } from '../../../applications/application/docs/prompt-signature-button'
import { SigningStatusRow } from '../../../applications/application/docs/signing-status-row'
import { lexicalToPdf } from '../../../applications/approve/lexical-to-pdf'
import { uploadPdfToR2 } from '../../../applications/approve/upload-pdf'
import { useCreateDocument } from '~/api/documents'
import {
	useCreateLeaseAgreementDocument,
	useDeleteLeaseAgreementDocument,
	useLeaseAgreementDocument,
	useUpdateLeaseAgreementDocument,
} from '~/api/lease-agreement-document'
import { useUpdateLease } from '~/api/leases'
import { useSigningTokens } from '~/api/signing'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { DocumentUpload } from '~/components/ui/document-upload'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useUploadObject } from '~/hooks/use-upload-object'
import { QUERY_KEYS } from '~/lib/constants'
import { getWitnessNodesFromContent } from '~/lib/document.utils'
import {
	buildLeaseFieldMap,
	resolveTemplateFields,
} from '~/lib/resolve-template-fields'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import type { IDocumentTemplate } from '~/modules/settings/documents/controller'
import { useClient } from '~/providers/client-provider'

type DocMode = 'manual' | 'online'

// ─── Done confirm modal ───────────────────────────────────────────────────────

interface DoneConfirmModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	mode: 'manual' | 'online'
	isProcessing: boolean
	processingStep?: string
	onConfirm: () => void
}

function DoneConfirmModal({
	open,
	onOpenChange,
	mode,
	isProcessing,
	processingStep,
	onConfirm,
}: DoneConfirmModalProps) {
	const isManual = mode === 'manual'

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				if (!isProcessing) onOpenChange(v)
			}}
		>
			<DialogContent
				className="sm:max-w-md"
				onInteractOutside={(e) => {
					if (isProcessing) e.preventDefault()
				}}
				onEscapeKeyDown={(e) => {
					if (isProcessing) e.preventDefault()
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{isManual ? 'Save Document to Lease' : 'Generate & Save PDF'}
					</DialogTitle>
					<DialogDescription>
						{isManual
							? 'This will link your uploaded document to this lease as the official lease agreement. The document is assumed to be pre-signed.'
							: 'All signatures are complete. This will generate a PDF from the signed document, upload it securely, and link it to this lease. This cannot be undone.'}
					</DialogDescription>
				</DialogHeader>

				{isProcessing && processingStep && (
					<div className="bg-muted/40 flex items-center gap-3 rounded-lg border px-4 py-3">
						<Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
						<p className="text-muted-foreground text-sm">{processingStep}</p>
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						disabled={isProcessing}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button disabled={isProcessing} onClick={onConfirm}>
						{isProcessing && <Loader2 className="size-4 animate-spin" />}
						{isManual ? 'Save' : 'Generate PDF'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

const DOC_STATUS_LABEL: Record<string, string> = {
	DRAFT: 'Draft',
	FINALIZED: 'Ready for Signing',
	SIGNING: 'Signing',
	SIGNED: 'Signed',
}

const DOC_STATUS_CLASS: Record<string, string> = {
	DRAFT:
		'border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
	FINALIZED:
		'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400',
	SIGNING:
		'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400',
	SIGNED:
		'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface LeaseDocumentModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	leaseId: string
	propertyId: string
	documentTemplates: IDocumentTemplate[]
	existingDoc?: LeaseAgreementDocument | null
}

function LeaseDocumentModal({
	open,
	onOpenChange,
	leaseId,
	propertyId,
	documentTemplates,
	existingDoc,
}: LeaseDocumentModalProps) {
	const [mode, setMode] = useState<DocMode>('manual')
	const [selectedDocument, setSelectedDocument] =
		useState<RentloopDocument | null>(null)
	const { clientUser } = useClient()
	const queryClient = useQueryClient()

	const {
		upload,
		isLoading: isUploading,
		objectUrl: uploadedUrl,
	} = useUploadObject('leases/lease-documents')
	const { mutateAsync: createDocument, isPending: isCreating } =
		useCreateDocument(safeString(clientUser?.client_id))
	const { mutateAsync: createLAD, isPending: isCreatingLAD } =
		useCreateLeaseAgreementDocument()
	const { mutateAsync: updateLAD, isPending: isUpdatingLAD } =
		useUpdateLeaseAgreementDocument()

	const isSaving = isCreating || isCreatingLAD || isUpdatingLAD
	const canSave =
		mode === 'online' ? Boolean(selectedDocument) : Boolean(uploadedUrl)

	const handleSave = async () => {
		const clientId = safeString(clientUser?.client_id)

		try {
			if (mode === 'manual') {
				if (!uploadedUrl) return
				if (existingDoc) {
					await updateLAD({
						client_id: clientId,
						property_id: propertyId,
						lease_id: leaseId,
						mode: 'MANUAL',
						document_url: uploadedUrl,
						document_id: null,
					})
				} else {
					await createLAD({
						client_id: clientId,
						property_id: propertyId,
						lease_id: leaseId,
						mode: 'MANUAL',
						document_url: uploadedUrl,
					})
				}
			} else {
				if (!selectedDocument) return
				const newDoc = await createDocument({
					title: 'Lease Agreement',
					content: selectedDocument.content,
					size: selectedDocument.size,
					tags: selectedDocument.tags,
					property_id: propertyId,
					type: 'DOCUMENT',
				})
				if (!newDoc) return
				if (existingDoc) {
					await updateLAD({
						client_id: clientId,
						property_id: propertyId,
						lease_id: leaseId,
						mode: 'ONLINE',
						document_id: newDoc.id,
						document_url: null,
					})
				} else {
					await createLAD({
						client_id: clientId,
						property_id: propertyId,
						lease_id: leaseId,
						mode: 'ONLINE',
						document_id: newDoc.id,
					})
				}
			}

			await queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.LEASE_AGREEMENT_DOCUMENT],
			})
			onOpenChange(false)
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to save document',
			)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="h-[80vh] overflow-auto sm:max-w-3xl md:h-auto">
				<DialogHeader>
					<DialogTitle>
						{existingDoc ? 'Change Document' : 'Add Document'}
					</DialogTitle>
					<DialogDescription>
						Upload your own document or select one from the library.
					</DialogDescription>
				</DialogHeader>

				<Tabs value={mode} onValueChange={(v) => setMode(v as DocMode)}>
					<TabsList>
						<TabsTrigger value="manual">
							<Upload className="size-4" />
							Manual Upload
						</TabsTrigger>
						<TabsTrigger value="online">
							<FileText className="size-4" />
							Select from Library
						</TabsTrigger>
					</TabsList>

					<TabsContent value="manual">
						<div className="space-y-3 pt-2">
							<Alert>
								<Info className="size-4" />
								<AlertTitle>Manual Upload</AlertTitle>
								<AlertDescription>
									Upload your own lease agreement. Accepted formats are PDF and
									Word documents up to 5MB.
								</AlertDescription>
							</Alert>
							<DocumentUpload
								acceptedFileTypes={[
									'application/pdf',
									'application/msword',
									'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
								]}
								label="Upload Lease Document"
								hint="Upload a PDF or Word document (max 5MB)"
								name="lease_document"
								maxByteSize={5242880}
								fileCallback={upload}
								isUploading={isUploading}
							/>
						</div>
					</TabsContent>

					<TabsContent value="online">
						<div className="space-y-3 pt-2">
							<Alert>
								<Info className="size-4" />
								<AlertTitle>Select from Library</AlertTitle>
								<AlertDescription>
									Choose from pre-existing document templates. These can be
									edited and sent for digital signing.
								</AlertDescription>
							</Alert>
							<DocumentList
								documentTemplates={documentTemplates}
								property_id={propertyId}
								selectedDocument={selectedDocument}
								onSelectDocument={setSelectedDocument}
							/>
						</div>
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button disabled={!canSave || isSaving} onClick={handleSave}>
						{(isSaving || isUploading) && (
							<Loader2 className="size-4 animate-spin" />
						)}
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// ─── Signing section (FINALIZED / SIGNING / SIGNED) ──────────────────────────

type CompleteState =
	| { status: 'IDLE' }
	| { status: 'PROCESSING'; step: string }
	| { status: 'DONE' }

interface SigningSectionProps {
	lad: LeaseAgreementDocument
	leaseId: string
	propertyId: string
	tenant?: Tenant
	lease: Lease
}

function SigningSection({
	lad,
	leaseId,
	propertyId,
	tenant,
	lease,
}: SigningSectionProps) {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const { mutateAsync: updateLease } = useUpdateLease()
	const [completeState, setCompleteState] = useState<CompleteState>({
		status: 'IDLE',
	})
	const [doneModalOpen, setDoneModalOpen] = useState(false)
	const isBuildingPdf = useRef(false)

	const handleComplete = useCallback(async () => {
		if (isBuildingPdf.current) return
		const doc = lad.document
		if (!doc?.content) {
			toast.error('No document content found to generate PDF.')
			return
		}

		isBuildingPdf.current = true
		try {
			setCompleteState({ status: 'PROCESSING', step: 'Generating PDF...' })
			const fieldMap = buildLeaseFieldMap(lease, lad.signatures ?? [])
			const parsed = JSON.parse(doc.content) as Parameters<
				typeof resolveTemplateFields
			>[0]
			const resolved = resolveTemplateFields(parsed, fieldMap)
			const pdfBlob = await lexicalToPdf(JSON.stringify(resolved), doc.title)

			setCompleteState({ status: 'PROCESSING', step: 'Uploading PDF...' })
			const pdfUrl = await uploadPdfToR2(pdfBlob, doc.title)

			setCompleteState({ status: 'PROCESSING', step: 'Saving...' })
			await updateLease({
				clientId,
				propertyId,
				leaseId,
				lease_agreement_document_url: pdfUrl,
			})

			await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEASES] })
			void revalidator.revalidate()
			setCompleteState({ status: 'DONE' })
			setDoneModalOpen(false)
			toast.success('Lease agreement completed and PDF saved.')
		} catch (err) {
			setCompleteState({ status: 'IDLE' })
			toast.error(
				err instanceof Error
					? err.message
					: 'Failed to complete lease agreement.',
			)
		} finally {
			isBuildingPdf.current = false
		}
	}, [
		lad,
		lease,
		clientId,
		propertyId,
		leaseId,
		updateLease,
		queryClient,
		revalidator,
	])

	const documentId = lad.document_id ?? ''
	const signatures = lad.signatures ?? []

	const adminSignature = signatures.find((s) => s.role === 'PROPERTY_MANAGER')
	const tenantSignature = signatures.find((s) => s.role === 'TENANT')
	const pmWitnessSignatures = signatures.filter((s) => s.role === 'PM_WITNESS')
	const tenantWitnessSignatures = signatures.filter(
		(s) => s.role === 'TENANT_WITNESS',
	)

	const witnessNodes = getWitnessNodesFromContent(lad.document?.content)
	const pmWitnessCount = witnessNodes.filter(
		(n) => n.role === 'pm_witness',
	).length
	const tenantWitnessCount = witnessNodes.filter(
		(n) => n.role === 'tenant_witness',
	).length
	const witnessEntries = witnessNodes.map((node, idx) => {
		const roleIdx = witnessNodes
			.slice(0, idx)
			.filter((n) => n.role === node.role).length
		const sig =
			node.role === 'pm_witness'
				? pmWitnessSignatures[roleIdx]
				: tenantWitnessSignatures[roleIdx]
		const showTag =
			node.role === 'pm_witness' ? pmWitnessCount > 1 : tenantWitnessCount > 1
		const label = showTag ? `${node.label} #${roleIdx + 1}` : node.label
		return { label, signature: sig ?? null, role: node.role, roleIdx }
	})

	const { data: signingTokens, isPending: isLoadingTokens } = useSigningTokens(
		clientId,
		propertyId,
		{
			filters: { document_id: documentId, lease_id: leaseId },
		},
	)

	const tenantToken =
		signingTokens?.rows?.find((t) => t.role === 'TENANT') ?? null
	const pmWitnessTokens =
		signingTokens?.rows?.filter((t) => t.role === 'PM_WITNESS') ?? []
	const tenantWitnessTokens =
		signingTokens?.rows?.filter((t) => t.role === 'TENANT_WITNESS') ?? []

	const adminSigned = Boolean(adminSignature)
	const tenantSigned = Boolean(tenantSignature)
	const allSignaturesComplete =
		adminSigned &&
		tenantSigned &&
		witnessEntries.every((entry) => Boolean(entry.signature))

	return (
		<div className="space-y-3">
			{lad.status === 'FINALIZED' && (lad.signatures ?? []).length === 0 && (
				<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
					<p className="text-xs text-amber-700 dark:text-amber-400">
						Need to make changes?{' '}
						<Link
							to={`/properties/${propertyId}/documents/${documentId}/editor?leaseId=${leaseId}&returnUrl=/properties/${propertyId}/occupancy/leases/${leaseId}`}
							className="font-medium underline underline-offset-2"
						>
							Open the editor
						</Link>{' '}
						and revert the document to draft.
					</p>
				</div>
			)}

			{['SIGNING', 'SIGNED'].includes(lad.status) && lad.document_url && (
				<div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
					<p className="text-xs text-green-700 dark:text-green-400">
						<Link
							to={`/properties/${propertyId}/documents/${documentId}/signing?leaseId=${leaseId}`}
							className="font-medium underline underline-offset-2"
						>
							View the document
						</Link>{' '}
						to see signing status and details.
					</p>
				</div>
			)}

			<p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
				Signing Status
			</p>
			<Separator />

			{isLoadingTokens ? (
				<div className="space-y-3">
					{[...Array(2)].map((_, i) => (
						<div key={i} className="flex items-center justify-between">
							<div className="space-y-1.5">
								<Skeleton className="h-3.5 w-32" />
								<Skeleton className="h-3 w-24" />
							</div>
							<Skeleton className="h-8 w-24 rounded-md" />
						</div>
					))}
				</div>
			) : (
				<>
					<SigningStatusRow
						label="Property Manager"
						signed={adminSigned}
						signedAt={adminSignature?.created_at ?? null}
						signedBy={adminSignature?.signed_by?.user?.name}
					/>
					{!adminSigned && (
						<Button size="sm" asChild>
							<Link
								to={`/properties/${propertyId}/documents/${documentId}/signing?leaseId=${leaseId}`}
							>
								<Pen className="size-4" />
								Sign Document
							</Link>
						</Button>
					)}

					<Separator />

					<SigningStatusRow
						label="Tenant"
						signed={tenantSigned}
						signedAt={tenantSignature?.created_at ?? null}
						signedBy={tenantSignature?.signed_by?.user?.name}
					/>
					{!tenantSigned && (
						<PromptSignatureButton
							existingToken={tenantToken}
							documentId={documentId}
							role="TENANT"
							propertyId={propertyId}
							leaseId={leaseId}
							email={safeString(tenant?.email)}
							phone={safeString(tenant?.phone)}
							name={
								tenant?.first_name
									? `${tenant.first_name} ${tenant.last_name ?? ''}`
									: undefined
							}
						/>
					)}

					{witnessEntries.map((entry, idx) => {
						const witnessToken =
							entry.role === 'pm_witness'
								? (pmWitnessTokens[entry.roleIdx] ?? null)
								: (tenantWitnessTokens[entry.roleIdx] ?? null)
						const witnessSigned = Boolean(entry.signature)
						return (
							<React.Fragment key={idx}>
								<Separator />
								<SigningStatusRow
									label={entry.label}
									signed={Boolean(entry.signature)}
									signedAt={entry.signature?.created_at ?? null}
									signedBy={entry.signature?.signed_by?.user?.name}
								/>
								{!witnessSigned && (
									<PromptSignatureButton
										existingToken={witnessToken}
										documentId={documentId}
										propertyId={propertyId}
										leaseId={leaseId}
										role={
											entry.role === 'pm_witness'
												? 'PM_WITNESS'
												: 'TENANT_WITNESS'
										}
									/>
								)}
							</React.Fragment>
						)
					})}

					{allSignaturesComplete &&
						lad.mode === 'ONLINE' &&
						!lad.document_url && (
							<>
								<Separator />
								{completeState.status === 'DONE' ? (
									<div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950">
										<CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
										<p className="text-sm text-emerald-700 dark:text-emerald-400">
											Lease agreement PDF saved successfully.
										</p>
									</div>
								) : (
									<div className="space-y-2">
										<p className="text-xs text-zinc-500 dark:text-zinc-400">
											All signatures are complete. Generate the final PDF and
											save it to the lease record.
										</p>
										<Button size="sm" onClick={() => setDoneModalOpen(true)}>
											<CheckCircle className="size-4" />
											Done — Generate PDF
										</Button>
									</div>
								)}
								<DoneConfirmModal
									open={doneModalOpen}
									onOpenChange={setDoneModalOpen}
									mode="online"
									isProcessing={completeState.status === 'PROCESSING'}
									processingStep={
										completeState.status === 'PROCESSING'
											? completeState.step
											: undefined
									}
									onConfirm={() => void handleComplete()}
								/>
							</>
						)}
				</>
			)}
		</div>
	)
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface LeaseAgreementDocumentSetupProps {
	leaseId: string
	propertyId: string
	lease: Lease
	tenant?: Tenant
	documentTemplates: IDocumentTemplate[]
	isManager: boolean
}

export function LeaseAgreementDocumentSetup({
	leaseId,
	propertyId,
	lease,
	tenant,
	documentTemplates,
	isManager,
}: LeaseAgreementDocumentSetupProps) {
	const { clientUser } = useClient()
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const [modalOpen, setModalOpen] = useState(false)
	const [doneModalOpen, setDoneModalOpen] = useState(false)
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

	const clientId = safeString(clientUser?.client_id)

	const { data: lad, isPending: isLoadingLAD } = useLeaseAgreementDocument(
		clientId,
		propertyId,
		leaseId,
	)
	const { mutateAsync: deleteLAD, isPending: isDeleting } =
		useDeleteLeaseAgreementDocument()
	const { mutateAsync: updateLease, isPending: isCompletingManual } =
		useUpdateLease()

	const handleManualComplete = async () => {
		if (!lad?.document_url) return
		try {
			await updateLease({
				clientId,
				propertyId,
				leaseId,
				lease_agreement_document_url: lad.document_url,
			})
			await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEASES] })
			void revalidator.revalidate()
			setDoneModalOpen(false)
			toast.success('Lease agreement document saved.')
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to save document.',
			)
		}
	}

	const handleDelete = async () => {
		try {
			await deleteLAD({
				client_id: clientId,
				property_id: propertyId,
				lease_id: leaseId,
			})
			queryClient.removeQueries({
				queryKey: [QUERY_KEYS.LEASE_AGREEMENT_DOCUMENT],
			})
			await revalidator.revalidate()
			setDeleteConfirmOpen(false)
			toast.success('Document setup removed.')
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to remove document',
			)
		}
	}

	if (isLoadingLAD) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-16 w-full rounded-lg" />
				<Skeleton className="h-12 w-full rounded-lg" />
			</div>
		)
	}

	if (!lad) {
		return (
			<>
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10">
					<FileText className="size-10 text-zinc-400" />
					<p className="mt-3 text-sm font-medium text-zinc-700">
						No lease agreement document
					</p>
					<p className="mt-1 text-xs text-zinc-500">
						Add a document to track signing for this lease.
					</p>
					{isManager && (
						<Button
							variant="outline"
							className="mt-4"
							onClick={() => setModalOpen(true)}
						>
							<Plus className="size-4" />
							Add Document
						</Button>
					)}
				</div>
				<LeaseDocumentModal
					open={modalOpen}
					onOpenChange={setModalOpen}
					leaseId={leaseId}
					propertyId={propertyId}
					documentTemplates={documentTemplates}
				/>
			</>
		)
	}

	const isManual = lad.mode === 'MANUAL'
	const isDraft = lad.status === 'DRAFT'

	return (
		<div className="space-y-4">
			{/* Document header */}
			<div className="flex items-center justify-between rounded-lg border p-4">
				<div className="flex items-center gap-3">
					<Badge
						variant="default"
						className="flex h-10 w-10 flex-col bg-blue-100 p-1 dark:bg-blue-900"
					>
						<FileText className="h-full w-full text-blue-600 dark:text-blue-400" />
						<span className="text-[7px] font-bold text-black dark:text-white">
							{isManual ? 'PDF' : 'DOCX'}
						</span>
					</Badge>
					<div>
						<div className="flex items-center gap-2">
							<p className="text-sm font-medium">
								{isManual
									? 'Lease Agreement'
									: (lad.document?.title ?? 'Lease Agreement')}
							</p>
							<Badge
								variant="outline"
								className={cn(
									'text-[10px] font-semibold',
									DOC_STATUS_CLASS[lad.status],
								)}
							>
								{DOC_STATUS_LABEL[lad.status] ?? lad.status}
							</Badge>
						</div>
						<p className="text-xs text-zinc-500">
							{isManual ? 'Manually uploaded' : 'Selected from library'}
						</p>
					</div>
				</div>
				{isManager && (
					<div className="flex gap-2">
						{isDraft && (
							<Button
								size="sm"
								variant="outline"
								onClick={() => setModalOpen(true)}
							>
								Change
							</Button>
						)}
						<Button
							size="sm"
							variant="outline"
							className="text-red-400 hover:text-red-500"
							disabled={isDeleting}
							onClick={() => setDeleteConfirmOpen(true)}
						>
							<X className="size-4" />
							Remove
						</Button>
					</div>
				)}
			</div>

			{/* Status content */}
			{isManual ? (
				<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
					<div className="flex items-center gap-2">
						<CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
						<p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
							Document ready
						</p>
					</div>
					<p className="mt-1 pl-7 text-xs text-emerald-600 dark:text-emerald-500">
						Manually uploaded documents are assumed to be pre-signed.
					</p>
					{lad.document_url && (
						<a
							href={lad.document_url}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-2 ml-7 inline-block text-xs text-blue-600 underline underline-offset-2 dark:text-blue-400"
						>
							View document
						</a>
					)}
					{!lease.lease_agreement_document_url && lad.document_url && (
						<div className="mt-3 ml-7">
							<Button size="sm" onClick={() => setDoneModalOpen(true)}>
								<CheckCircle className="size-4" />
								Done
							</Button>
						</div>
					)}
				</div>
			) : isDraft ? (
				<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
					<div className="flex items-center gap-2">
						<PenLine className="size-5 text-zinc-500 dark:text-zinc-400" />
						<p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
							Document needs editing
						</p>
					</div>
					<p className="mt-1 pl-7 text-xs text-zinc-500 dark:text-zinc-400">
						Edit and finalize the document before sending for signatures.
					</p>
					<div className="mt-3 ml-7 flex gap-2">
						{lad.document_id && (
							<Button size="sm" variant="outline" asChild>
								<Link
									to={`/properties/${propertyId}/documents/${lad.document_id}/editor?leaseId=${leaseId}&returnUrl=/properties/${propertyId}/occupancy/leases/${leaseId}`}
								>
									<PenLine className="size-4" />
									Edit Document
								</Link>
							</Button>
						)}
					</div>
				</div>
			) : (
				<SigningSection
					lad={lad}
					leaseId={leaseId}
					propertyId={propertyId}
					tenant={tenant}
					lease={lease}
				/>
			)}

			<LeaseDocumentModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				leaseId={leaseId}
				propertyId={propertyId}
				documentTemplates={documentTemplates}
				existingDoc={lad}
			/>
			<DoneConfirmModal
				open={doneModalOpen}
				onOpenChange={setDoneModalOpen}
				mode="manual"
				isProcessing={isCompletingManual}
				onConfirm={() => void handleManualComplete()}
			/>
			<Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<div className="flex items-center gap-2">
							<AlertTriangle className="size-5 text-red-500" />
							<DialogTitle>Remove document setup?</DialogTitle>
						</div>
						<DialogDescription className="space-y-2 pt-1">
							<span className="block">
								This will permanently delete the current document configuration.
								The following will be lost:
							</span>
							<ul className="list-disc space-y-1 pl-4 text-sm">
								{lad?.mode === 'ONLINE' && lad.document && (
									<li>
										The linked document —{' '}
										<span className="font-medium">{lad.document.title}</span>
									</li>
								)}
								{lad?.mode === 'MANUAL' && lad.document_url && (
									<li>The uploaded document URL</li>
								)}
								{(lad?.signatures ?? []).length > 0 && (
									<li>
										{lad!.signatures.length} recorded signature
										{lad!.signatures.length > 1 ? 's' : ''}
									</li>
								)}
								<li>All signing progress and status</li>
							</ul>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDeleteConfirmOpen(false)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							variant="destructive"
							disabled={isDeleting}
							onClick={() => void handleDelete()}
						>
							{isDeleting && <Loader2 className="size-4 animate-spin" />}
							Remove
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
