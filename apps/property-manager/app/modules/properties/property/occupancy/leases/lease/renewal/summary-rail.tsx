import { cn } from '~/lib/utils'

/**
 * The plain-words rail that follows along.
 *
 * It reads back what has been set, in ordinary sentences, before anything is
 * saved — and carries the one button that commits it. The design puts the
 * action here rather than under the form so the sentence and the commitment
 * sit together.
 */
export function SummaryRail({
	sentence,
	rows,
	actionLabel,
	onAction,
	ready,
	foot,
	pending,
	tone = 'primary',
}: {
	sentence: React.ReactNode
	rows?: [string, string][]
	actionLabel: string
	onAction: () => void
	ready: boolean
	foot: string
	pending?: boolean
	/** `warning` when what the rail is reading back cannot be committed. */
	tone?: 'primary' | 'warning'
}) {
	return (
		<aside className="w-[372px] shrink-0">
			<div className="bg-card overflow-hidden rounded-xl border">
				<div
					className={cn(
						'border-b px-6 py-[22px]',
						tone === 'warning' ? 'bg-warning-bg' : 'bg-primary/8',
					)}
				>
					<p className="text-base font-bold">In plain words</p>
					<p className="text-foreground-soft mt-2.5 text-[15px] leading-[1.7]">
						{sentence}
					</p>
				</div>
				{rows && rows.length > 0 && (
					<div className="px-6 pt-[18px] pb-5">
						{rows.map(([label, value], index) => (
							<div
								key={label}
								className={cn(
									'flex items-baseline justify-between gap-3 py-[11px]',
									index > 0 ? 'border-border/60 border-t' : '',
								)}
							>
								<span className="text-muted-foreground text-sm">{label}</span>
								<span className="text-right text-[14.5px] font-bold">
									{value}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
			<div className="mt-4">
				<button
					type="button"
					onClick={ready && !pending ? onAction : undefined}
					disabled={!ready || pending}
					className={cn(
						'w-full rounded-[14px] px-[18px] py-4 text-base font-bold',
						ready && !pending
							? 'bg-primary text-primary-foreground cursor-pointer'
							: 'bg-foreground/10 text-muted-foreground/60 cursor-default',
					)}
				>
					{pending ? 'Signing…' : actionLabel}
				</button>
				<p className="text-muted-foreground mt-[11px] text-[13px] leading-[1.6]">
					{foot}
				</p>
			</div>
		</aside>
	)
}
