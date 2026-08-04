import { InsightsOverviewModule } from '../overview'
import { InsightsFilterBar } from './filter-bar'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { useAuth } from '~/providers/auth-provider'

export function InsightsLayoutModule() {
	const { currentUser } = useAuth()
	return (
		<main className="px-2 py-5 md:px-7">
			<div className="flex flex-col gap-4 px-4 lg:px-6">
				<div>
					<TypographyH2>Welcome back, {currentUser?.name}</TypographyH2>
					<TypographyMuted>
						Here's how your portfolio is performing.
					</TypographyMuted>
				</div>
				<InsightsFilterBar />
			</div>
			<div className="px-4 py-4 md:py-6 lg:px-6">
				<InsightsOverviewModule />
			</div>
		</main>
	)
}
