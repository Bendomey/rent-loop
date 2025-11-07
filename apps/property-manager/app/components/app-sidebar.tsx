import {
	GalleryVerticalEnd,
	Settings2,
	LifeBuoy,
	PieChart,
	House,
	BookOpenText,
} from 'lucide-react'
import * as React from 'react'

import { Link } from 'react-router'
import { NavSecondary } from './nav-secondary'
import { NavMain } from '~/components/nav-main'
import { NavProperties } from '~/components/nav-properties'
import { NavUser } from '~/components/nav-user'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
	useSidebar,
} from '~/components/ui/sidebar'
import { APP_NAME } from '~/lib/constants'

const data = {
	navMain: [
		{
			title: 'Insights',
			isHome: true,
			url: '/',
			icon: PieChart,
		},
		{
			title: 'My Properties',
			url: '/properties',
			icon: House,
		},
		{
			title: 'Settings',
			url: '/settings',
			icon: Settings2,
		},
	],
	navSecondary: [
		{
			title: 'Support',
			onClick: () => window?.Tawk_API?.toggle(),
			icon: LifeBuoy,
		},
		{
			title: 'Changelog',
			url: '/changelog',
			icon: BookOpenText,
		},
	],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const sidebarState = useSidebar()

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<Link to="/" className="-m-1.5 ml-1 p-1.5">
					{sidebarState.open ? (
						<>
							<div className="flex flex-row items-end">
								<span className="text-4xl font-extrabold text-rose-700">
									{APP_NAME.slice(0, 4)}
								</span>
								<span className="text-4xl font-extrabold">
									{APP_NAME.slice(4)}
								</span>
							</div>
							<span className="text-xs">Property Manager Portal</span>
						</>
					) : (
						<div>
							<GalleryVerticalEnd className="mt-1 -ml-1 size-6 text-rose-600" />
						</div>
					)}
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavProperties />
			</SidebarContent>
			<SidebarFooter>
				<NavSecondary items={data.navSecondary} className="mt-auto" />
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
