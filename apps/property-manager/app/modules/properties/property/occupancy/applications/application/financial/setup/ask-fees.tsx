import { Check, Plus, X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
	formatAmount,
} from '~/lib/format-amount'
import { type Pronouns, verb } from '~/lib/pronouns'
import { cn } from '~/lib/utils'

export interface MoveInFee {
	/** Stable key for toggling; the suggestions use their category. */
	key: string
	category: ChargeCategory
	name: string
	/** Minor units. */
	amount: number
	why: string
}

/**
 * The suggestions, carried over from the old schedule preview unchanged.
 *
 * The deposit is no longer a term on the application, so it is easy to forget.
 * These are the mitigation: one tap each, with a sensible starting amount.
 */
const SUGGESTIONS: Array<{
	category: ChargeCategory
	name: string
	why: string
	amount: (rent: number) => number
}> = [
	{
		category: 'SECURITY_DEPOSIT',
		name: 'Security deposit',
		why: 'Refunded when they move out',
		amount: (rent) => rent,
	},
	{
		category: 'AGENCY_FEE',
		name: 'Agency fee',
		why: 'Your commission for finding them',
		amount: () => 50000,
	},
	{ category: 'VAT', name: 'VAT', why: 'If you charge it', amount: () => 7500 },
]

/**
 * "Does {Name} pay anything else when they move in?"
 *
 * One-time amounts, paid once at the start. Tap to add, tap again to remove —
 * nothing is created until the whole step is saved.
 */
export function AskFees({
	fees,
	onChange,
	rentMinor,
	currency,
	applicantName,
	pronouns,
	dim,
}: {
	fees: MoveInFee[]
	onChange: (next: MoveInFee[]) => void
	rentMinor: number
	currency: string
	applicantName: string
	pronouns: Pronouns
	dim: boolean
}) {
	const total = fees.reduce((sum, fee) => sum + fee.amount, 0)
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const toggle = (category: ChargeCategory) => {
		const on = fees.some((fee) => fee.key === category)
		if (on) {
			onChange(fees.filter((fee) => fee.key !== category))
			return
		}
		const suggestion = SUGGESTIONS.find((s) => s.category === category)
		if (!suggestion) return
		onChange([
			...fees,
			{
				key: category,
				category,
				name: suggestion.name,
				why: suggestion.why,
				amount: suggestion.amount(rentMinor || 100000),
			},
		])
	}

	const addCustom = () =>
		onChange([
			...fees,
			{
				key: `other-${Date.now()}`,
				category: 'OTHER',
				name: '',
				why: 'You name it',
				amount: 0,
			},
		])

	return (
		<section className="border-t py-6">
			<h2
				className={cn(
					'text-xl font-bold tracking-tight',
					dim ? 'text-muted-foreground' : '',
				)}
			>
				{/* "Does … pay", not "does … pays": after the auxiliary the verb is
				    a bare infinitive, so it must not be conjugated. The second verb
				    has no auxiliary and does agree. */}
				Does {applicantName} pay anything else when {pronouns.subject}{' '}
				{verb(pronouns, 'move')} in?
			</h2>
			<p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
				One-time amounts, paid once at the start. Tap to add one, tap again to
				take it off.
			</p>

			<div className="mt-4 flex flex-wrap gap-2">
				{SUGGESTIONS.map((suggestion) => {
					const on = fees.some((fee) => fee.key === suggestion.category)
					return (
						<Button
							key={suggestion.category}
							variant={on ? 'default' : 'outline'}
							size="sm"
							onClick={() => toggle(suggestion.category)}
						>
							{on ? (
								<Check className="size-3.5" />
							) : (
								<Plus className="size-3.5" />
							)}
							{suggestion.name}
						</Button>
					)
				})}
				<Button variant="outline" size="sm" onClick={addCustom}>
					<Plus className="size-3.5" />
					Something else
				</Button>
			</div>

			{fees.length > 0 ? (
				<div className="mt-4 rounded-xl border px-4">
					{fees.map((fee, index) => (
						<div
							key={fee.key}
							className={cn(
								'flex flex-wrap items-center gap-3 py-3',
								index === 0 ? '' : 'border-t',
							)}
						>
							<div className="min-w-40 flex-1">
								{fee.category === 'OTHER' ? (
									<Input
										aria-label="Fee name"
										placeholder="What is it for?"
										value={fee.name}
										onChange={(event) =>
											onChange(
												fees.map((f) =>
													f.key === fee.key
														? { ...f, name: event.target.value }
														: f,
												),
											)
										}
									/>
								) : (
									<>
										<p className="font-semibold">{fee.name}</p>
										<p className="text-muted-foreground mt-0.5 text-xs">
											{fee.why}
										</p>
									</>
								)}
							</div>

							<div className="flex items-center gap-2">
								<span className="text-muted-foreground text-sm font-semibold">
									{currency}
								</span>
								<Input
									aria-label={`${fee.name || 'Fee'} amount`}
									inputMode="decimal"
									className="w-32 font-semibold"
									value={String(convertPesewasToCedis(fee.amount))}
									onChange={(event) =>
										onChange(
											fees.map((f) =>
												f.key === fee.key
													? {
															...f,
															amount: convertCedisToPesewas(
																Number.parseFloat(
																	event.target.value.replace(/,/g, ''),
																) || 0,
															),
														}
													: f,
											),
										)
									}
								/>
							</div>

							<Button
								variant="outline"
								size="icon"
								aria-label={`Remove ${fee.name || 'fee'}`}
								onClick={() => onChange(fees.filter((f) => f.key !== fee.key))}
							>
								<X className="size-3.5" />
							</Button>
						</div>
					))}
				</div>
			) : null}

			<p className="text-muted-foreground mt-3 text-sm">
				{fees.length > 0
					? `${applicantName} pays ${money(total)} extra at move-in, on top of the first period’s rent.`
					: `Leave these off if ${pronouns.subject} only ${verb(pronouns, 'pay')} rent.`}
			</p>
		</section>
	)
}
