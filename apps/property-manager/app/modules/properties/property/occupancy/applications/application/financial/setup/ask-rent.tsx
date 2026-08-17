import { Repeat } from 'lucide-react'
import { PERIOD_NOUN } from '../../move-in/term'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import type { PaymentFrequency } from '~/lib/schedule'

/**
 * "How much is the rent?"
 *
 * Rent is stated, never inherited. The unit's advertised figure is offered as
 * one tap, but taking it is a decision the landlord makes rather than a
 * default that quietly prices the lease.
 */
export function AskRent({
	value,
	onChange,
	unitRent,
	unitName,
	currency,
	applicantName,
	frequency,
}: {
	value: string
	onChange: (next: string) => void
	unitRent: number
	unitName: string
	currency: string
	applicantName: string
	frequency: PaymentFrequency
}) {
	const noun = PERIOD_NOUN[frequency]
	const entered = Math.round(
		(Number.parseFloat(value.replace(/,/g, '')) || 0) * 100,
	)
	const advertised = convertPesewasToCedis(unitRent)

	return (
		<section className="pb-6">
			<h2 className="text-xl font-bold tracking-tight">
				How much is the rent?
			</h2>
			<p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
				This is what {applicantName} agreed to pay you each {noun}. It
				doesn&rsquo;t have to match what the unit is advertised at.
			</p>

			<div className="mt-4 flex flex-wrap items-center gap-3">
				<Label htmlFor="agreed-rent" className="sr-only">
					Rent per {noun}
				</Label>
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm font-semibold">
						{currency}
					</span>
					<Input
						id="agreed-rent"
						inputMode="decimal"
						className="h-12 w-44 text-xl font-bold"
						placeholder="0.00"
						value={value}
						onChange={(event) => onChange(event.target.value)}
					/>
					<span className="text-muted-foreground text-sm">a {noun}</span>
				</div>

				{unitRent > 0 && entered !== unitRent ? (
					<Button
						variant="outline"
						size="sm"
						onClick={() => onChange(String(advertised))}
					>
						<Repeat className="size-3.5" />
						{unitName} is advertised at {formatAmount(advertised, currency)}
					</Button>
				) : null}
			</div>
		</section>
	)
}
