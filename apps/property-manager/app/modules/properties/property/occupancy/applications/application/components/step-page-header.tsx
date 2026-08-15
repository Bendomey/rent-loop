import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

export type StepPill = 'step' | 'done' | 'attention' | 'fixed'

/**
 * The header each redesigned step page carries for itself.
 *
 * The steps used to share one header and a checklist rail supplied by a parent
 * layout. The designs give every step its own instead: what this page is, how
 * far through it sits, and the two moves out of it — back to the hub, or on to
 * the next step. The hub is where the five steps are held together, so
 * repeating the rail here would say it twice.
 */
export function StepPageHeader({
	title,
	subtitle,
	pill,
	pillTone,
	backHref,
	nextHref,
	nextLabel,
}: {
	title: string
	subtitle: string
	pill: string
	pillTone: StepPill
	backHref: string
	nextHref?: string
	nextLabel?: string
}) {
	return (
		<div
			id="step-header"
			className="mb-6 flex flex-wrap items-start justify-between gap-4"
		>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
					<Badge
						variant="secondary"
						className={cn(
							pillTone === 'done' || pillTone === 'fixed'
								? 'bg-success-bg text-success'
								: '',
							pillTone === 'attention' ? 'bg-warning-bg text-warning' : '',
						)}
					>
						{pill}
					</Badge>
				</div>
				<p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
			</div>

			<div className="flex shrink-0 flex-wrap gap-2">
				<Button variant="outline" asChild>
					<Link to={backHref}>
						<ArrowLeft className="size-4" />
						Back to the application
					</Link>
				</Button>
				{nextHref && nextLabel ? (
					<Button asChild>
						<Link to={nextHref}>
							{nextLabel}
							<ArrowRight className="size-4" />
						</Link>
					</Button>
				) : null}
			</div>
		</div>
	)
}
