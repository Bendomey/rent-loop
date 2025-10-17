import { FileText, Globe, UserCircle, Users, Wrench } from 'lucide-react'
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
	]

	const workspaceMenus = [
		{
			title: 'Members',
			url: '/members',
			icon: Users,
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
		<main className="h-full">
			<div className="border-b px-5 py-3">
				<TypographyH4>Settings</TypographyH4>
			</div>
			<div className="flex h-full">
				<div className="h-full w-4/12 border-r">
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
				<div className="w-full p-5">
					<Outlet />
				</div>
			</div>
		</main>
	)
}
