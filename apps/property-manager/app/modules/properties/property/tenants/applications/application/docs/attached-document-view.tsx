import { CheckCircle, FileText, Pen, Replace, X } from 'lucide-react'
import { useState } from 'react'
import { PromptTenantButton } from './prompt-tenant-button'
import { SignDocumentModal } from './sign-document-modal'
import { SigningStatusRow } from './signing-status-row'
import type { AttachedDocument } from './types'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'

interface AttachedDocumentViewProps {
	doc: AttachedDocument
	onChangeDocument: () => void
	onClearDocument: () => void
}

export function AttachedDocumentView({
	doc,
	onChangeDocument,
	onClearDocument,
}: AttachedDocumentViewProps) {
	const [signModalOpen, setSignModalOpen] = useState(false)
	const isManual = doc.mode === 'manual'
	const adminSigned = !!doc.propertyManagerSignedAt
	const tenantSigned = !!doc.tenantSignedAt

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
						<p className="text-sm font-medium">{doc.title}</p>
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
						Manually uploaded documents are assumed to be pre-signed and ready
						to go.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					<p className="text-sm font-medium text-zinc-700">Signing Status</p>
					<Separator />

					<SigningStatusRow
						label="Property Manager"
						signed={adminSigned}
						signedAt={doc.propertyManagerSignedAt}
						signedBy={doc.propertyManagerSignedBy?.name}
					/>

					{!adminSigned && (
						<Button size="sm" onClick={() => setSignModalOpen(true)}>
							<Pen className="size-4" />
							Sign Document
						</Button>
					)}

					<SignDocumentModal
						open={signModalOpen}
						onOpenChange={setSignModalOpen}
						documentTitle={doc.title}
						onSign={(_signatureDataUrl) => {
							// TODO: call API to submit admin signature
						}}
					/>

					<Separator />

					<SigningStatusRow
						label="Tenant"
						signed={tenantSigned}
						signedAt={doc.tenantSignedAt}
					/>

					{!tenantSigned && <PromptTenantButton />}
				</div>
			)}
		</div>
	)
}
