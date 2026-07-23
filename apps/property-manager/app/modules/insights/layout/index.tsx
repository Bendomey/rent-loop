import { Outlet } from 'react-router'
import { InsightsFilterBar } from './filter-bar'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

export function InsightsLayoutModule() {
	return (
		<main className="px-2 py-5 md:px-7">
			<div className="flex flex-col gap-4 px-4 lg:px-6">
				<div>
					<TypographyH2>Insights</TypographyH2>
					<TypographyMuted>
						Understand how your portfolio is performing.
					</TypographyMuted>
				</div>
				<InsightsFilterBar />
			</div>
			<div className="px-4 py-4 md:py-6 lg:px-6">
				<Outlet />
			</div>
		</main>
	)
}
