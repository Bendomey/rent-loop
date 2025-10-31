import { ArrowLeft, type LucideIcon } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router'

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '~/components/ui/sidebar'

export function NavSecondary({
	items,
	onProperty,
	...props
}: {
	onProperty?: boolean
	items: {
		title: string
		url?: string
		icon: LucideIcon
		onClick?: () => void
	}[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{onProperty ? (
						<SidebarMenuItem>
							<SidebarMenuButton tooltip="Main Menu" asChild size="sm">
								<Link to="/properties">
									<ArrowLeft />
									<span>Main Menu</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					) : null}
					{items.map((item) => {
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton asChild tooltip={item.title} size="sm">
									{item.url ? (
										<Link to={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									) : (
										<button className="cursor-pointer" onClick={item?.onClick}>
											<item.icon />
											<span>{item.title}</span>
										</button>
									)}
								</SidebarMenuButton>
							</SidebarMenuItem>
						)
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
