import { ArrowRight, Check, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import type { LeadCopy } from './overview-copy'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import type { ApplicationSituation } from '~/lib/application-situation'
import { cn } from '~/lib/utils'

/**
 * "Do this next" — one named action, in plain words, with the reason behind it.
 *
 * Every write control is inside a MANAGER guard. Decline is refused once money
 * has arrived, which is the rule the checklist rail used to enforce.
 */
export function OverviewLeadCard({
	situation,
	lead,
	leadHref,
	unitHref,
	leaseHref,
	canApprove,
	declineDisabled,
	onApprove,
	onDecline,
}: {
	situation: ApplicationSituation
	lead: LeadCopy
	leadHref: string | null
	unitHref: string
	leaseHref: string | null
	canApprove: boolean
	declineDisabled: boolean
	onApprove: () => void
	onDecline: () => void
}) {
	const tone =
		situation === 'attention'
			? 'border-warning/40 bg-warning-bg'
			: situation === 'ready' || situation === 'approved'
				? 'border-success/40 bg-success-bg'
				: situation === 'cancelled'
					? 'bg-muted'
					: 'border-primary/25 bg-primary/5'

	const Glyph =
		situation === 'attention'
			? TriangleAlert
			: situation === 'approved' || situation === 'ready'
				? Check
				: ArrowRight

	const glyphTone =
		situation === 'attention'
			? 'text-warning'
			: situation === 'ready' || situation === 'approved'
				? 'text-success'
				: situation === 'cancelled'
					? 'text-muted-foreground'
					: 'text-primary'

	return (
		<div
			id="application-lead"
			className={cn(
				'flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-start',
				tone,
			)}
		>
			<div className="bg-background flex size-11 shrink-0 items-center justify-center rounded-xl">
				<Glyph className={cn('size-5', glyphTone)} />
			</div>

			<div className="min-w-0 flex-1">
				<p
					className={cn('text-xs font-bold tracking-wide uppercase', glyphTone)}
				>
					{lead.eyebrow}
				</p>
				<h2 className="mt-1.5 text-xl font-bold">{lead.title}</h2>
				<p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
					{lead.body}
				</p>
			</div>

			<div className="flex shrink-0 flex-wrap gap-2.5 sm:pt-1">
				{situation === 'ready' ? (
					<PropertyPermissionGuard roles={['MANAGER']}>
						<div className="flex flex-col gap-1.5">
							<div className="flex flex-wrap gap-2.5">
								<Button
									variant="outline"
									disabled={declineDisabled}
									onClick={onDecline}
								>
									Decline
								</Button>
								<Button disabled={!canApprove} onClick={onApprove}>
									<Check className="size-4" />
									Approve &amp; make the lease
								</Button>
							</div>
							{declineDisabled ? (
								<p className="text-muted-foreground text-xs">
									Can&apos;t decline once a payment has been made.
								</p>
							) : null}
						</div>
					</PropertyPermissionGuard>
				) : null}

				{situation === 'approved' && leaseHref ? (
					<Button asChild>
						<Link to={leaseHref}>
							Open the lease
							<ArrowRight className="size-4" />
						</Link>
					</Button>
				) : null}

				{situation === 'attention' ? (
					<Button asChild>
						<Link to={unitHref}>Pick another unit</Link>
					</Button>
				) : null}

				{(situation === 'fresh' || situation === 'midway') && leadHref ? (
					<Button asChild>
						<Link to={leadHref}>
							Carry on
							<ArrowRight className="size-4" />
						</Link>
					</Button>
				) : null}
			</div>
		</div>
	)
}
