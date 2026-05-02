import {
	FileText,
	Globe,
	UserCircle,
	Users,
	Wallet,
	Wrench,
} from 'lucide-react'
import { Outlet } from 'react-router'
import type { Route } from './+types/_auth._dashboard.settings'
import { NavMain } from '~/components/nav-main'
import { Separator } from '~/components/ui/separator'
import { TypographyH4 } from '~/components/ui/typography'

export const handle = {
	breadcrumb: 'Settings',
}

export default function SettingsDashboard({}: Route.ComponentProps) {
	const generalMenus = [
		{
			title: 'General',
			url: '/general',
			icon: Wrench,
		},
		{
			title: 'My Account',
			url: '/my-account',
			icon: UserCircle,
		},
		{
			title: 'Agreements',
			url: '/agreements',
			icon: FileText,
		},
	]

	const workspaceMenus = [
		{
			title: 'Members',
			url: '/members',
			icon: Users,
		},
		{
			title: 'Payment Accounts',
			url: '/payment-accounts',
			icon: Wallet,
		},
		{
			title: 'Billing',
			url: '/billing',
			icon: Globe,
		},
		{
			title: 'Documents',
			url: '/documents',
			icon: FileText,
		},
	]

	return (
		<main className="min-h-[calc(100vh-64px)]">
			<div className="border-b px-5 py-3">
				<TypographyH4>Settings</TypographyH4>
			</div>
			<div className="flex flex-col md:flex-row md:h-[calc(100vh-120px)]">
				<div className="w-full shrink-0 overflow-auto border-b md:w-56 md:border-r md:border-b-0">
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
