import { ChevronDown, ChevronUp, Info, TriangleAlert } from 'lucide-react'
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

/** Charges an invoice has already taken, and so cannot be claimed again. */
export const alreadyBilledCount = (summary: AccountSummary) =>
	summary.charges.filter(
		(charge) =>
			!charge.voided_at &&
			charge.invoiced_amount > 0 &&
			charge.status !== 'SETTLED',
	).length

/**
 * Why some charges are missing from the list.
 *
 * Exported so a caller that splits the picker across tabs can hoist it above
 * them — the omission applies to both tabs, so repeating it inside each would
 * say the same thing twice and hiding it on one would look like a difference
 * between them.
 */
export function AlreadyBilledNotice({
	summary,
	mode = 'collect',
}: {
	summary: AccountSummary
	mode?: 'collect' | 'bill'
}) {
	const count = alreadyBilledCount(summary)
	if (count === 0) return null

	return (
		<Alert>
			<Info className="size-4" />
			<AlertDescription>
				<p>
					<strong>
						{count} {count === 1 ? 'charge is' : 'charges are'} already on an
						invoice
					</strong>{' '}
					and {count === 1 ? "isn't" : "aren't"} listed here — a charge can only
					be invoiced once. To take money for {count === 1 ? 'it' : 'those'},{' '}
					{mode === 'bill'
						? 'record a payment against the invoice it is already on'
						: 'switch to “Against an invoice”'}
					.
				</p>
			</AlertDescription>
		</Alert>
	)
}

interface ChargePickerProps {
	summary: AccountSummary
	picked: Record<string, number>
	setPicked: (next: Record<string, number>) => void
	/**
	 * What the caller is doing with the selection. The arithmetic is identical;
	 * only the wording differs, because "what was paid" is a lie when the money
	 * has not arrived yet and is only being billed.
	 */
	mode?: 'collect' | 'bill'
	/**
	 * Which control to render.
	 *
	 * "both" stacks the list over the amount field, which is what the Collect
	 * section has always done. A caller with room for only one — a dialog
	 * splitting them across tabs — asks for that one, and hoists
	 * AlreadyBilledNotice itself.
	 */
	control?: 'both' | 'amount' | 'list'
	/**
	 * How far the typed amount overshoots what is left to bill, in minor units,
	 * or 0 when it fits.
	 *
	 * The fill stops when it runs out of charges, so without this the excess is
	 * discarded in silence: type 20,000 against 13,700 of charges and the
	 * invoice is quietly built for 13,700. The caller needs it to refuse.
	 */
	onExceeds?: (excess: number) => void
}

/**
 * Picks which charges go on a new invoice.
 *
 * Shared by the application's Collect section and the lease's Financials tab —
 * both compose against the same account under the same rules, so the claim
 * arithmetic must not exist twice.
 */
export function ChargePicker({
	summary,
	picked,
	setPicked,
	mode = 'collect',
	control = 'both',
	onExceeds,
}: ChargePickerProps) {
	const [amount, setAmount] = useState('')
	const [excess, setExcess] = useState(0)
	const [showAll, setShowAll] = useState(false)

	const currency = summary.account.currency
	const money = (minor: number) =>
		formatAmount(convertPesewasToCedis(minor), currency)

	const candidates = summary.charges
		.filter((charge) => !charge.voided_at && claimable(charge) > 0)
		.sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date))

	const shown = showAll ? candidates : candidates.slice(0, VISIBLE_ROWS)
	const hidden = candidates.length - shown.length

	const toggle = (charge: ChargeInstance) => {
		const next = { ...picked }
		if (next[charge.id]) delete next[charge.id]
		else next[charge.id] = claimable(charge)
		setPicked(next)
		setAmount('')
		setExcess(0)
		onExceeds?.(0)
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
		// Whatever the walk could not place is an overpayment. It is reported
		// rather than trimmed, because the number the landlord typed and the
		// number that gets billed must not silently differ.
		setExcess(Math.max(0, left))
		onExceeds?.(Math.max(0, left))
		setPicked(next)
		if (Object.keys(next).length > VISIBLE_ROWS) setShowAll(true)
	}

	const covered = Object.values(picked).reduce((sum, value) => sum + value, 0)
	const totalClaimable = candidates.reduce(
		(sum, charge) => sum + claimable(charge),
		0,
	)
	// In candidate order, so the preview reads in the same oldest-first sequence
	// the fill walked.
	const filled = candidates.filter((charge) => picked[charge.id])

	// On its own the amount IS the screen, so it gets the size to match rather
	// than sitting as a footnote under a list.
	if (control === 'amount') {
		return (
			<div className="py-4 text-center">
				<div className="flex items-baseline justify-center gap-3">
					<span className="text-muted-foreground text-xl font-bold sm:text-2xl">
						GH₵
					</span>
					<Input
						autoFocus
						inputMode="decimal"
						placeholder="0.00"
						aria-label={mode === 'bill' ? 'Amount to bill' : 'Amount received'}
						aria-invalid={excess > 0}
						className={`h-auto w-44 border-0 bg-transparent px-0 text-center !text-4xl font-bold tracking-tight tabular-nums shadow-none focus-visible:ring-0 sm:w-56 sm:!text-5xl dark:bg-transparent ${excess > 0 ? 'text-destructive' : ''}`}
						value={amount}
						onChange={(event) => applyAmount(event.target.value)}
					/>
				</div>
				<div
					className={`mx-auto mt-2 h-px w-full max-w-72 ${excess > 0 ? 'bg-destructive' : 'bg-border'}`}
				/>

				{excess > 0 ? (
					<p className="text-destructive mx-auto mt-3 flex max-w-sm items-start justify-center gap-1.5 text-xs font-semibold">
						<TriangleAlert className="mt-px size-3.5 shrink-0" />
						<span>
							{money(excess)} more than there is to bill. Only{' '}
							{money(totalClaimable)} of charges is left — reduce the amount, or
							add a charge for the difference.
						</span>
					</p>
				) : (
					<p className="text-muted-foreground mt-3 text-xs">
						{money(totalClaimable)} of charges left to bill
					</p>
				)}

				{covered > 0 ? (
					<div className="mt-6 text-left">
						<p className="text-muted-foreground mb-2 text-[11px] font-medium tracking-wide uppercase">
							This covers
						</p>
						{/* The figure alone is not an answer — what the landlord needs to
						    see is which charges it lands on and where it runs out. */}
						<div className="rounded-xl border px-4">
							{filled.map((charge) => {
								const take = picked[charge.id] ?? 0
								const partial = take < claimable(charge)
								return (
									// Wraps on a phone: the name takes the row and the figures
									// drop beneath, rather than the name collapsing to an
									// ellipsis and the date breaking over three lines.
									<div
										key={charge.id}
										className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t py-2.5 first:border-t-0"
									>
										<div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
											<p className="truncate text-sm font-medium">
												{charge.name}
											</p>
											<p className="text-muted-foreground mt-0.5 text-xs">
												Due{' '}
												{new Date(charge.due_date).toLocaleDateString('en-GB', {
													day: 'numeric',
													month: 'short',
													year: 'numeric',
												})}
											</p>
										</div>
										{partial ? (
											<span className="text-warning text-xs font-semibold whitespace-nowrap">
												Part of {money(claimable(charge))}
											</span>
										) : null}
										<span className="ml-auto text-sm font-semibold tabular-nums sm:ml-0">
											{money(take)}
										</span>
									</div>
								)
							})}
						</div>
						<p className="text-muted-foreground mt-3 text-xs">
							Oldest due first. Switch to Pick charges to choose them yourself.
						</p>
					</div>
				) : (
					<p className="text-muted-foreground mx-auto mt-4 max-w-sm text-xs leading-relaxed">
						Fills the oldest due charges first. Switch to Pick charges to choose
						them yourself.
					</p>
				)}
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{control === 'both' ? (
				<AlreadyBilledNotice summary={summary} mode={mode} />
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
							className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 border-t py-3 text-left first:border-t-0"
						>
							<Checkbox checked={on} className="pointer-events-none" />
							<div className="min-w-0 basis-[calc(100%-2rem)] sm:flex-1 sm:basis-0">
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
								className={`ml-auto text-sm font-semibold tabular-nums sm:ml-0 sm:min-w-24 sm:text-right ${on ? '' : 'text-muted-foreground'}`}
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

			{control === 'both' ? (
				<div className="flex flex-wrap items-center gap-3">
					<span className="text-muted-foreground text-sm">
						{mode === 'bill'
							? 'Or enter an amount to bill'
							: 'Or enter what was paid'}
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
			) : null}
		</div>
	)
}
