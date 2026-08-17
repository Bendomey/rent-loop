import {
	ArrowRight,
	Building2,
	Lock,
	Repeat,
	TriangleAlert,
} from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import type { Pronouns } from '~/lib/pronouns'
import { toFirstUpperCase } from '~/lib/strings'
import { cn } from '~/lib/utils'

/**
 * Once a unit is settled the page stops being a list and becomes the unit.
 *
 * Three variants: chosen, conflict (let to someone else while the application
 * was open), and locked (rent billed, or the agreement signed).
 */
export function ChosenUnit({
	unit,
	state,
	applicantName,
	pronouns,
	lockReason,
	unitHref,
	canChange,
	onChange,
}: {
	unit: PropertyUnit
	state: 'chosen' | 'conflict' | 'locked'
	applicantName: string
	pronouns: Pronouns
	/** Why the unit can no longer change. Only read when state is 'locked'. */
	lockReason: string
	unitHref: string
	/**
	 * False on a single-unit property, where there is nothing to change to.
	 * Separate from `locked`, which is about money having moved.
	 */
	canChange: boolean
	onChange: () => void
}) {
	const conflict = state === 'conflict'
	const locked = state === 'locked'

	return (
		<Card
			className={cn(
				'gap-0 overflow-hidden p-0 shadow-none',
				conflict ? 'border-warning/40' : '',
			)}
			data-unit-state={state}
		>
			{conflict ? (
				<div className="bg-warning-bg flex items-start gap-3 border-b p-5">
					<TriangleAlert className="text-warning mt-0.5 size-5 shrink-0" />
					<div>
						<p className="text-warning font-bold">
							Someone else moved into {unit.name}
						</p>
						<p className="mt-1 text-sm leading-relaxed">
							{applicantName} can&rsquo;t have this one. Pick another and the
							rest of the application carries over.
						</p>
					</div>
				</div>
			) : null}

			<div className="flex flex-col gap-6 p-6 sm:flex-row">
				<div className="bg-muted aspect-video w-full shrink-0 overflow-hidden rounded-xl sm:w-56">
					{unit.images?.[0] ? (
						<img
							src={unit.images[0]}
							alt={unit.name}
							className="size-full object-cover"
						/>
					) : (
						<div className="text-muted-foreground flex size-full items-center justify-center">
							<Building2 className="size-7" />
						</div>
					)}
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-3">
						<h2 className="text-2xl font-bold tracking-tight">{unit.name}</h2>
						<span className="text-muted-foreground">
							{toFirstUpperCase(unit.type.toLowerCase())}
						</span>
						{conflict ? (
							<Badge className="bg-warning-bg text-warning border-none">
								No longer free
							</Badge>
						) : (
							<Badge className="bg-success-bg text-success border-none">
								{locked ? 'Taken' : 'Chosen'}
							</Badge>
						)}
					</div>

					<p className="text-muted-foreground mt-2 text-sm">
						{unit.property?.name ?? ''}
					</p>

					<div className="mt-5 flex flex-wrap gap-8">
						<div>
							<p className="text-muted-foreground font-mono text-[10px] tracking-wide uppercase">
								Advertised rent
							</p>
							<p className="mt-1.5 font-bold">
								{formatAmount(
									convertPesewasToCedis(unit.rent_fee),
									unit.rent_fee_currency,
								)}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground font-mono text-[10px] tracking-wide uppercase">
								Billed
							</p>
							<p className="mt-1.5 font-bold">
								{toFirstUpperCase(unit.payment_frequency.toLowerCase())}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="bg-muted/50 flex flex-wrap items-center gap-4 border-t p-5">
				<p className="text-muted-foreground min-w-56 flex-1 text-sm leading-relaxed">
					{locked ? (
						lockReason
					) : conflict ? (
						<>
							Everything else you&rsquo;ve filled in stays. Only the move-in
							date and payment dates get cleared.
						</>
					) : (
						<>
							Picking this unit set {pronouns.possessive} rent to start at{' '}
							<b className="text-foreground">
								{formatAmount(
									convertPesewasToCedis(unit.rent_fee),
									unit.rent_fee_currency,
								)}
							</b>
							. You can change it on the Rent &amp; payments step.
						</>
					)}
				</p>

				<div className="flex shrink-0 flex-wrap gap-2">
					<Button variant="outline" asChild>
						<Link to={unitHref}>
							View unit
							<ArrowRight className="size-4" />
						</Link>
					</Button>
					{locked ? (
						<span className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
							<Lock className="size-4" />
							Can&rsquo;t be changed
						</span>
					) : canChange ? (
						<Button
							variant={conflict ? 'default' : 'outline'}
							onClick={onChange}
						>
							<Repeat className="size-4" />
							{conflict ? 'Pick another unit' : 'Pick a different unit'}
						</Button>
					) : null}
				</div>
			</div>
		</Card>
	)
}
