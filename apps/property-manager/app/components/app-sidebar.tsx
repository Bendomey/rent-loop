import {
	AudioWaveform,
	Command,
	Frame,
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

// This is sample data.
const data = {
	teams: [
		{
			name: 'Acme Inc',
			logo: GalleryVerticalEnd,
			plan: 'Enterprise',
		},
		{
			name: 'Acme Corp.',
			logo: AudioWaveform,
			plan: 'Startup',
		},
		{
			name: 'Evil Corp.',
			logo: Command,
			plan: 'Free',
		},
	],
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
	properties: [
		{
			name: 'Mikasa',
			url: `/properties/mikasa`,
			icon: Frame,
		},
		{
			name: 'Domey Villas',
			url: `/properties/domey-villas`,
			icon: Frame,
		},
		{
			name: 'Adjirganor Houses',
			url: '/properties/adjirganor-houses',
			icon: Frame,
		},
	],
	navSecondary: [
		{
			title: 'Support',
			url: '/support',
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
				<NavProperties projects={data.properties} />
			</SidebarContent>
			<SidebarFooter>
				<NavSecondary items={data.navSecondary} className="mt-auto" />
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
