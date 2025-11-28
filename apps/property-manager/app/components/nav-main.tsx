import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { Badge } from './ui/badge'
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
import { COMING_SOON_ROUTE } from '~/lib/constants'

export function NavMain({
	items,
	title,
	titleClassName = '',
	baseRoute = '',
}: {
	titleClassName?: string
	title?: string
	baseRoute?: string
	items: {
		title: string
		url: string
		icon?: LucideIcon
		isActive?: boolean
		isComingSoon?: boolean
		isHome?: boolean
		items?: {
			title: string
			isComingSoon?: boolean
			isBeta?: boolean
			isNew?: boolean
			url: string
		}[]
	}[]
}) {
	const location = useLocation()
	return (
		<SidebarGroup>
			<SidebarGroupLabel className={titleClassName}>
				{title ?? 'Main Navigation'}
			</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => {
					if (item?.items?.length) {
						const isActive =
							item.isActive ||
							item.items?.some((i) => {
								const url = `${baseRoute}${item.url}${i.url}`

								let isActive = location.pathname.includes(url) || item.isActive
								if (item.isHome) {
									isActive = Boolean(location.pathname === url) || item.isActive
								}

								return isActive
							})
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

												let link = `${baseRoute}${item.url}${subItem.url}`
												if (subItem.isComingSoon) {
													link = COMING_SOON_ROUTE
												}
												return (
													<SidebarMenuSubItem key={subItem.title}>
														<SidebarMenuSubButton asChild isActive={isActive}>
															<Link to={link}>
																<span>{subItem.title}</span>
																{subItem.isComingSoon ? (
																	<Badge className="h-4 min-w-3 bg-yellow-600 text-[8px] text-white">
																		Coming Soon
																	</Badge>
																) : subItem.isBeta ? (
																	<Badge className="h-4 min-w-3 bg-blue-700 text-[8px] text-white">
																		Beta
																	</Badge>
																) : subItem.isNew ? (
																	<Badge className="h-4 min-w-3 bg-green-700 text-[8px] text-white">
																		New
																	</Badge>
																) : null}
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
					let isActive = location.pathname.includes(url) || item.isActive

					if (item.isHome) {
						isActive = location.pathname === url || item.isActive
					}

					let link = `${baseRoute}${item.url}`
					if (item.isComingSoon) {
						link = COMING_SOON_ROUTE
					}

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
								<Link to={link}>
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
