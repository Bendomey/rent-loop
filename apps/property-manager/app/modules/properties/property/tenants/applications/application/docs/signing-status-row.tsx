import { CheckCircle, Clock } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { localizedDayjs } from '~/lib/date'
import { cn } from '~/lib/utils'

interface SigningStatusRowProps {
	label: string
	signed: boolean
	signedAt: Date | null
	signedBy?: string
}

export function SigningStatusRow({
	label,
	signed,
	signedAt,
	signedBy,
}: SigningStatusRowProps) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-3">
				<div
					className={cn(
						'flex size-8 items-center justify-center rounded-full',
						signed ? 'bg-emerald-100' : 'bg-zinc-100',
					)}
				>
					{signed ? (
						<CheckCircle className="size-4 text-emerald-600" />
					) : (
						<Clock className="size-4 text-zinc-400" />
					)}
				</div>
				<div>
					<p className="text-sm font-medium">{label}</p>
					{signed && signedAt ? (
						<p className="text-xs text-zinc-500">
							Signed {signedBy ? `by ${signedBy} ` : ''}on{' '}
							{localizedDayjs(signedAt).format('MMM D, YYYY [at] h:mm A')}
						</p>
					) : (
						<p className="text-xs text-zinc-400">Awaiting signature</p>
					)}
				</div>
			</div>
			<Badge
				variant="outline"
				className={cn(
					signed
						? 'bg-emerald-100 text-emerald-700'
						: 'bg-zinc-100 text-zinc-500',
				)}
			>
				{signed ? 'Signed' : 'Pending'}
			</Badge>
		</div>
	)
}
