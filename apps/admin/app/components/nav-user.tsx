import {
	ChevronsUpDown,
	LogOut,
	Monitor,
	Moon,
	Palette,
	Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Form } from 'react-router'
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
} from '~/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
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

const themeOptions = [
	{ value: 'light', label: 'Light', icon: Sun },
	{ value: 'dark', label: 'Dark', icon: Moon },
	{ value: 'system', label: 'System', icon: Monitor },
]

export function NavUser() {
	const { currentUser } = useAuth()
	const { isMobile } = useSidebar()
	const { theme, setTheme } = useTheme()

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
									<AvatarFallback className="rounded-lg">
										{getNameInitials(currentUser?.name ?? '')}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										{currentUser?.name}
									</span>
									<span className="text-muted-foreground truncate text-xs">
										{currentUser?.email}
									</span>
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
								<DropdownMenuSub>
									<DropdownMenuSubTrigger>
										<Palette className="mr-2 size-4" />
										Theme
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent>
										<DropdownMenuRadioGroup
											value={theme}
											onValueChange={setTheme}
										>
											{themeOptions.map(({ value, label, icon: Icon }) => (
												<DropdownMenuRadioItem key={value} value={value}>
													<Icon className="mr-2 size-4" />
													{label}
												</DropdownMenuRadioItem>
											))}
										</DropdownMenuRadioGroup>
									</DropdownMenuSubContent>
								</DropdownMenuSub>
							</DropdownMenuGroup>

							<DropdownMenuSeparator />

							<AlertDialogTrigger asChild>
								<DropdownMenuItem className="text-destructive focus:text-destructive">
									<LogOut className="mr-2 size-4" />
									Log out
								</DropdownMenuItem>
							</AlertDialogTrigger>
						</DropdownMenuContent>
					</DropdownMenu>

					<AlertDialogContent className="sm:max-w-[425px]">
						<AlertDialogHeader>
							<AlertDialogTitle>Are you sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This will log you out of the admin panel.
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
