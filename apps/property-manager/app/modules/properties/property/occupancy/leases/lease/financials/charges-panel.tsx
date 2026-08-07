import { Plus, Trash2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { uninvoiced } from './account'
import { RentGroup } from '~/components/blocks/financials/rent-group'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { TONE_CLASS, chargeDisplayStatus } from '~/lib/display-status'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface ChargesPanelProps {
	summary: AccountSummary
	onAdd: () => void
	onRemove: (charge: ChargeInstance) => void
	onPayCharges: () => void
}

const day = (value: string) =>
	new Date(value).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})

export function ChargesPanel({
	summary,
	onAdd,
	onRemove,
	onPayCharges,
}: ChargesPanelProps) {
	const [openRent, setOpenRent] = useState(false)
	const currency = summary.account.currency
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const live = summary.charges.filter((charge) => !charge.voided_at)
	const rent = live
		.filter((charge) => charge.category === 'RENT')
		.sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date))
	const oneOffs = live
		.filter((charge) => charge.category !== 'RENT')
		.sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date))

	const unbilled = live.filter((charge) => uninvoiced(charge) > 0).length

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle className="col-start-1 text-lg">Charges</CardTitle>
				<p className="text-muted-foreground col-start-1 mt-1 text-sm">
					{live.length} charges · {money(summary.total_charged)} over the term.{' '}
					{unbilled} not yet on an invoice — they are swept into the next one
					once due.
				</p>
				<CardAction className="col-span-2 col-start-1 row-start-3 flex flex-wrap gap-2 justify-self-start pt-1 sm:col-span-1 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end sm:pt-0">
					<Button variant="outline" size="sm" onClick={onAdd}>
						<Plus className="size-4" />
						Add charge
					</Button>
					<Button size="sm" disabled={unbilled === 0} onClick={onPayCharges}>
						<Wallet className="size-4" />
						Pay charges
					</Button>
				</CardAction>
			</CardHeader>

			<CardContent className="space-y-3">
				<div className="rounded-xl border px-4">
					{oneOffs.map((charge, index) => {
						const status = chargeDisplayStatus(charge)
						// A charge an invoice has claimed can't be voided — the server
						// refuses until the invoice itself is voided.
						const removable = charge.invoiced_amount === 0

						return (
							<div
								key={charge.id}
								className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 ${index > 0 ? 'border-t' : ''}`}
							>
								<div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
									<p className="truncate text-sm font-medium">{charge.name}</p>
									<p className="text-muted-foreground mt-0.5 text-xs">
										Due {day(charge.due_date)}
									</p>
								</div>
								<Badge variant="outline" className={TONE_CLASS[status.tone]}>
									{status.label}
								</Badge>
								<span className="ml-auto shrink-0 text-sm font-semibold tabular-nums sm:ml-0 sm:min-w-24 sm:text-right">
									{money(charge.amount)}
								</span>
								{removable ? (
									<Button
										variant="outline"
										size="icon"
										className="size-8 shrink-0"
										aria-label={`Remove ${charge.name}`}
										onClick={() => onRemove(charge)}
									>
										<Trash2 className="size-3.5" />
									</Button>
								) : (
									<span className="hidden w-8 shrink-0 sm:block" />
								)}
							</div>
						)
					})}

					<RentGroup
						rows={rent.map((charge) => ({
							id: charge.id,
							name: charge.name,
							amount: charge.amount,
							dueDate: new Date(charge.due_date),
							charge,
						}))}
						currency={currency}
						open={openRent}
						onToggle={() => setOpenRent(!openRent)}
						onRemove={onRemove}
					/>

					<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t py-4">
						<span className="text-muted-foreground text-xs">
							Charges already on an invoice can&apos;t be removed — void the
							invoice first.
						</span>
						<span className="ml-auto text-lg font-bold tabular-nums">
							{money(summary.total_charged)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
