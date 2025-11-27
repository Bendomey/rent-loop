import { Eye, Frame, PlusCircleIcon } from 'lucide-react'
import { Link } from 'react-router'

import PermissionGuard from './permissions/permission-guard'
import {
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '~/components/ui/sidebar'
import { useAuth } from '~/providers/auth-provider'

export function NavProperties() {
	const { clientUserProperties } = useAuth()
	if (clientUserProperties?.rows.length === 0) return null

	const hasMoreProperties = clientUserProperties?.meta?.has_next_page

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>My Properties</SidebarGroupLabel>
			<PermissionGuard roles={['ADMIN', 'OWNER']}>
				<Link to="/properties/new">
					<SidebarGroupAction title="Add Properties">
						<PlusCircleIcon /> <span className="sr-only">Add Property</span>
					</SidebarGroupAction>
				</Link>
			</PermissionGuard>
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
				{hasMoreProperties ? (
					<SidebarMenuItem>
						<Link to="/properties">
							<SidebarMenuButton className="text-sidebar-foreground/70">
								<Eye className="text-sidebar-foreground/70" />
								<span className="text-xs">View all...</span>
							</SidebarMenuButton>
						</Link>
					</SidebarMenuItem>
				) : null}
			</SidebarMenu>
		</SidebarGroup>
	)
}
