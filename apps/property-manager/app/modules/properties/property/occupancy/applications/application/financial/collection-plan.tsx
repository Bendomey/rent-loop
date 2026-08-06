import { useQueryClient } from '@tanstack/react-query'
import { Clock, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useUpdateBillingPolicy } from '~/api/financial-accounts'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import type { CollectionChoice } from '~/lib/cadence'
import { COLLECTION_CHOICES, cadenceForChoice, choiceForPolicy } from '~/lib/cadence'
import { QUERY_KEYS } from '~/lib/constants'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface CollectionPlanProps {
	summary: AccountSummary
	clientId: string
	propertyId: string
	readonly?: boolean
	/** Selecting "whole term up front" hands collection the whole ledger. */
	onCollectEverything: () => void
}

export function CollectionPlan({
	summary,
	clientId,
	propertyId,
	readonly,
	onCollectEverything,
}: CollectionPlanProps) {
	const queryClient = useQueryClient()
	const { isPending, mutate } = useUpdateBillingPolicy()

	// A prepared account is MANUAL because that is what prepare stored, not a
	// guess — so the radio reflects the truth from the first render.
	const [choice, setChoice] = useState<CollectionChoice>(
		choiceForPolicy(
			summary.account.rent_billing_cadence,
			summary.account.rent_billing_interval,
		),
	)
	const [days, setDays] = useState(summary.account.auto_issue_days_before)

	const currency = summary.account.currency
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const live = summary.charges.filter((charge) => !charge.voided_at)
	const rent = live.filter((charge) => charge.category === 'RENT')
	const oneOffs = live.filter((charge) => charge.category !== 'RENT')
	const rentEach = rent[0]?.amount ?? 0
	const months = rent.length
	const extras = oneOffs.reduce((sum, charge) => sum + charge.amount, 0)

	// The first invoice is never rent alone — one-offs already due are swept in
	// with it, so quoting the rent by itself would understate what the tenant
	// is about to be asked for.
	const subtitle: Record<CollectionChoice, string> = {
		'whole-term': `1 invoice · ${months + oneOffs.length} charges · ${money(rentEach * months + extras)}`,
		quarterly: `4 invoices · first ${money(rentEach * 3 + extras)}, then ${money(rentEach * 3)}`,
		monthly: `${months} invoices · first ${money(rentEach + extras)}, then ${money(rentEach)}`,
		manual: 'Nothing is issued automatically',
	}

	const save = (next: CollectionChoice, nextDays = days) => {
		setChoice(next)
		mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				account_id: summary.account.id,
				data: { ...cadenceForChoice(next), auto_issue_days_before: nextDays },
			},
			{
				onSuccess: () => {
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
					})
					// Whole term up front is a collection action, not a schedule:
					// nothing auto-issues, the landlord is taking the money now.
					if (next === 'whole-term') onCollectEverything()
				},
				onError: () =>
					toast.error('Could not save the collection plan. Please try again.'),
			},
		)
	}

	const automated = choice !== 'manual' && choice !== 'whole-term'

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full font-mono text-xs font-bold">
						3
					</span>
					Rent collection
					{isPending ? <Spinner /> : null}
				</CardTitle>
				<p className="text-muted-foreground mt-1 text-sm">
					{readonly
						? `Set to: ${COLLECTION_CHOICES.find((c) => c.value === choice)?.label}.`
						: oneOffs.length > 0
							? `How often Rentloop turns the rent charges into invoices. The first invoice also carries the ${oneOffs.length} one-off ${oneOffs.length === 1 ? 'charge' : 'charges'} already due — ${money(extras)}.`
							: 'How often Rentloop turns the rent charges into invoices.'}
				</p>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="grid gap-3 sm:grid-cols-2">
					{COLLECTION_CHOICES.map((option) => {
						const on = choice === option.value
						return (
							<button
								key={option.value}
								type="button"
								disabled={readonly || isPending}
								onClick={() => save(option.value)}
								className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
									on ? 'border-foreground bg-muted/40' : 'hover:bg-muted/50'
								} ${readonly ? 'opacity-60' : ''}`}
							>
								<span
									className={`mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border ${on ? 'border-foreground' : ''}`}
								>
									{on ? (
										<span className="bg-foreground size-2.5 rounded-full" />
									) : null}
								</span>
								<span className="min-w-0">
									<span className="block text-sm font-semibold">
										{option.label}
									</span>
									<span className="text-muted-foreground mt-0.5 block text-xs">
										{subtitle[option.value]}
									</span>
								</span>
							</button>
						)
					})}
				</div>

				<div
					className={`bg-muted flex flex-wrap items-center gap-3 rounded-xl p-4 ${automated ? '' : 'opacity-50'}`}
				>
					<Clock className="text-muted-foreground size-4" />
					<span className="text-sm font-medium">Issue each invoice</span>
					<div className="flex items-center rounded-lg border bg-background">
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							disabled={!automated || readonly || days <= 0}
							onClick={() => {
								const next = Math.max(0, days - 1)
								setDays(next)
								save(choice, next)
							}}
						>
							<Minus className="size-3.5" />
						</Button>
						<span className="w-8 text-center font-mono text-sm font-bold">
							{days}
						</span>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							disabled={!automated || readonly}
							onClick={() => {
								const next = days + 1
								setDays(next)
								save(choice, next)
							}}
						>
							<Plus className="size-3.5" />
						</Button>
					</div>
					<span className="text-muted-foreground text-sm">
						days before it is due
					</span>
				</div>
			</CardContent>
		</Card>
	)
}
