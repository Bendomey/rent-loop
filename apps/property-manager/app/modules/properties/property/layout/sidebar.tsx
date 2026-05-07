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
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
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

	const modes = clientUserProperty?.property?.modes ?? []
	const isLease = modes.includes('LEASE')
	const isBooking = modes.includes('BOOKING')

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
				title: 'Occupancy',
				url: '/occupancy',
				icon: Contact,
				items: [
					{
						title:
							isLease && isBooking
								? 'All Tenants/Guests'
								: isLease
									? 'All Tenants'
									: 'All Guests',
						url: '/tenants',
					},
					{
						title: 'Rental Applications',
						url: '/applications',
						isHidden: !isLease,
					},
					{
						title: 'Rental Agreements',
						url: '/leases',
						isHidden: !isLease,
					},
					{
						title: 'Guest Bookings',
						url: '/bookings',
						isHidden: !isBooking,
					},
					{
						title: 'Units Availability',
						url: '/availability',
						isHidden: !isBooking,
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
						title: 'Invoice Payments',
						url: '/invoices',
					},
					{
						title: 'Expenses',
						url: '/expenses',
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
		<Sidebar collapsible="icon" className="hidden flex-1 md:flex" {...props}>
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

	// return (
	// 	<Sidebar
	// 		collapsible="icon"
	// 		className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
	// 	>
	// 		<Sidebar
	// 			collapsible="none"
	// 			className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
	// 		>
	// 			<SidebarContent>
	// 				<SidebarGroup>
	// 					<SidebarGroupContent className="px-1.5 md:px-0">
	// 						<SidebarMenu>
	// 							{data.navMain.map((item) => (
	// 								<SidebarMenuItem key={item.title}>
	// 									<SidebarMenuButton
	// 										tooltip={{
	// 											children: item.title,
	// 											hidden: false,
	// 										}}
	// 										onClick={() => {
	// 											// setActiveItem(item)
	// 											// const mail = data.mails.sort(() => Math.random() - 0.5)
	// 											// setMails(
	// 											// 	mail.slice(
	// 											// 		0,
	// 											// 		Math.max(5, Math.floor(Math.random() * 10) + 1)
	// 											// 	)
	// 											// )
	// 											// setOpen(true)
	// 										}}
	// 										// isActive={activeItem?.title === item.title}
	// 										className="px-2.5 md:px-2"
	// 									>
	// 										<item.icon />
	// 										<span>{item.title}</span>
	// 									</SidebarMenuButton>
	// 								</SidebarMenuItem>
	// 							))}
	// 						</SidebarMenu>
	// 					</SidebarGroupContent>
	// 				</SidebarGroup>
	// 			</SidebarContent>
	// 		</Sidebar>
	// 		<Sidebar collapsible="icon" className="hidden flex-1 md:flex" {...props}>
	// 			<SidebarHeader>
	// 				<Link to="/" className="-m-1.5 ml-1 p-1.5">
	// 					{sidebarState.open ? (
	// 						<>
	// 							<div className="flex flex-row items-end">
	// 								<span className="text-4xl font-extrabold text-rose-700">
	// 									{APP_NAME.slice(0, 4)}
	// 								</span>
	// 								<span className="text-4xl font-extrabold">
	// 									{APP_NAME.slice(4)}
	// 								</span>
	// 							</div>
	// 							<span className="text-xs">Property Manager Portal</span>
	// 						</>
	// 					) : null}
	// 				</Link>
	// 				<PropertySwitcher />
	// 			</SidebarHeader>
	// 			<SidebarContent>
	// 				<NavMain
	// 					title="Property Navigation"
	// 					items={data.navMain}
	// 					baseRoute={`/properties/${params?.propertyId}`}
	// 				/>
	// 			</SidebarContent>
	// 			<SidebarFooter>
	// 				<NavSecondary
	// 					items={data.navSecondary}
	// 					onProperty
	// 					className="mt-auto"
	// 				/>
	// 				<NavUser />
	// 			</SidebarFooter>
	// 			<SidebarRail />
	// 		</Sidebar>
	// 	</Sidebar>
	// )
}
