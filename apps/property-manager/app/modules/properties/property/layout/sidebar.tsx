import {
	Settings2,
	LifeBuoy,
	PieChart,
	House,
	BookOpenText,
	DollarSign,
	Contact,
	Headset,
} from 'lucide-react'
import * as React from 'react'

import { Link, useParams } from 'react-router'
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
import { useProperty } from '~/providers/property-provider'

export function PropertySidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const sidebarState = useSidebar()
	const params = useParams()
	const { clientUserProperty } = useProperty()

	const data = {
		navMain: [
			{
				title: 'Overview',
				isHome: true,
				url: '',
				icon: PieChart,
			},
			{
				title: 'Assets',
				url: '/assets',
				icon: House,
				items: [
					{
						title: 'Blocks',
						url: '/blocks',
						isHidden: clientUserProperty?.property?.type === 'SINGLE',
					},
					{
						title:
							clientUserProperty?.property?.type === 'SINGLE'
								? 'Unit'
								: 'Apartments/Units',
						url: '/units',
					},
					{
						title: 'Facilities',
						url: '/facilities',
						isComingSoon: true,
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
						url: '/all',
					},
					{
						title: 'Applications',
						url: '/applications',
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
						url: '/maintenance-requests',
					},
					{
						title: 'Announcements',
						url: '/announcements',
						isComingSoon: true,
					},
					{
						title: 'Inspections',
						url: '/inspections',
						isComingSoon: true,
					},
					{
						title: 'Polls',
						url: '/polls',
						isComingSoon: true,
					},
				],
			},
			{
				title: 'Financials',
				url: '/financials',
				icon: DollarSign,
				items: [
					{
						title: 'Payments',
						url: '/payments',
					},
					{
						title: 'Expenses',
						url: '/expenses',
						isComingSoon: true,
					},
					{
						title: 'Reports',
						url: '/reports',
						isComingSoon: true,
					},
				],
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
				<PropertySwitcher />
			</SidebarHeader>
			<SidebarContent>
				<NavMain
					title="Property Navigation"
					items={data.navMain}
					baseRoute={`/properties/${params?.propertyId}`}
				/>
			</SidebarContent>
			<SidebarFooter>
				<NavSecondary
					items={data.navSecondary}
					onProperty
					className="mt-auto"
				/>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
