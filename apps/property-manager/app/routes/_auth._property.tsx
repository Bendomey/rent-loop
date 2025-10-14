import { Outlet } from 'react-router'
import pkgJson from '../../package.json'
import type { Route } from './+types/_auth._property'
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
import { PropertySidebar } from '~/modules'

export const handle = {
	breadcrumb: 'Property',
}

export default function PropertyDashboard({ matches }: Route.ComponentProps) {
	const breadcrumbs = matches
		.filter((m) => m?.handle)
		.map((m) => {
			const breadcrumb = (m?.handle as { breadcrumb: string }).breadcrumb
			return { name: breadcrumb, pathname: m?.pathname, id: m?.id }
		})

	return (
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
							v{pkgJson.version}
						</div>
					</div>
				</header>
				<div className="px-7 pt-5">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
