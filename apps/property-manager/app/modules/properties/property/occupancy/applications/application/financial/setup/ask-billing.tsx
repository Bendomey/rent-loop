import { PERIOD_NOUN } from '../../move-in/term'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import type { CollectionChoice } from '~/lib/cadence'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import type { PaymentFrequency } from '~/lib/schedule'
import { cn } from '~/lib/utils'

/**
 * "How often should we send a bill?"
 *
 * The four options map 1:1 onto `CollectionChoice`. The mapping to what the
 * API stores lives in `~/lib/cadence.ts` and is deliberately not repeated
 * here: "the whole term at once" stores MANUAL rather than UPFRONT, and
 * "every month" stores EVERY_PERIOD rather than an interval of 1. Both are
 * load-bearing and both are covered by cadence.test.ts.
 */
export function AskBilling({
	value,
	onChange,
	rentMinor,
	feeTotal,
	periods,
	currency,
	frequency,
	applicantName,
	dim,
}: {
	value: CollectionChoice
	onChange: (next: CollectionChoice) => void
	rentMinor: number
	feeTotal: number
	periods: number
	currency: string
	frequency: PaymentFrequency
	applicantName: string
	dim: boolean
}) {
	const noun = PERIOD_NOUN[frequency]
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const options: Array<{
		choice: CollectionChoice
		label: string
		sub: string
		common?: boolean
	}> = [
		{
			choice: 'monthly',
			label: `Every ${noun}`,
			sub: rentMinor
				? `${periods} bills of ${money(rentMinor)}`
				: `${periods} bills`,
			common: true,
		},
		{
			choice: 'quarterly',
			label: 'Every three months',
			sub: rentMinor
				? `${Math.ceil(periods / 3)} bills of ${money(rentMinor * 3)}`
				: 'Fewer, larger bills',
		},
		{
			choice: 'whole-term',
			label: 'The whole term at once',
			sub: rentMinor
				? `1 bill of ${money(rentMinor * periods + feeTotal)}`
				: '1 bill',
		},
		{
			choice: 'manual',
			label: 'I’ll send bills myself',
			sub: 'Nothing goes out automatically',
		},
	]

	return (
		<section className="border-t py-6">
			<h2
				className={cn(
					'text-xl font-bold tracking-tight',
					dim ? 'text-muted-foreground' : '',
				)}
			>
				How often should we send {applicantName} a bill?
			</h2>
			<p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
				We email the bill and remind them when it&rsquo;s due. You can change
				this later.
			</p>

			<div className="mt-4 grid gap-3 sm:grid-cols-2">
				{options.map((option) => {
					const on = value === option.choice
					return (
						<Button
							key={option.choice}
							variant={on ? 'default' : 'outline'}
							className="h-auto flex-col items-start gap-1 px-4 py-3 text-left whitespace-normal"
							onClick={() => onChange(option.choice)}
						>
							<span className="text-base font-bold">{option.label}</span>
							<span className="flex flex-wrap items-center gap-2">
								<span
									className={cn(
										'text-xs font-normal',
										on ? 'opacity-80' : 'text-muted-foreground',
									)}
								>
									{option.sub}
								</span>
								{option.common ? (
									// A success tint disappears into a selected primary button,
									// so the badge borrows the button's own foreground.
									<Badge
										variant="secondary"
										className={cn(
											on
												? 'bg-primary-foreground/20 text-primary-foreground'
												: 'bg-success-bg text-success',
										)}
									>
										Most landlords pick this
									</Badge>
								) : null}
							</span>
						</Button>
					)
				})}
			</div>

			<p className="text-muted-foreground mt-3 text-sm leading-relaxed">
				Whatever you pick, the rent is still due on the same day each {noun}.
				This only sets how often the bill goes out.
			</p>
		</section>
	)
}
