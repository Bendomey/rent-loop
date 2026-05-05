import {
	FileText,
	Globe,
	UserCircle,
	Users,
	Wallet,
	Wrench,
	type LucideIcon,
} from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router'
import type { Route } from './+types/_auth._dashboard.settings'
import { NavMain } from '~/components/nav-main'
import { Separator } from '~/components/ui/separator'
import { TypographyH4 } from '~/components/ui/typography'
import { cn } from '~/lib/utils'

export const handle = {
	breadcrumb: 'Settings',
}

const generalMenus: { title: string; url: string; icon: LucideIcon }[] = [
	{ title: 'General', url: '/general', icon: Wrench },
	{ title: 'My Account', url: '/my-account', icon: UserCircle },
	{ title: 'Agreements', url: '/agreements', icon: FileText },
]

const workspaceMenus: { title: string; url: string; icon: LucideIcon }[] = [
	{ title: 'Members', url: '/members', icon: Users },
	{ title: 'Payment Accounts', url: '/payment-accounts', icon: Wallet },
	{ title: 'Billing', url: '/billing', icon: Globe },
	{ title: 'Documents', url: '/documents', icon: FileText },
]

const allMenus = [...generalMenus, ...workspaceMenus]

export default function SettingsDashboard({}: Route.ComponentProps) {
	const { pathname } = useLocation()

	return (
		<main className="min-h-[calc(100vh-64px)]">
			<div className="border-b px-5 py-3">
				<TypographyH4>Settings</TypographyH4>
			</div>

			{/* Mobile: horizontal scrollable tab bar */}
			<div className="flex overflow-x-auto border-b md:hidden">
				{allMenus.map((item) => {
					const url = `/settings${item.url}`
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
						baseRoute="/settings"
						title="General Settings"
						titleClassName="text-zinc-500"
					/>
					<Separator className="my-2" />
					<NavMain
						items={workspaceMenus}
						baseRoute="/settings"
						title="Workspace Settings"
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
