import { Link, Outlet, redirect } from 'react-router'
import pkgJson from '../../package.json'
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
import { userContext } from '~/lib/actions/auth.context.server'

export async function loader({ context }: Route.LoaderArgs) {
	const authData = context.get(userContext)
	if (!authData) return

	// only admins and owners can access the main dashboard.
	if (authData.clientUser.role === 'STAFF') {
		if (authData.clientUserProperties.rows.length) {
			const firstProperty = authData.clientUserProperties.rows[0]
			return redirect(
				`/auth/dashboard/property/${firstProperty?.property?.slug}`,
			)
		}

		return redirect('/properties/no-assigned')
	}
}

export default function AuthDashboard({ matches }: Route.ComponentProps) {
	const breadcrumbs = matches
		.filter((m) => m?.handle)
		.map((m) => {
			const breadcrumb = (m?.handle as { breadcrumb: string }).breadcrumb
			return { name: breadcrumb, pathname: m?.pathname, id: m?.id }
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
				<div className="h-full">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
