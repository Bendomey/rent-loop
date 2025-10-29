import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	CreditCard,
	LogOut,
} from 'lucide-react'
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
import { getNameInitials } from '~/lib/misc'
import { useAuth } from '~/providers/auth-provider'

export function NavUser() {
	const { currentUser } = useAuth()
	const { isMobile } = useSidebar()

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<AlertDialog>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<Avatar className="h-8 w-8 rounded-lg">
									{/* <AvatarImage src={user.avatar} alt={currentUser?.name} /> */}
									<AvatarFallback className="rounded-lg">
										{getNameInitials(currentUser?.name ?? '')}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										{currentUser?.name}
									</span>
									<Badge variant="outline" className="mt-1">
										<span className="truncate text-xs capitalize">
											{currentUser?.role?.toLowerCase()}
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
										{/* <AvatarImage src={user.avatar} alt={user.name} /> */}
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
								<DropdownMenuItem disabled>
									<Bell />
									Notifications
								</DropdownMenuItem>
							</DropdownMenuGroup>
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
	)
}
