import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useState } from 'react'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { chargeDisplayStatus } from '~/lib/display-status'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
	formatAmount,
} from '~/lib/format-amount'

const VISIBLE_ROWS = 5

/**
 * A charge is claimable for whatever is NOT yet invoiced. A partially invoiced
 * charge keeps its remainder and stays offered; only a fully claimed one drops
 * out, because claiming it again is 400 ClaimExceedsChargeBalance.
 */
export const claimable = (charge: ChargeInstance) =>
	charge.amount - charge.invoiced_amount

interface ComposeTabProps {
	summary: AccountSummary
	picked: Record<string, number>
	setPicked: (next: Record<string, number>) => void
}

export function ComposeTab({ summary, picked, setPicked }: ComposeTabProps) {
	const [amount, setAmount] = useState('')
	const [showAll, setShowAll] = useState(false)

	const currency = summary.account.currency
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const candidates = summary.charges
		.filter((charge) => !charge.voided_at && claimable(charge) > 0)
		.sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date))

	const alreadyBilled = summary.charges.filter(
		(charge) =>
			!charge.voided_at &&
			charge.invoiced_amount > 0 &&
			charge.status !== 'SETTLED',
	).length

	const shown = showAll ? candidates : candidates.slice(0, VISIBLE_ROWS)
	const hidden = candidates.length - shown.length

	const toggle = (charge: ChargeInstance) => {
		const next = { ...picked }
		if (next[charge.id]) delete next[charge.id]
		else next[charge.id] = claimable(charge)
		setPicked(next)
		setAmount('')
	}

	// The amount shortcut fills oldest-due-first — the same walk the backend
	// uses. If it reaches past the visible rows, open the rest so nothing is
	// ticked off-screen.
	const applyAmount = (value: string) => {
		setAmount(value)
		let left = convertCedisToPesewas(
			Number.parseFloat(value.replace(/,/g, '')) || 0,
		)
		const next: Record<string, number> = {}
		for (const charge of candidates) {
			if (left <= 0) break
			const take = Math.min(claimable(charge), left)
			next[charge.id] = take
			left -= take
		}
		setPicked(next)
		if (Object.keys(next).length > VISIBLE_ROWS) setShowAll(true)
	}

	return (
		<div className="space-y-4">
			{alreadyBilled > 0 ? (
				<Alert>
					<Info className="size-4" />
					<AlertDescription>
						<strong>
							{alreadyBilled}{' '}
							{alreadyBilled === 1 ? 'charge is' : 'charges are'} already on an
							invoice
						</strong>{' '}
						and {alreadyBilled === 1 ? "isn't" : "aren't"} listed here — a
						charge can only be invoiced once. To take money for{' '}
						{alreadyBilled === 1 ? 'it' : 'those'}, switch to “Against an
						invoice”.
					</AlertDescription>
				</Alert>
			) : null}

			<div className="rounded-xl border px-4">
				{shown.map((charge) => {
					const on = Boolean(picked[charge.id])
					const partial = on && (picked[charge.id] ?? 0) < claimable(charge)
					return (
						<button
							key={charge.id}
							type="button"
							onClick={() => toggle(charge)}
							className="flex w-full items-center gap-3 border-t py-3 text-left first:border-t-0"
						>
							<Checkbox checked={on} className="pointer-events-none" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{charge.name}</p>
								<p className="text-muted-foreground mt-0.5 text-xs">
									Due{' '}
									{new Date(charge.due_date).toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'short',
										year: 'numeric',
									})}{' '}
									· {chargeDisplayStatus(charge).label}
								</p>
							</div>
							{partial ? (
								<span className="text-muted-foreground text-xs font-semibold">
									Part · {money(picked[charge.id] ?? 0)}
								</span>
							) : null}
							<span
								className={`min-w-24 text-right text-sm font-semibold tabular-nums ${on ? '' : 'text-muted-foreground'}`}
							>
								{money(claimable(charge))}
							</span>
						</button>
					)
				})}

				{candidates.length === 0 ? (
					<p className="text-muted-foreground py-4 text-sm">
						Every charge is either settled or already on an invoice.
					</p>
				) : null}

				{hidden > 0 || showAll ? (
					<div className="border-t py-2">
						<Button
							variant="ghost"
							size="sm"
							className="text-primary -ml-2"
							onClick={() => setShowAll(!showAll)}
						>
							{showAll ? (
								<ChevronUp className="size-3.5" />
							) : (
								<ChevronDown className="size-3.5" />
							)}
							{showAll
								? 'Show fewer'
								: `Show ${hidden} later ${hidden === 1 ? 'charge' : 'charges'}`}
						</Button>
					</div>
				) : null}
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<span className="text-muted-foreground text-sm">
					Or enter what was paid
				</span>
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm font-semibold">
						GH₵
					</span>
					<Input
						inputMode="decimal"
						placeholder="0.00"
						className="w-36"
						value={amount}
						onChange={(event) => applyAmount(event.target.value)}
					/>
				</div>
				<span className="text-muted-foreground text-xs">
					Fills the oldest due charges first — the ticks update as you type.
				</span>
			</div>
		</div>
	)
}
