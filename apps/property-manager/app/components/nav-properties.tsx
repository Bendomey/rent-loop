import { Frame, PlusCircleIcon } from 'lucide-react'
import { Link } from 'react-router'

import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '~/components/ui/sidebar'
import { useAuth } from '~/providers/auth-provider'

export function NavProperties() {
	const { currentUser, clientUserProperties } = useAuth()
	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>My Properties</SidebarGroupLabel>
			<SidebarMenu>
				{clientUserProperties?.rows?.map((item) => (
					<SidebarMenuItem key={item.id}>
						<SidebarMenuButton asChild>
							<Link to={`/properties/${item?.property?.slug}`}>
								<Frame />
								<span>{item?.property?.name}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
				{currentUser?.role !== 'STAFF' ? (
					<SidebarMenuItem>
						<Link to="/properties/new">
							<SidebarMenuButton className="text-sidebar-foreground/70">
								<PlusCircleIcon className="text-sidebar-foreground/70" />
								<span className="text-xs">Add New Property</span>
							</SidebarMenuButton>
						</Link>
					</SidebarMenuItem>
				) : null}
			</SidebarMenu>
		</SidebarGroup>
	)
}
