import { Eye, Frame, PlusCircleIcon } from 'lucide-react'
import { Link } from 'react-router'

import { PermissionGuard } from './permissions/permission-guard'
import { useGetClientUserProperties } from '~/api/client-user-properties'
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
	const { currentUser } = useAuth()
	const { data } = useGetClientUserProperties({
		pagination: { page: 1, per: 5 },
		sorter: {},
		search: {},
		populate: ['Property'],
		filters: { client_user_id: currentUser?.id },
	})

	if (!data?.rows.length) return null

	const hasMoreProperties = data?.meta?.has_next_page

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
				{data?.rows?.map((item) => (
					<SidebarMenuItem key={item.id}>
						<SidebarMenuButton asChild>
							<Link to={`/properties/${item?.property?.id}`}>
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
