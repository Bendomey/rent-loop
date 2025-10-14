import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '~/components/ui/collapsible'
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '~/components/ui/sidebar'

export function NavMain({
	items,
	title,
	baseRoute = '',
}: {
	title?: string
	baseRoute?: string
	items: {
		title: string
		url: string
		icon?: LucideIcon
		isActive?: boolean
		items?: {
			title: string
			url: string
		}[]
	}[]
}) {
	const location = useLocation()
	return (
		<SidebarGroup>
			<SidebarGroupLabel>{title ?? 'Main Navigation'}</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => {
					if (item?.items?.length) {
						const isActive =
							item.isActive ||
							item.items?.some(
								(i) => location.pathname === `${baseRoute}${item.url}${i.url}`,
							)
						return (
							<Collapsible
								key={item.title}
								asChild
								defaultOpen={isActive}
								className="group/collapsible"
							>
								<SidebarMenuItem>
									<CollapsibleTrigger asChild>
										<SidebarMenuButton
											tooltip={item.title}
											className={
												isActive
													? 'text-primary-foreground hover:text-primary-foreground bg-rose-600 hover:bg-rose-700'
													: ''
											}
										>
											{item.icon && <item.icon />}
											<span>{item.title}</span>
											<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
										</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											{item.items?.map((subItem) => {
												const isActive =
													location.pathname ===
													`${baseRoute}${item.url}${subItem.url}`
												return (
													<SidebarMenuSubItem key={subItem.title}>
														<SidebarMenuSubButton asChild isActive={isActive}>
															<Link
																to={`${baseRoute}${item.url}${subItem.url}`}
															>
																<span>{subItem.title}</span>
															</Link>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												)
											})}
										</SidebarMenuSub>
									</CollapsibleContent>
								</SidebarMenuItem>
							</Collapsible>
						)
					}

					const url = `${baseRoute}${item.url}`
					const isActive = location.pathname === url || item.isActive
					return (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								className={
									isActive
										? 'text-primary-foreground hover:text-primary-foreground bg-rose-600 hover:bg-rose-700'
										: ''
								}
								tooltip={item.title}
								asChild
							>
								<Link to={`${baseRoute}${item.url}`}>
									{item.icon && <item.icon />}
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
