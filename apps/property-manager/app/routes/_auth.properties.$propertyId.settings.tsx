import {
	FileText,
	UserCircle,
	Users,
	Wrench,
	type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId.settings'
import { NavMain } from '~/components/nav-main'
import { useHasPropertyPermissions } from '~/components/permissions/use-has-role'
import { Separator } from '~/components/ui/separator'
import { TypographyH4 } from '~/components/ui/typography'
import { cn } from '~/lib/utils'

export const handle = {
	breadcrumb: 'Settings',
}

export default function SettingsDashboard({ params }: Route.ComponentProps) {
	const { hasPermissions } = useHasPropertyPermissions({ roles: ['MANAGER'] })
	const { pathname } = useLocation()
	const baseRoute = `/properties/${params.propertyId}/settings`

	const generalMenus = useMemo(() => {
		const menus: { title: string; url: string; icon: LucideIcon }[] = []
		if (hasPermissions === 'AUTHORIZED') {
			menus.push({ title: 'General', url: '/general', icon: Wrench })
		} else {
			menus.push({ title: 'My Account', url: '/my-account', icon: UserCircle })
		}
		return menus
	}, [hasPermissions])

	const workspaceMenus = useMemo(() => {
		const menus: { title: string; url: string; icon: LucideIcon }[] = []
		if (hasPermissions === 'AUTHORIZED') {
			menus.push(
				{ title: 'Members', url: '/members', icon: Users },
				// { title: 'Billing', url: '/billing', icon: Globe },
			)
		}
		menus.push({ title: 'Documents', url: '/documents', icon: FileText })
		return menus
	}, [hasPermissions])

	const allMenus = [...generalMenus, ...workspaceMenus]

	return (
		<main className="min-h-[calc(100vh-64px)]">
			<div className="border-b px-5 py-3">
				<TypographyH4>Settings</TypographyH4>
			</div>

			{/* Mobile: horizontal scrollable tab bar */}
			<div className="flex overflow-x-auto border-b md:hidden">
				{allMenus.map((item) => {
					const url = `${baseRoute}${item.url}`
					const isActive = pathname === url || pathname.startsWith(url + '/')
					return (
						<Link
							key={item.url}
							to={url}
							className={cn(
								'flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm whitespace-nowrap transition-colors',
								isActive
									? 'border-rose-600 font-medium text-rose-600'
									: 'text-muted-foreground hover:text-foreground border-transparent',
							)}
						>
							<item.icon className="size-4" />
							{item.title}
						</Link>
					)
				})}
			</div>

			{/* Desktop: sidebar + content */}
			<div className="flex md:h-[calc(100vh-120px)]">
				<div className="hidden w-56 shrink-0 overflow-auto border-r md:block">
					<NavMain
						items={generalMenus}
						baseRoute={baseRoute}
						title="General Settings"
						titleClassName="text-zinc-500"
					/>
					<Separator className="my-2" />
					<NavMain
						items={workspaceMenus}
						baseRoute={baseRoute}
						title="Property Settings"
						titleClassName="text-zinc-500"
					/>
				</div>
				<div className="w-full overflow-auto p-5">
					<Outlet />
				</div>
			</div>
		</main>
	)
}
