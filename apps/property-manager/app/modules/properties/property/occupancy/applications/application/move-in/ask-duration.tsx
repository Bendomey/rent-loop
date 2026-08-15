import { useState } from 'react'
import { DurationStepper } from './duration-stepper'
import { DURATION_PRESETS, durationLabel } from './term'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import type { PaymentFrequency } from '~/lib/schedule'
import { cn } from '~/lib/utils'

/**
 * "How long are they staying?"
 *
 * Presets come from `DURATION_PRESETS`, which is keyed by frequency — a weekly
 * unit is offered weeks, not the design fixture's months. The middle preset is
 * the norm and is labelled as such.
 */
export function AskDuration({
	value,
	onChange,
	frequency,
	readonly,
	dim,
}: {
	value: number
	onChange: (next: number) => void
	frequency: PaymentFrequency
	readonly: boolean
	/** The date is not set yet, so this question is not the one to answer. */
	dim: boolean
}) {
	const presets = DURATION_PRESETS[frequency]
	const [custom, setCustom] = useState(!presets.includes(value))

	return (
		<section className="border-t py-6">
			<h2
				className={cn(
					'text-xl font-bold tracking-tight',
					dim ? 'text-muted-foreground' : '',
				)}
			>
				{readonly ? 'How long the stay runs' : 'How long are they staying?'}
			</h2>
			<p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
				{readonly
					? 'The term runs from the move-in date above. It cannot change either.'
					: 'You can renew later — this just sets the first term, and how many rent payments it makes.'}
			</p>

			{readonly ? (
				<p className="mt-4 text-xl font-bold">
					{durationLabel(value, frequency)}
				</p>
			) : (
				<>
					<div className="mt-4 flex flex-wrap gap-3">
						{presets.map((preset, index) => {
							const on = !custom && value === preset
							return (
								<Button
									key={preset}
									variant={on ? 'default' : 'outline'}
									className="h-auto flex-col items-start gap-1 px-5 py-3"
									onClick={() => {
										onChange(preset)
										setCustom(false)
									}}
								>
									<span className="text-base font-bold">
										{durationLabel(preset, frequency)}
									</span>
									{index === 1 ? (
										// On a selected preset the button is already the primary
										// colour, so the success tint disappears into it — the
										// badge has to borrow the button's own foreground.
										<Badge
											variant="secondary"
											className={cn(
												on
													? 'bg-primary-foreground/20 text-primary-foreground'
													: 'bg-success-bg text-success',
											)}
										>
											Most common
										</Badge>
									) : (
										<span
											className={cn(
												'text-xs font-normal',
												on ? 'opacity-80' : 'text-muted-foreground',
											)}
										>
											{preset} payment{preset === 1 ? '' : 's'}
										</span>
									)}
								</Button>
							)
						})}

						<Button
							variant={custom ? 'default' : 'outline'}
							className="h-auto flex-col items-start gap-1 px-5 py-3"
							onClick={() => setCustom(true)}
						>
							<span className="text-base font-bold">Something else</span>
							<span
								className={cn(
									'text-xs font-normal',
									custom ? 'opacity-80' : 'text-muted-foreground',
								)}
							>
								Set it yourself
							</span>
						</Button>
					</div>

					{custom ? (
						<div className="bg-muted mt-4 flex flex-wrap items-center gap-3 rounded-xl p-4">
							<span className="text-sm font-semibold">They stay for</span>
							<DurationStepper
								value={value}
								onChange={onChange}
								frequency={frequency}
							/>
							<span className="text-muted-foreground text-sm">
								that&rsquo;s{' '}
								<b className="text-foreground">
									{value} payment{value === 1 ? '' : 's'}
								</b>
							</span>
						</div>
					) : null}
				</>
			)}
		</section>
	)
}
