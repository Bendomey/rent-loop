import { LogOut } from 'lucide-react'
import { useFetcher } from 'react-router'
import { Button } from '~/components/ui/button'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { useAuth } from '~/providers/auth-provider'

export function DashboardModule() {
	const { currentUser } = useAuth()
	const fetcher = useFetcher()

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
					<fetcher.Form method="post" action="/logout">
						<Button
							type="submit"
							variant="destructive"
							size="sm"
							disabled={fetcher.state !== 'idle'}
						>
							<LogOut className="size-4" />
							Logout
						</Button>
					</fetcher.Form>
				</div>
			</div>
		</main>
	)
}
