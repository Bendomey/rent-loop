import * as React from 'react'
import { Outlet } from 'react-router'
import type { Route } from './+types/_auth._dashboard'
import { AppSidebar } from '~/components/app-sidebar'
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

export default function AuthDashboard({ matches }: Route.ComponentProps) {
	const breadcrumbs = matches.flatMap((m) => {
		if (!m?.handle) return []
		const breadcrumb = (
			m.handle as { breadcrumb: ((data: unknown) => string) | string }
		).breadcrumb
		const name =
			typeof breadcrumb === 'string' ? breadcrumb : breadcrumb(m?.loaderData)
		return [{ name, pathname: m?.pathname, id: m?.id }]
	})

	return (
		<SidebarProvider>
			<AppSidebar />
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
										<React.Fragment key={breadcrumb.id}>
											<BreadcrumbItem className="hidden md:block">
												<BreadcrumbLink href={breadcrumb.pathname}>
													{breadcrumb.name ?? '...'}
												</BreadcrumbLink>
											</BreadcrumbItem>
											<BreadcrumbSeparator className="hidden md:block" />
										</React.Fragment>
									)
								})}
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</header>
				<div className="h-full w-full">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
