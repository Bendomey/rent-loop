import { ChevronsUpDown, Plus } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '~/components/ui/sidebar'

export function PropertySwitcher({
	properties,
}: {
	properties: {
		name: string
		slug: string
		logo: React.ElementType
	}[]
}) {
	const { isMobile } = useSidebar()
	const [activeProperty, setActiveProperty] = React.useState(properties[0])

	if (!activeProperty) {
		return null
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mx-auto"
						>
							<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
								<activeProperty.logo className="size-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{activeProperty.name}
								</span>
								<span className="truncate text-xs">{activeProperty.slug}</span>
							</div>
							<ChevronsUpDown className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						align="start"
						side={isMobile ? 'bottom' : 'right'}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-muted-foreground text-xs">
							Properties
						</DropdownMenuLabel>
						{properties.map((property, index) => (
							<Link key={property.name} to={`/properties/${property.slug}`}>
								<DropdownMenuItem
									onClick={() => setActiveProperty(property)}
									className="gap-2 p-2"
								>
									<div className="flex size-6 items-center justify-center rounded-md border">
										<property.logo className="size-3.5 shrink-0" />
									</div>
									{property.name}
									<DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
								</DropdownMenuItem>
							</Link>
						))}
						<DropdownMenuSeparator />
						<Link to="/properties/new">
							<DropdownMenuItem className="gap-2 p-2">
								<div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
									<Plus className="size-4" />
								</div>
								<div className="text-muted-foreground font-medium">
									Add property
								</div>
							</DropdownMenuItem>
						</Link>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
