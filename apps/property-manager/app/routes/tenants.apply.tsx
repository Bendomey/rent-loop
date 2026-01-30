import { AlertCircle, FileText, Globe, UserCircle, Users, Wrench } from 'lucide-react'
import { Link, Outlet, useLoaderData } from 'react-router'
import { TypographyH3, TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { environmentVariables } from '~/lib/actions/env.server'
import { getPropertyUnitForServer } from '~/api/units/server'
import { getDomainUrl } from '~/lib/misc'
import type { Route } from './+types/tenants.apply._index'
import { APP_NAME } from '~/lib/constants'



export async function loader({ request }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const url = new URL(request.url)
	const referredBy = url.searchParams.get('referred_by')
	const unitId = url.searchParams.get('unit')

	const unit = await getPropertyUnitForServer(
		{ unit_id: unitId as string },
		{
			baseUrl,
		},
	)

	return {
		origin: getDomainUrl(request),
		referredBy,
		unitId,
		unit,
		isValidUrl: !!(referredBy && unitId),
	}
}

export default function TenantApplicationView() {
	const {
		isValidUrl,
	} = useLoaderData<typeof loader>()

	if (!isValidUrl) {
		return (
			<main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
				<div className="w-full max-w-md">
					<div className="space-y-4 rounded-lg bg-white p-8 text-center shadow-lg">
						<div className="flex justify-center">
							<AlertCircle className="h-16 w-16 text-red-500" />
						</div>
						<h1 className="text-2xl font-bold text-slate-900">Invalid URL</h1>
						<p className="leading-relaxed text-slate-600">
							This tenant application link is missing required parameters.
							Please ensure you have a valid invitation link with the correct
							URL parameters.
						</p>
						<div className="pt-4">
							<Link
								to="/login"
								className="inline-block rounded-lg bg-rose-600 px-6 py-2 font-medium text-white transition-colors hover:bg-rose-700"
							>
								Back to Home
							</Link>
						</div>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="h-[calc(100vh+160px)] md:h-[calc(100vh-120px)]">	
			<div className="border-b p-4 md:px-0 md:py-6">
				<Link to="/login">
					<TypographyH3 className="text-center capitalize">
						Welcome to{' '}
						<span className="font-extrabold text-rose-700">
							{APP_NAME.slice(0, 4)}{' '}
						</span>
						<span className="font-extrabold">{APP_NAME.slice(4)}</span>
					</TypographyH3>
				</Link>
				<TypographyMuted className="text-center">
					Once you've completed all steps, we'll review your application and
					reach out with the next steps.
				</TypographyMuted>
			</div>
			<div className="w-full overflow-auto p-5">
					<Outlet />
				</div>
		</main>
	)
}
