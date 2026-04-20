import { useEffect } from 'react'
import { Link, Outlet, redirect } from 'react-router'
import pkgJson from '../../package.json'
import type { Route } from './+types/_auth._dashboard'
import { getAgreementsForServer } from '~/api/agreements'
import { getClientUserPropertiesForServer } from '~/api/client-user-properties/server'
import { getPaymentAccountsForServer } from '~/api/payment-accounts'
import { getPropertiesForServer } from '~/api/properties'
import { AppSidebar } from '~/components/app-sidebar'
import { ClientChecklist } from '~/components/client-checklist'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { Separator } from '~/components/ui/separator'
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '~/components/ui/sidebar'
import { useOnboardingTour } from '~/hooks/use-onboarding-tour'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { clientContext } from '~/lib/actions/client.context.server'
import { environmentVariables } from '~/lib/actions/env.server'

export async function loader({ request, context }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	if (!authToken) {
		return redirect('/login')
	}

	const clientData = context.get(clientContext)
	if (!clientData) return

	const clientId = clientData.clientUser.client_id

	const apiConfig = {
		authToken,
		baseUrl,
	}

	// only admins and owners can access the main dashboard.
	if (clientData.clientUser.role === 'STAFF') {
		const clientUserProperties = await getClientUserPropertiesForServer(
			clientId,
			{
				filters: { client_user_id: clientData.clientUser.id },
				pagination: { page: 1, per: 1 },
				populate: ['Property'],
				search: {},
				sorter: {},
			},
			apiConfig,
		)

		const clientUserProperty = clientUserProperties?.rows?.at(0)

		if (clientUserProperty) {
			return redirect(`/properties/${clientUserProperty?.property?.id}`)
		}

		return redirect('/properties/no-assigned')
	}

	const isOwner = clientData.clientUser.role === 'OWNER'

	const [properties, paymentAccounts, agreements] = await Promise.all([
		getPropertiesForServer(
			clientId,
			{
				pagination: { page: 1, per: 1 },
			},
			apiConfig,
		),
		getPaymentAccountsForServer(
			clientId,
			{
				filters: {
					owner_types: ['PROPERTY_OWNER', 'SYSTEM'],
				},
				pagination: { page: 1, per: 1 },
			},
			apiConfig,
		),
		isOwner
			? getAgreementsForServer(clientId, apiConfig)
			: Promise.resolve(null),
	])

	const hasAcceptedAllAgreements = isOwner
		? (agreements?.every((a) => a.user_has_accepted) ?? true)
		: true

	const client = clientData.clientUser.client
	const isIndividual = client?.type === 'INDIVIDUAL'
	const isIdentityComplete =
		!isIndividual || Boolean(client?.id_type && client?.id_number)

	return {
		hasAcceptedAllAgreements,
		propertiesCount: properties?.meta?.total || 0,
		paymentAccountsCount: paymentAccounts?.meta?.total || 0,
		isIndividual,
		isIdentityComplete,
	}
}

export default function AuthDashboard({
	matches,
	loaderData,
}: Route.ComponentProps) {
	const { startTour, hasCompletedTour } = useOnboardingTour()

	useEffect(() => {
		if (!hasCompletedTour()) startTour()
	}, [hasCompletedTour, startTour])

	const breadcrumbs = matches
		.filter((m) => m?.handle)
		.map((m) => {
			const breadcrumb = (
				m?.handle as { breadcrumb: (data: unknown) => string | string }
			).breadcrumb
			const name =
				typeof breadcrumb === 'string' ? breadcrumb : breadcrumb(m?.loaderData)
			return { name, pathname: m?.pathname, id: m?.id }
		})

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<ClientChecklist
					paymentAccountsCount={loaderData?.paymentAccountsCount ?? 0}
					propertiesCount={loaderData?.propertiesCount ?? 0}
					hasAcceptedAllAgreements={
						loaderData?.hasAcceptedAllAgreements ?? true
					}
					isIndividual={loaderData?.isIndividual ?? false}
					isIdentityComplete={loaderData?.isIdentityComplete ?? true}
				/>
				<header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
					<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
						<SidebarTrigger className="-ml-1" />
						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/>
						<Breadcrumb>
							<BreadcrumbList>
								{breadcrumbs.map((breadcrumb, index) => {
									if (index === breadcrumbs.length - 1) {
										return (
											<BreadcrumbItem
												key={breadcrumb.id}
												className="hidden md:block"
											>
												<BreadcrumbPage>
													{breadcrumb.name ?? '...'}
												</BreadcrumbPage>
											</BreadcrumbItem>
										)
									}

									return (
										<>
											<BreadcrumbItem
												key={breadcrumb.id}
												className="hidden md:block"
											>
												<BreadcrumbLink href={breadcrumb.pathname}>
													{breadcrumb.name ?? '...'}
												</BreadcrumbLink>
											</BreadcrumbItem>
											<BreadcrumbSeparator className="hidden md:block" />
										</>
									)
								})}
							</BreadcrumbList>
						</Breadcrumb>
						<div className="ml-auto flex items-center gap-2 text-sm">
							<Link to="/changelog">v{pkgJson.version}</Link>
						</div>
					</div>
				</header>
				<div className="h-full w-full">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
