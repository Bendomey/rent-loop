import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { useAuth } from '~/providers/auth-provider'

export function DashboardModule() {
	const { currentUser } = useAuth()
	return (
		<main className="px-2 py-5 md:px-7">
			<div className="@container/main flex flex-1 flex-col gap-2">
				<div className="flex flex-col justify-between gap-4 px-4 md:flex-row md:items-center lg:px-6">
					<div>
						<TypographyH2>Welcome back, {currentUser?.name}</TypographyH2>
						<TypographyMuted>
							Here is an overview of your dashboard metrics.
						</TypographyMuted>
					</div>
				</div>
				
			</div>
		</main>
	)
}
