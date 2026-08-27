import {
	KIND_LABEL,
	KIND_SWATCH,
	type AvailabilityKind,
	type Stretch,
} from './helpers'
import { cn } from '~/lib/utils'

export function AvailabilityLegend({
	stretches,
	extra,
}: {
	stretches: Stretch[]
	extra?: string
}) {
	const kinds: AvailabilityKind[] = [
		'FREE',
		...Array.from(new Set(stretches.map((s) => s.kind))),
	]
	return (
		<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
			{kinds.map((kind) => (
				<span
					key={kind}
					className="text-muted-foreground flex items-center gap-2 text-xs"
				>
					<span
						className={cn('size-3 shrink-0 rounded-sm', KIND_SWATCH[kind])}
					/>
					{KIND_LABEL[kind]}
				</span>
			))}
			{extra ? (
				<span className="text-muted-foreground text-xs">{extra}</span>
			) : null}
		</div>
	)
}
