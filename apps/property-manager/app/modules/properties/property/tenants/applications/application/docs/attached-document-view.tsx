import { CheckCircle, FileText, Pen, PenLine, X } from 'lucide-react'
import React from 'react'
import { Link, useParams } from 'react-router'
import { PromptSignatureButton } from './prompt-signature-button'
import { SigningStatusRow } from './signing-status-row'
import { useSigningTokens } from '~/api/signing'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { getWitnessNodesFromContent } from '~/lib/document.utils'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'

interface AttachedDocumentViewProps {
	tenantApplication: TenantApplication
	onClearDocument: () => void
	isClearing: boolean
}

const DOC_STATUS_LABEL: Record<string, string> = {
	DRAFT: 'Draft',
	FINALIZED: 'Ready for Signing',
	SIGNING: 'Signing',
	SIGNED: 'Signed',
}

const DOC_STATUS_CLASS: Record<string, string> = {
	DRAFT: 'border-zinc-300 bg-zinc-100 text-zinc-600',
	FINALIZED: 'border-blue-300 bg-blue-50 text-blue-700',
	SIGNING: 'border-amber-300 bg-amber-50 text-amber-700',
	SIGNED: 'border-emerald-300 bg-emerald-50 text-emerald-700',
}

export function AttachedDocumentView({
	tenantApplication,
	onClearDocument,
	isClearing,
}: AttachedDocumentViewProps) {
	const { propertyId, applicationId } = useParams()
	const isManual = tenantApplication.lease_agreement_document_mode === 'MANUAL'
	const adminSignature =
		tenantApplication.lease_agreement_document_signatures?.find(
			(signature) => signature.role === 'PROPERTY_MANAGER',
		)
	const adminSigned = Boolean(adminSignature)
	const tenantSignature =
		tenantApplication.lease_agreement_document_signatures?.find(
			(signature) => signature.role === 'TENANT',
		)
	const tenantSigned = Boolean(tenantSignature)

	const witnessNodes = getWitnessNodesFromContent(
		tenantApplication.lease_agreement_document?.content,
	)
	const pmWitnessSignatures = (
		tenantApplication.lease_agreement_document_signatures ?? []
	).filter((sig) => sig.role === 'PM_WITNESS')
	const tenantWitnessSignatures = (
		tenantApplication.lease_agreement_document_signatures ?? []
	).filter((sig) => sig.role === 'TENANT_WITNESS')
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

	const documentId = tenantApplication.lease_agreement_document_id
	const { data: signingTokens } = useSigningTokens({
		filters: {
			document_id: documentId ?? undefined,
			tenant_application_id: applicationId,
		},
	})

	const tenantToken =
		signingTokens?.rows?.find((t) => t.role === 'TENANT') ?? null
	const pmWitnessTokens =
		signingTokens?.rows?.filter((t) => t.role === 'PM_WITNESS') ?? []
	const tenantWitnessTokens =
		signingTokens?.rows?.filter((t) => t.role === 'TENANT_WITNESS') ?? []

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between rounded-lg border p-4">
				<div className="flex items-center gap-3">
					<Badge
						variant="default"
						className="flex h-10 w-10 flex-col bg-blue-100 p-1"
					>
						<FileText className="h-full w-full text-blue-600" />
						<span className="text-[7px] font-bold text-black">
							{isManual ? 'PDF' : 'DOCX'}
						</span>
					</Badge>
					<div>
						<div className="flex items-center gap-2">
							<p className="text-sm font-medium">
								{tenantApplication.lease_agreement_document?.title}
							</p>
							{tenantApplication.lease_agreement_document_status && (
								<Badge
									variant="outline"
									className={cn(
										'text-[10px] font-semibold',
										DOC_STATUS_CLASS[
											tenantApplication.lease_agreement_document_status
										],
									)}
								>
									{DOC_STATUS_LABEL[
										tenantApplication.lease_agreement_document_status
									] ?? tenantApplication.lease_agreement_document_status}
								</Badge>
							)}
						</div>
						<p className="text-xs text-zinc-500">
							{isManual ? 'Manually uploaded' : 'Selected from library'}
						</p>
					</div>
				</div>
				<Button
					variant="outline"
					size="sm"
					className='hover:text-red-500" text-red-400'
					disabled={isClearing}
					onClick={onClearDocument}
				>
					{isClearing ? <Spinner /> : <X className="size-4" />}
					Remove
				</Button>
			</div>

			{isManual ? (
				<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
					<div className="flex items-center gap-2">
						<CheckCircle className="size-5 text-emerald-600" />
						<p className="text-sm font-medium text-emerald-700">
							Document ready
						</p>
					</div>
					<p className="mt-1 pl-7 text-xs text-emerald-600">
						Manually uploaded documents are assumed to be pre-signed and ready
						to go.
					</p>
				</div>
			) : tenantApplication.lease_agreement_document_status === 'DRAFT' ? (
				<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
					<div className="flex items-center gap-2">
						<PenLine className="size-5 text-zinc-500" />
						<p className="text-sm font-medium text-zinc-700">
							Document needs editing
						</p>
					</div>
					<p className="mt-1 pl-7 text-xs text-zinc-500">
						This document is in draft. Edit and finalize it before sending for
						signatures.
					</p>
					<Button size="sm" className="mt-3 ml-7" asChild>
						<Link
							to={`/properties/${propertyId}/tenants/applications/${applicationId}/lease-editor/${tenantApplication.lease_agreement_document_id}`}
						>
							<PenLine className="size-4" />
							Edit Document
						</Link>
					</Button>
				</div>
			) : (
				<div className="space-y-3">
					{tenantApplication.lease_agreement_document_status ===
						'FINALIZED' && (
						<div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
							<p className="text-xs text-amber-700">
								Need to make changes?{' '}
								<Link
									to={`/properties/${propertyId}/tenants/applications/${applicationId}/lease-editor/${tenantApplication.lease_agreement_document_id}`}
									className="font-medium underline underline-offset-2"
								>
									Open the editor
								</Link>{' '}
								and revert the document to draft.
							</p>
						</div>
					)}

					{['SIGNING', 'SIGNED'].includes(
						safeString(tenantApplication.lease_agreement_document_status),
					) && (
						<div className="rounded-lg border border-green-200 bg-green-50 p-3">
							<p className="text-xs text-green-700">
								<Link
									to={`/properties/${propertyId}/tenants/applications/${applicationId}/signing/${tenantApplication.lease_agreement_document_id}`}
									className="font-medium underline underline-offset-2"
								>
									View the document
								</Link>{' '}
								to see the signing status and details.
							</p>
						</div>
					)}

					<p className="text-sm font-medium text-zinc-700">Signing Status</p>
					<Separator />

					<SigningStatusRow
						label="Property Manager"
						signed={adminSigned}
						signedAt={adminSignature?.created_at ?? null}
						signedBy={adminSignature?.signed_by?.name}
					/>

					{!adminSigned && (
						<Button size="sm" asChild>
							<Link
								to={`/properties/${propertyId}/tenants/applications/${applicationId}/signing/${tenantApplication.lease_agreement_document_id}`}
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
						signedBy={tenantSignature?.signed_by?.name}
					/>

					{!tenantSigned && (
						<PromptSignatureButton
							existingToken={tenantToken}
							documentId={safeString(documentId)}
							role="TENANT"
							tenantApplicationId={applicationId}
						/>
					)}

					{witnessEntries.map((entry, idx) => {
						const witnessToken =
							entry.role === 'pm_witness'
								? (pmWitnessTokens[entry.roleIdx] ?? null)
								: (tenantWitnessTokens[entry.roleIdx] ?? null)
						return (
							<React.Fragment key={idx}>
								<Separator />
								<SigningStatusRow
									label={entry.label}
									signed={Boolean(entry.signature)}
									signedAt={entry.signature?.created_at ?? null}
									signedBy={entry.signature?.signed_by?.name ?? undefined}
								/>
								<PromptSignatureButton
									existingToken={witnessToken}
									documentId={safeString(documentId)}
									role={
										entry.role === 'pm_witness'
											? 'PM_WITNESS'
											: 'TENANT_WITNESS'
									}
									tenantApplicationId={applicationId}
								/>
							</React.Fragment>
						)
					})}
				</div>
			)}
		</div>
	)
}
