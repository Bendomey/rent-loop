import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { formatDay } from '../../../applications/application/move-in/term'
import { type ChainTerm, livingTerms, tenancyLength } from './chain'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

/** Beyond this many terms the middle folds, so a long tenancy stays readable. */
const FOLD_ABOVE = 4

const STATE_LABEL: Record<ChainTerm['state'], string> = {
	current: 'Running now',
	next: 'Starts later',
	ended: 'Ended',
	cancelled: 'Cancelled',
}

function TermCard({
	term,
	here,
	href,
}: {
	term: ChainTerm
	here: boolean
	href: string
}) {
	const off = term.state === 'cancelled'
	const label =
		term.state === 'next'
			? `Starts ${formatDay(term.from)}`
			: STATE_LABEL[term.state]

	const card = (
		<div
			className={cn(
				'rounded-xl border px-4 py-3 transition-colors',
				here
					? 'border-primary bg-primary/5 ring-primary/20 ring-1'
					: 'bg-card hover:border-muted-foreground/30',
				(off || term.state === 'ended') && !here ? 'bg-muted/40' : '',
			)}
		>
			<div className="flex flex-wrap items-center gap-2">
				<span
					className={cn(
						'font-mono text-sm font-bold',
						off ? 'text-muted-foreground line-through' : '',
						here ? 'text-primary' : 'text-foreground',
					)}
				>
					{term.code}
				</span>
				{here && <Badge className="text-[11px]">You’re here</Badge>}
				<Badge
					variant="outline"
					className={cn(
						'text-[11px] font-semibold',
						// Crimson is reserved for "the term you are looking at".
						// A running term is green wherever it appears, so the two
						// states stay legible at once.
						term.state === 'current'
							? 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
							: term.state === 'next'
								? 'border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200'
								: 'text-muted-foreground',
					)}
				>
					{label}
				</Badge>
			</div>
			<p className="text-muted-foreground mt-1.5 text-sm">
				{off ? 'Would have run ' : ''}
				{formatDay(term.from)} – {formatDay(term.to)}
				{term.moved ? ` · moved to ${term.unitName}` : ''}
			</p>
		</div>
	)

	return here ? card : <Link to={href}>{card}</Link>
}

/**
 * The tenancy's terms, beneath the lease header on every tab.
 *
 * It answers three things and no more: how long they have been here, how many
 * terms that took, and which one you are looking at. One real term is not a
 * history, so a first-term tenancy shows nothing at all rather than a chain
 * of one.
 */
export function LeaseChain({
	chain,
	viewingId,
	hrefFor,
	tenantName,
}: {
	chain: ChainTerm[]
	viewingId: string
	hrefFor: (term: ChainTerm) => string
	tenantName: string
}) {
	const [open, setOpen] = useState(false)
	const live = livingTerms(chain)
	const firstLive = live[0]
	if (live.length < 2 || !firstLive) return null

	const folded = chain.length > FOLD_ABOVE && !open
	const first = chain[0]
	const last = chain[chain.length - 1]
	const viewing = chain.find((term) => term.id === viewingId)

	// The ends matter, and so does the term being viewed — folding it away
	// would hide the one thing the strip exists to point at.
	const keep = new Set(
		[first, last, viewing]
			.filter(Boolean)
			.map((term) => (term as ChainTerm).id),
	)
	const shown = folded ? chain.filter((term) => keep.has(term.id)) : chain
	const hiddenCount = chain.length - shown.length

	return (
		<section className="mb-6" aria-label="Lease history">
			<p className="text-foreground mb-3 text-sm">
				{tenantName} has rented here since{' '}
				<span className="font-semibold">{formatDay(firstLive.from)}</span> —{' '}
				{tenancyLength(chain)}, over{' '}
				<span className="font-semibold">
					{live.length} {live.length === 1 ? 'term' : 'terms'}
				</span>
				.
			</p>
			<div className="flex flex-wrap items-center gap-2">
				{shown.map((term, index) => (
					<div key={term.id} className="flex items-center gap-2">
						{index > 0 && (
							<>
								{folded && index === 1 && hiddenCount > 0 ? (
									<Button
										variant="outline"
										size="sm"
										className="border-dashed"
										onClick={() => setOpen(true)}
									>
										+ {hiddenCount} terms between
									</Button>
								) : (
									<ChevronRight className="text-muted-foreground/50 size-4 shrink-0" />
								)}
							</>
						)}
						<TermCard
							term={term}
							here={term.id === viewingId}
							href={hrefFor(term)}
						/>
					</div>
				))}
				{open && chain.length > FOLD_ABOVE && (
					<Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
						Fold back
					</Button>
				)}
			</div>
		</section>
	)
}
