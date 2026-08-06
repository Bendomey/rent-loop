import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { RentGroup } from './rent-group'
import { STACKED_CARD_ACTION, STACKED_CARD_TEXT } from '../card-action'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { chargeDisplayStatus } from '~/lib/display-status'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface LedgerProps {
	summary: AccountSummary
	readonly?: boolean
	showVoided: boolean
	onToggleVoided: () => void
	onAdd: () => void
	onRemove: (charge: ChargeInstance) => void
}

const shortDate = (value: string) =>
	new Date(value).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})

function ChargeRow({
	charge,
	currency,
	onRemove,
}: {
	charge: ChargeInstance
	currency: string
	onRemove?: () => void
}) {
	const status = chargeDisplayStatus(charge)
	const voided = Boolean(charge.voided_at)

	return (
		// Wraps on a phone — the name takes the row and the status and amount drop
		// beneath it, rather than the name collapsing to one word per line.
		<div
			className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t py-3 first:border-t-0 ${voided ? 'opacity-55' : ''}`}
		>
			<div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
				<p
					className={`truncate text-sm font-medium ${voided ? 'line-through' : ''}`}
				>
					{charge.name}
				</p>
				<p className="text-muted-foreground mt-0.5 text-xs">
					{voided
						? `Removed${charge.voided_reason ? ` · ${charge.voided_reason}` : ''}`
						: `Due ${shortDate(charge.due_date)}`}
				</p>
			</div>
			<Badge variant="outline">{status.label}</Badge>
			<span className="ml-auto shrink-0 text-sm font-semibold tabular-nums sm:ml-0 sm:min-w-24 sm:text-right">
				{formatAmount(convertPesewasToCedis(charge.amount), currency)}
			</span>
			{onRemove && !voided ? (
				<Button
					variant="outline"
					size="icon"
					className="size-8 shrink-0"
					aria-label={`Remove ${charge.name}`}
					onClick={onRemove}
				>
					<Trash2 className="size-3.5" />
				</Button>
			) : (
				<span className="hidden w-8 shrink-0 sm:block" />
			)}
		</div>
	)
}

/**
 * The live ledger.
 *
 * One-offs first in due-date order, then the rent run collapsed — due-date
 * order is the order payment fills them, so the ledger and the payment picker
 * agree. Removed charges are hidden until asked for and never counted: the
 * server excludes them from every total regardless of include_voided.
 */
export function Ledger({
	summary,
	readonly,
	showVoided,
	onToggleVoided,
	onAdd,
	onRemove,
}: LedgerProps) {
	const [openRent, setOpenRent] = useState(false)
	const currency = summary.account.currency

	const live = summary.charges.filter((charge) => !charge.voided_at)
	const voided = summary.charges.filter((charge) => charge.voided_at)

	const rent = live
		.filter((charge) => charge.category === 'RENT')
		.sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date))
	const oneOffs = live
		.filter((charge) => charge.category !== 'RENT')
		.sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date))

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle
					className={`flex items-center gap-2 text-lg ${STACKED_CARD_TEXT}`}
				>
					<span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full font-mono text-xs font-bold">
						2
					</span>
					Charges
				</CardTitle>
				<p
					className={`text-muted-foreground mt-1 text-sm ${STACKED_CARD_TEXT}`}
				>
					<span className="text-foreground font-semibold">
						{live.length} charges ·{' '}
						{formatAmount(
							convertPesewasToCedis(summary.total_charged),
							currency,
						)}
					</span>{' '}
					— in due-date order, the order payment fills them.
				</p>
				{!readonly ? (
					<CardAction className={STACKED_CARD_ACTION}>
						<Button variant="outline" size="sm" onClick={onAdd}>
							<Plus className="size-4" />
							Add charge
						</Button>
					</CardAction>
				) : null}
			</CardHeader>

			<CardContent className="space-y-3">
				<div className="rounded-xl border px-4">
					{oneOffs.map((charge) => (
						<ChargeRow
							key={charge.id}
							charge={charge}
							currency={currency}
							onRemove={readonly ? undefined : () => onRemove(charge)}
						/>
					))}

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
						onRemove={readonly ? undefined : onRemove}
					/>

					{showVoided
						? voided.map((charge) => (
								<ChargeRow
									key={charge.id}
									charge={charge}
									currency={currency}
								/>
							))
						: null}

					<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t py-3">
						<Button
							variant="ghost"
							size="sm"
							className="text-muted-foreground -ml-2"
							onClick={onToggleVoided}
						>
							{showVoided ? (
								<EyeOff className="size-3.5" />
							) : (
								<Eye className="size-3.5" />
							)}
							{showVoided ? 'Hide removed charges' : 'Show removed charges'}
						</Button>
						{/* ml-auto so the total keeps the right edge once the toggle
						    takes a line of its own. */}
						<span className="ml-auto text-lg font-bold tabular-nums">
							{formatAmount(
								convertPesewasToCedis(summary.total_charged),
								currency,
							)}
						</span>
					</div>
				</div>

				<p className="text-muted-foreground text-xs">
					Removed charges stay in the record but are excluded from every total.
					Charges can't be edited — remove and re-add.
				</p>
			</CardContent>
		</Card>
	)
}
