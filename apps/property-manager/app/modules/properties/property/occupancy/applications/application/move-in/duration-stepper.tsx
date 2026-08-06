import { Minus, Plus } from 'lucide-react'
import { DURATION_PRESETS, durationLabel, unitLabel } from './term'
import { Button } from '~/components/ui/button'
import type { PaymentFrequency } from '~/lib/schedule'
import { cn } from '~/lib/utils'

interface DurationStepperProps {
	value: number
	onChange: (next: number) => void
	frequency: PaymentFrequency
	disabled?: boolean
}

/**
 * How long the term runs — the second of the step's two decisions.
 *
 * A stepper rather than a number field because the useful range is small and
 * every change re-renders the whole term beside it; the presets cover the three
 * lengths that account for nearly every tenancy.
 */
export function DurationStepper({
	value,
	onChange,
	frequency,
	disabled,
}: DurationStepperProps) {
	const presets = DURATION_PRESETS[frequency]

	return (
		<div className="flex flex-wrap items-center gap-3">
			<div className="flex items-center rounded-xl border">
				<Button
					variant="ghost"
					size="icon"
					className="h-11 w-10"
					aria-label="Shorten the term"
					disabled={disabled || value <= 1}
					onClick={() => onChange(Math.max(1, value - 1))}
				>
					<Minus className="size-4" />
				</Button>
				<div className="min-w-24 text-center">
					<p className="text-xl font-bold tracking-tight tabular-nums">
						{value}
					</p>
					<p className="text-muted-foreground -mt-0.5 text-[11px]">
						{unitLabel(value, frequency)}
					</p>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-11 w-10"
					aria-label="Lengthen the term"
					disabled={disabled}
					onClick={() => onChange(value + 1)}
				>
					<Plus className="size-4" />
				</Button>
			</div>

			<div className="flex flex-wrap gap-2">
				{presets.map((preset) => {
					const on = value === preset
					return (
						<Button
							key={preset}
							variant="outline"
							size="sm"
							disabled={disabled}
							onClick={() => onChange(preset)}
							// Important, because the outline variant carries a
							// `dark:bg-input/30` that outranks a plain `bg-foreground` on
							// specificity and would win in dark mode.
							className={cn(
								'rounded-full',
								on
									? 'bg-foreground! text-background! hover:bg-foreground/90! border-transparent'
									: '',
							)}
						>
							{durationLabel(preset, frequency)}
						</Button>
					)
				})}
			</div>
		</div>
	)
}
