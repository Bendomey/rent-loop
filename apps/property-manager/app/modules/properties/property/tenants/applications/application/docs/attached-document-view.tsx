import { CheckCircle, FileText, Pen, Replace, X } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { PromptTenantButton } from './prompt-tenant-button'
import { SigningStatusRow } from './signing-status-row'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'

interface AttachedDocumentViewProps {
	tenantApplication: TenantApplication
	onChangeDocument: () => void
	onClearDocument: () => void
}

export function AttachedDocumentView({
	tenantApplication,
	onChangeDocument,
	onClearDocument,
}: AttachedDocumentViewProps) {
	const { propertyId, applicationId } = useParams()
	const isManual = tenantApplication.lease_agreement_document_mode === 'MANUAL'
	const adminSignature = tenantApplication.lease_agreement_document_signatures?.find(
		(signature) => signature.role === 'PROPERTY_MANAGER'
	)
	const adminSigned = Boolean(adminSignature)
	const tenantSignature = tenantApplication.lease_agreement_document_signatures?.find(
		(signature) => signature.role === 'TENANT'
	)
	const tenantSigned = Boolean(tenantSignature)

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
						<p className="text-sm font-medium">{tenantApplication.lease_agreement_document?.title}</p>
						<p className="text-xs text-zinc-500">
							{isManual ? 'Manually uploaded' : 'Selected from library'}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-1">
					<Button variant="outline" size="sm" onClick={onChangeDocument}>
						<Replace className="size-4" />
						Change
					</Button>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 text-red-400 hover:text-red-500"
								onClick={onClearDocument}
							>
								<X className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Remove document</TooltipContent>
					</Tooltip>
				</div>
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
						Manually uploaded documents are assumed to be pre-signed and
						ready to go.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					<p className="text-sm font-medium text-zinc-700">
						Signing Status
					</p>
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

					{!tenantSigned && <PromptTenantButton />}
				</div>
			)}
		</div>
	)
}
