import { FileText, Globe, Users, Wrench } from 'lucide-react'
import { Outlet } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId.settings'
import { NavMain } from '~/components/nav-main'
import { Separator } from '~/components/ui/separator'
import { TypographyH4 } from '~/components/ui/typography'

export const handle = {
	breadcrumb: 'Settings',
}

export default function SettingsDashboard({ params }: Route.ComponentProps) {
	const generalMenus = [
		{
			title: 'General',
			url: '/general',
			icon: Wrench,
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
		<main className="h-[calc(100vh+160px)] md:h-[calc(100vh-120px)]">
			<div className="border-b px-5 py-3">
				<TypographyH4>Settings</TypographyH4>
			</div>
			<div className="flex h-full">
				<div className="h-full w-4/12 overflow-auto border-r">
					<NavMain
						items={generalMenus}
						baseRoute={`/properties/${params.propertyId}/settings`}
						title="General Settings"
						titleClassName="text-zinc-500"
					/>
					<Separator className="my-2" />
					<NavMain
						items={workspaceMenus}
						baseRoute={`/properties/${params.propertyId}/settings`}
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
