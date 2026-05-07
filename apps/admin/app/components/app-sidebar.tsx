import {
	Activity,
	ClipboardCheck,
	GalleryVerticalEnd,
	LayoutDashboard,
	Settings2,
	Shield,
	Users,
} from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router'
import { NavMain } from '~/components/nav-main'
import { NavSecondary } from '~/components/nav-secondary'
import { NavUser } from '~/components/nav-user'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
	useSidebar,
} from '~/components/ui/sidebar'

const navMain = [
	{ title: 'Insights', url: '/', icon: LayoutDashboard, isHome: true },
	{ title: 'Property Managers', url: '/property-managers', icon: Users },
	{ title: 'Approvals', url: '/approvals', icon: ClipboardCheck },
	{ title: 'Admins', url: '/admins', icon: Shield },
]

const navSecondary = [
	{ title: 'Activity Log', url: '/activity', icon: Activity },
	{ title: 'Settings', url: '/settings', icon: Settings2 },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { open } = useSidebar()

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<Link to="/" className="-m-1.5 ml-1 p-1.5">
					{open ? (
						<>
							<div className="flex flex-row items-end">
								<span className="text-3xl font-extrabold text-rose-700 dark:text-rose-500">
									Rent
								</span>
								<span className="text-3xl font-extrabold">Loop</span>
							</div>
							<span className="text-xs text-muted-foreground">Admin Panel</span>
						</>
					) : (
						<GalleryVerticalEnd className="mt-1 -ml-1 size-6 text-rose-600" />
					)}
				</Link>
			</SidebarHeader>

			<SidebarContent>
				<NavMain items={navMain} />
				<NavSecondary items={navSecondary} />
			</SidebarContent>

			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
