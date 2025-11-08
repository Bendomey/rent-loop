import { Fragment } from 'react'
import { Outlet, redirect, useLoaderData } from 'react-router'
import pkgJson from '../../package.json'
import type { Route } from './+types/_auth.properties.$propertySlug._index'
import { getPropertyBySlug } from '~/api/properties'
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
import { userContext } from '~/lib/actions/auth.context.server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { NOT_FOUND_ROUTE } from '~/lib/constants'
import { getDomainUrl } from '~/lib/misc'
import { PropertySidebar } from '~/modules'
import { PropertyProvider } from '~/providers/property-provider'

export const handle = {
	breadcrumb: 'Property',
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	if (!authToken) {
		return redirect('/login')
	}

	// make sure they're allowed to access this property
	const authData = context.get(userContext)
	if (!authData) {
		return redirect('/login')
	}

	const hasAccess = Boolean(
		authData.clientUserProperties?.rows?.find(
			(prop) => prop?.property?.slug === params.propertySlug,
		),
	)
	if (!hasAccess) {
		return redirect('/')
	}

	try {
		const property = await getPropertyBySlug(params.propertySlug, {
			authToken,
			baseUrl,
		})

		if (!property) {
			throw new Error('Property not found')
		}

		context.set(propertyContext, property)
		return {
			origin: getDomainUrl(request),
			property,
		}
	} catch {
		return redirect(NOT_FOUND_ROUTE)
	}
}

export default function PropertyDashboard({ matches }: Route.ComponentProps) {
	const loaderData = useLoaderData<typeof loader>()

	const breadcrumbs = matches
		.filter((m) => m?.handle)
		.map((m) => {
			const breadcrumb = (m?.handle as { breadcrumb: string }).breadcrumb
			const name =
				breadcrumb === 'Property' ? loaderData?.property?.name : breadcrumb
			return { name, pathname: m?.pathname, id: m?.id }
		})

	return (
		<PropertyProvider data={loaderData?.property ?? null}>
			<SidebarProvider>
				<PropertySidebar />
				<SidebarInset>
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
											<Fragment key={breadcrumb.id}>
												<BreadcrumbItem className="hidden md:block">
													<BreadcrumbLink href={breadcrumb.pathname}>
														{breadcrumb.name ?? '...'}
													</BreadcrumbLink>
												</BreadcrumbItem>
												<BreadcrumbSeparator className="hidden md:block" />
											</Fragment>
										)
									})}
								</BreadcrumbList>
							</Breadcrumb>
							<div className="ml-auto flex items-center gap-2 text-sm">
								v{pkgJson.version}
							</div>
						</div>
					</header>
					<div className="h-full">
						<Outlet />
					</div>
				</SidebarInset>
			</SidebarProvider>
		</PropertyProvider>
	)
}
