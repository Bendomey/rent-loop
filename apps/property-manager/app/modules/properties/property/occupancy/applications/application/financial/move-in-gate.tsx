import { ArrowRight, CalendarClock } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

interface MoveInGateProps {
	propertyId: string
	applicationId: string
}

/**
 * Financial setup depends on move-in setup for a hard reason, not a tidy one.
 *
 * charges:prepare needs six fields — rent fee, currency, payment frequency,
 * move-in date, stay duration and duration frequency. Move-in setup supplies
 * three of them, so without it the server refuses with
 * ApplicationMissingMoveInDate or ApplicationMissingStayDuration.
 */
export function MoveInGate({ propertyId, applicationId }: MoveInGateProps) {
	return (
		<Card className="border-amber-200 bg-amber-50/60 shadow-none dark:border-amber-900/50 dark:bg-amber-950/20">
			<CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
				<div className="bg-amber-100 text-amber-700 flex size-11 shrink-0 items-center justify-center rounded-xl dark:bg-amber-900/40 dark:text-amber-300">
					<CalendarClock className="size-5" />
				</div>
				<div className="flex-1">
					<p className="text-base font-semibold">Finish move-in setup first</p>
					<p className="text-muted-foreground mt-1.5 max-w-xl text-sm leading-relaxed">
						The rent schedule is built from the move-in date and how long the
						tenant is staying. Neither is set yet, so there is nothing to charge
						against.
					</p>
				</div>
				<Button asChild className="shrink-0">
					<Link
						to={`/properties/${propertyId}/occupancy/applications/${applicationId}/move-in`}
					>
						Go to move-in setup
						<ArrowRight className="size-4" />
					</Link>
				</Button>
			</CardContent>
		</Card>
	)
}
