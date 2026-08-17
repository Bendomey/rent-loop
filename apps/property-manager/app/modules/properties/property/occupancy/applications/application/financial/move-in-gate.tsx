import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { type Pronouns, verb } from '~/lib/pronouns'

/**
 * The blocked state explains itself rather than showing a padlock.
 *
 * A locked section with no reason attached reads as a fault. Saying what is
 * missing and offering the way to it turns the same state into an instruction.
 */
export function MoveInGate({
	propertyId,
	applicationId,
	applicantName,
	pronouns,
}: {
	propertyId: string
	applicationId: string
	applicantName: string
	pronouns: Pronouns
}) {
	return (
		<Card className="shadow-none">
			<CardContent className="flex flex-col gap-5 py-4 sm:flex-row sm:items-start">
				<span className="bg-warning-bg flex size-12 shrink-0 items-center justify-center rounded-xl">
					<CalendarDays className="text-warning size-5" />
				</span>

				<div className="min-w-0 flex-1">
					<p className="text-xl font-bold tracking-tight">
						Set the move-in date first
					</p>
					<p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
						We can&rsquo;t work out the rent dates until we know when{' '}
						{applicantName} {verb(pronouns, 'move')} in and how long{' '}
						{pronouns.subject} {pronouns.plural ? 'are' : 'is'} staying. Agree
						that with {applicantName}, then come back — it takes a minute.
					</p>

					<Button className="mt-4" asChild>
						<Link
							to={`/properties/${propertyId}/occupancy/applications/${applicationId}/move-in`}
						>
							Set the move-in date
							<ArrowRight className="size-4" />
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
