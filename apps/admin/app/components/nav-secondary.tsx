import { type LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '~/components/ui/sidebar'

export function NavSecondary({
	items,
}: {
	items: {
		title: string
		url: string
		icon: LucideIcon
	}[]
}) {
	const location = useLocation()

	return (
		<SidebarGroup className="mt-auto">
			<SidebarGroupLabel>System</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => {
					const isActive = location.pathname.startsWith(item.url)
					return (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								className={
									isActive
										? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
										: ''
								}
								tooltip={item.title}
								asChild
							>
								<Link to={item.url}>
									<item.icon />
									<span>{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					)
				})}
			</SidebarMenu>
		</SidebarGroup>
	)
}
