import { ArrowLeft, CheckCircle, Circle } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { SignatureRole } from '~/components/editor/nodes/signature-node'
import { SIGNATURE_ROLE_LABELS } from '~/components/editor/nodes/signature-node'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'

interface SignatureStatus {
	role: SignatureRole
	signed: boolean
}

interface SigningHeaderProps {
	documentTitle: string
	applicationCode: string
	signerRole: SignatureRole
	signatureStatuses: SignatureStatus[]
}

export function SigningHeader({
	documentTitle,
	applicationCode,
	signerRole,
	signatureStatuses,
}: SigningHeaderProps) {
	const navigate = useNavigate()
	const signedCount = signatureStatuses.filter((s) => s.signed).length
	const totalCount = signatureStatuses.length

	return (
		<div className="border-b bg-white">
			<div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
				<div className="flex items-center space-x-3">
					<Button onClick={() => navigate(-1)} size="sm" variant="ghost">
						<ArrowLeft />
					</Button>
					<Separator orientation="vertical" className="!h-5" />
					<div>
						<h1 className="text-sm font-medium">{documentTitle}</h1>
						<div className="flex items-center gap-2">
							<span className="text-xs text-zinc-500">
								Signing as{' '}
								<span className="font-medium text-zinc-700">
									{SIGNATURE_ROLE_LABELS[signerRole]}
								</span>
							</span>
							<Badge variant="outline" className="px-1.5 py-0 text-[10px]">
								#{applicationCode}
							</Badge>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3">
					{signatureStatuses.map((status) => (
						<div key={status.role} className="flex items-center gap-1.5">
							{status.signed ? (
								<CheckCircle className="size-4 text-emerald-500" />
							) : (
								<Circle className="size-4 text-zinc-300" />
							)}
							<span
								className={`text-xs ${
									status.signed ? 'text-emerald-600' : 'text-zinc-400'
								}`}
							>
								{SIGNATURE_ROLE_LABELS[status.role]}
							</span>
						</div>
					))}
					<Separator orientation="vertical" className="!h-5" />
					<span className="text-xs font-medium text-zinc-500">
						{signedCount}/{totalCount} signed
					</span>
				</div>
			</div>
		</div>
	)
}
