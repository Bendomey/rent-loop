import {
	Settings,
	LifeBuoy,
	Megaphone,
	House,
	FileText,
	LayoutGrid,
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
			title: 'Overview',
			isHome: true,
			url: '/',
			icon: LayoutGrid,
			id: 'tour-nav-overview',
		},
		// {
		// 	title: 'Insights',
		// 	url: '/insights',
		// 	icon: PieChart,
		// 	id: 'tour-nav-insights',
		// 	items: [
		// 		{ title: 'Overview', url: '' },
		// 		{ title: 'Revenue', url: '/revenue', isComingSoon: true },
		// 		{ title: 'Occupancy', url: '/occupancy', isComingSoon: true },
		// 		{
		// 			title: 'Rent Collection',
		// 			url: '/rent-collection',
		// 			isComingSoon: true,
		// 		},
		// 		{ title: 'Leases', url: '/leases', isComingSoon: true },
		// 		{ title: 'Tenants', url: '/tenants', isComingSoon: true },
		// 		{ title: 'Maintenance', url: '/maintenance', isComingSoon: true },
		// 		{ title: 'Expenses', url: '/expenses', isComingSoon: true },
		// 	],
		// },
		{
			title: 'My Properties',
			url: '/properties',
			icon: House,
		},
		{
			title: 'Activities',
			url: '/activities',
			icon: Megaphone,
			items: [
				{
					title: 'Announcements',
					url: '/announcements',
				},
			],
		},
		{
			title: 'Settings',
			url: '/settings',
			icon: Settings,
			id: 'tour-nav-settings',
		},
	],
	navSecondary: [
		{
			title: 'Support',
			onClick: () => {
				window?.Tawk_API?.showWidget()
				window?.Tawk_API?.maximize()
			},
			icon: LifeBuoy,
		},
		{
			title: 'Changelog',
			url: '/changelog',
			icon: FileText,
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
							<div className="text-primary text-[27px] leading-none font-extrabold tracking-[-1px]">
								{APP_NAME}
							</div>
							<span className="text-foreground-soft mt-1 block text-[13px]">
								Property Manager Portal
							</span>
						</>
					) : (
						/* collapsed: the brand mark — a crimson tile carrying the
						   house glyph, mirroring the app icon */
						<div className="bg-primary flex size-8 items-center justify-center rounded-lg">
							<House className="size-[18px] text-white" />
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
