import {
	Download,
	ExternalLink,
	FileCheck2,
	FilePen,
	FileText,
	PenLine,
} from 'lucide-react'

import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface Props {
	status: TrackingApplication['lease_agreement_document_status']
	signingUrl: TrackingApplication['lease_agreement_document_signing_url']
	documentUrl: TrackingApplication['lease_agreement_document_url']
}

const STATUS_MAP: Record<
	NonNullable<Props['status']>,
	{ label: string; description: string; className: string }
> = {
	DRAFT: {
		label: 'Draft',
		description:
			'Your lease document is being prepared by the property manager.',
		className: 'bg-zinc-100 text-zinc-600',
	},
	FINALIZED: {
		label: 'Ready for Signing',
		description:
			'Your lease document has been finalized and is ready for signatures.',
		className: 'bg-blue-100 text-blue-700',
	},
	SIGNING: {
		label: 'Awaiting Signatures',
		description:
			'The lease is being signed. Please review and sign the document.',
		className: 'bg-amber-100 text-amber-700',
	},
	SIGNED: {
		label: 'Fully Signed',
		description:
			'All parties have signed the lease agreement. You can view or download your copy.',
		className: 'bg-green-100 text-green-700',
	},
}

function getIcon(status: NonNullable<Props['status']>) {
	switch (status) {
		case 'DRAFT':
			return <FileText className="h-5 w-5 text-zinc-400" />
		case 'FINALIZED':
			return <FilePen className="h-5 w-5 text-blue-500" />
		case 'SIGNING':
			return <PenLine className="h-5 w-5 text-amber-500" />
		case 'SIGNED':
			return <FileCheck2 className="h-5 w-5 text-green-500" />
	}
}

export function LeaseDocumentCard({ status, signingUrl, documentUrl }: Props) {
	if (!status) {
		return (
			<div className="rounded-lg border bg-white p-6">
				<h3 className="text-sm font-semibold text-zinc-900">Lease Document</h3>
				<p className="mt-3 text-sm text-zinc-400">
					No lease document has been created yet
				</p>
			</div>
		)
	}

	const config = STATUS_MAP[status]

	return (
		<div className="rounded-lg border bg-white p-6">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-zinc-900">Lease Document</h3>
				<span
					className={cn(
						'rounded-full px-2.5 py-0.5 text-xs font-medium',
						config.className,
					)}
				>
					{config.label}
				</span>
			</div>

			<div className="mt-4 flex items-start gap-3">
				<div className="mt-0.5 flex-shrink-0">{getIcon(status)}</div>
				<p className="text-sm text-zinc-500">{config.description}</p>
			</div>

			{/* Sign CTA — show when SIGNING and we have a signing URL */}
			{(status === 'SIGNING' || status === 'FINALIZED') && signingUrl && (
				<a
					href={signingUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="mt-4 block"
				>
					<Button className="w-full gap-2 bg-rose-600 hover:bg-rose-500">
						<PenLine className="h-4 w-4" />
						Sign Document
						<ExternalLink className="h-3 w-3" />
					</Button>
				</a>
			)}

			{/* View/Download — show when SIGNED and we have a document URL */}
			{status === 'SIGNED' && documentUrl && (
				<div className="mt-4 flex gap-2">
					<a
						href={documentUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex-1"
					>
						<Button variant="outline" className="w-full gap-2">
							<ExternalLink className="h-4 w-4" />
							View Document
						</Button>
					</a>
					<a href={documentUrl} download className="flex-1">
						<Button variant="outline" className="w-full gap-2">
							<Download className="h-4 w-4" />
							Download
						</Button>
					</a>
				</div>
			)}
		</div>
	)
}
