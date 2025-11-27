import { Fragment } from 'react'
import { Outlet, useLoaderData } from 'react-router'
import pkgJson from '../../package.json'
import type { Route } from './+types/_auth.properties.$propertyId'
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
import { propertyContext } from '~/lib/actions/property.context.server'
import { propertyMiddleware } from '~/lib/actions/property.middleware.server'
import { getDomainUrl } from '~/lib/misc'
import { PropertySidebar } from '~/modules'
import { PropertyProvider } from '~/providers/property-provider'

export const middleware = [propertyMiddleware]

export const handle = {
	breadcrumb: 'Property',
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)

	return {
		origin: getDomainUrl(request),
		clientUserProperty,
	}
}

export default function PropertyDashboard({ matches }: Route.ComponentProps) {
	const loaderData = useLoaderData<typeof loader>()

	const breadcrumbs = matches
		.filter((m) => m?.handle)
		.map((m) => {
			const breadcrumb = (m?.handle as { breadcrumb: string }).breadcrumb
			const name =
				breadcrumb === 'Property' ? loaderData?.clientUserProperty?.property?.name : breadcrumb
			return { name, pathname: m?.pathname, id: m?.id }
		})

	return (
		<PropertyProvider data={loaderData?.clientUserProperty ?? null}>
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
