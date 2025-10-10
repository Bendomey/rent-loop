import { PlusCircleIcon, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '~/components/ui/sidebar'

export function NavProperties({
	projects,
}: {
	projects: {
		name: string
		url: string
		icon: LucideIcon
	}[]
}) {
	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Properties</SidebarGroupLabel>
			<SidebarMenu>
				{projects.map((item) => (
					<SidebarMenuItem key={item.name}>
						<SidebarMenuButton asChild>
							<Link to={item.url}>
								<item.icon />
								<span>{item.name}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
				<SidebarMenuItem>
					<Link to="/properties/new">
						<SidebarMenuButton className="text-sidebar-foreground/70">
							<PlusCircleIcon className="text-sidebar-foreground/70" />
							<span>Add New Property</span>
						</SidebarMenuButton>
					</Link>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	)
}
