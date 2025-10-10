import {
	Frame,
	Settings2,
	LifeBuoy,
	Users,
	PieChart,
	House,
	BookOpenText,
	DollarSign,
	Contact,
	Headset,
} from 'lucide-react'
import * as React from 'react'

import { Link } from 'react-router'
import { NavMain } from '~/components/nav-main'
import { NavSecondary } from '~/components/nav-secondary'
import { NavUser } from '~/components/nav-user'
import { PropertySwitcher } from '~/components/property-switcher'
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
	user: {
		name: 'shadcn',
		email: 'm@example.com',
		avatar: '/avatars/shadcn.jpg',
	},
	properties: [
		{
			name: 'Mikasa',
			logo: Frame,
			plan: 'mikasa-ent',
		},
		{
			name: "Domey's Villas",
			logo: Frame,
			plan: 'domey-villas',
		},
	],
	navMain: [
		{
			title: 'Insights',
			url: '/',
			icon: PieChart,
		},
		{
			title: 'Assets',
			url: '/assets',
			icon: House,
			isActive: true,
			items: [
				{
					title: 'Apartments/Units',
					url: '/assets/units',
				},
				{
					title: 'Facilities',
					url: '/assets/facilities',
				},
			],
		},
		{
			title: 'Tenants',
			url: '/tenants',
			icon: Contact,
			items: [
				{
					title: 'All Tenants',
					url: '/tenants',
				},
				{
					title: 'Applications',
					url: '/tenants/applications',
				},
			],
		},
		{
			title: 'Activities',
			url: '/activities',
			icon: Headset,
			items: [
				{
					title: 'Maintenance Requests',
					url: '/activities/rent-payments',
				},
				{
					title: 'Announcements',
					url: '/activities/expenses',
				},
				{
					title: 'Inspections',
					url: '/activities/reports',
				},
				{
					title: 'Polls',
					url: '/activities/reports',
				},
			],
		},
		{
			title: 'Transactions',
			url: '/transactions',
			icon: DollarSign,
			items: [
				{
					title: 'Rent Payments',
					url: '/transactions/rent-payments',
				},
				{
					title: 'Expenses',
					url: '/transactions/expenses',
				},
				{
					title: 'Reports',
					url: '/transactions/reports',
				},
			],
		},
		{
			title: 'Managers',
			url: '/managers',
			icon: Users,
		},
		{
			title: 'Settings',
			url: '/settings',
			icon: Settings2,
			items: [
				{
					title: 'General',
					url: '/settings/general',
				},
				{
					title: 'Documents',
					url: '/settings/documents',
				},
				{
					title: 'Billing',
					url: '/settings/billing',
				},
			],
		},
	],
	// overview: [],
	// assets: [],
	// activities: [],
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

export function PropertySidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
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
					) : null}
				</Link>
				<PropertySwitcher properties={data.properties} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain title="Main Navigation" items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavSecondary
					items={data.navSecondary}
					onProperty
					className="mt-auto"
				/>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
