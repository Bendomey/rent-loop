import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	CreditCard,
	LogOut,
	Map,
	Moon,
	Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { Form, Link } from 'react-router'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from './ui/alert-dialog'
import { Badge } from './ui/badge'
import { useGetNotificationUnreadCount } from '~/api/notifications'
import { NotificationSheet } from '~/components/blocks/notification-sheet'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '~/components/ui/sidebar'
import { useOnboardingTour } from '~/hooks/use-onboarding-tour'
import { getNameInitials } from '~/lib/misc'
import { useAuth } from '~/providers/auth-provider'
import { useClient } from '~/providers/client-provider'

export function NavUser() {
	const { currentUser } = useAuth()
	const { clientUser } = useClient()
	const { isMobile } = useSidebar()
	const { theme, setTheme } = useTheme()
	const { startTour } = useOnboardingTour()
	const [notifOpen, setNotifOpen] = useState(false)

	const { data: unreadCount = 0 } = useGetNotificationUnreadCount()

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<AlertDialog>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<div className="relative">
										<Avatar className="h-8 w-8 rounded-lg">
											<AvatarFallback className="rounded-lg">
												{getNameInitials(currentUser?.name ?? '')}
											</AvatarFallback>
										</Avatar>
										{unreadCount > 0 && (
											<span className="absolute -top-0.5 -right-0.5 flex size-2.5">
												<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
												<span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
											</span>
										)}
									</div>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">
											{currentUser?.name}
										</span>
										<Badge variant="outline" className="mt-1">
											<span className="truncate text-xs capitalize">
												{clientUser?.role?.toLowerCase()}
											</span>
										</Badge>
									</div>
									<ChevronsUpDown className="ml-auto size-4" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
								side={isMobile ? 'bottom' : 'right'}
								align="end"
								sideOffset={4}
							>
								<DropdownMenuLabel className="p-0 font-normal">
									<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
										<Avatar className="h-8 w-8 rounded-lg">
											<AvatarFallback className="rounded-lg">
												{getNameInitials(currentUser?.name ?? '')}
											</AvatarFallback>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-medium">
												{currentUser?.name}
											</span>
											<span className="truncate text-xs">
												{currentUser?.email}
											</span>
										</div>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<Link to="/settings/my-account">
										<DropdownMenuItem>
											<BadgeCheck />
											Account
										</DropdownMenuItem>
									</Link>
									<Link to="/settings/billing">
										<DropdownMenuItem>
											<CreditCard />
											Billing
										</DropdownMenuItem>
									</Link>
									<DropdownMenuItem onSelect={() => setNotifOpen(true)}>
										<Bell />
										Notifications
										{unreadCount > 0 && (
											<Badge
												variant="destructive"
												className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-bold"
											>
												{unreadCount > 99 ? '99+' : unreadCount}
											</Badge>
										)}
									</DropdownMenuItem>
									<DropdownMenuItem onClick={startTour}>
										<Map />
										Take the tour
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											setTheme(theme === 'dark' ? 'light' : 'dark')
										}
									>
										{theme === 'dark' ? <Sun /> : <Moon />}
										{theme === 'dark' ? 'Light' : 'Dark'}
									</DropdownMenuItem>
								</DropdownMenuGroup>
								{currentUser?.client_users?.length &&
								currentUser?.client_users?.length > 1 ? (
									<>
										<DropdownMenuSeparator />
										<Link to="/select-client">
											<DropdownMenuItem>Switch workspace</DropdownMenuItem>
										</Link>
									</>
								) : null}
								<DropdownMenuSeparator />
								<AlertDialogTrigger asChild>
									<DropdownMenuItem>
										<LogOut />
										Log out
									</DropdownMenuItem>
								</AlertDialogTrigger>
							</DropdownMenuContent>
						</DropdownMenu>
						<AlertDialogContent className="sm:max-w-[425px]">
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This action will log you out of your account.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<Form method="post" action="/logout">
									<AlertDialogAction type="submit">Logout</AlertDialogAction>
								</Form>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</SidebarMenuItem>
			</SidebarMenu>

			<NotificationSheet open={notifOpen} onOpenChange={setNotifOpen} />
		</>
	)
}
