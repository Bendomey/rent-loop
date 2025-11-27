import { ChevronsUpDown, Frame, FrameIcon, Plus } from 'lucide-react'
import * as React from 'react'
import { Link, useParams } from 'react-router'

import PermissionGuard from './permissions/permission-guard'
import { useGetClientUserProperties } from '~/api/client-user-properties'
import {
	DropdownMenu,
	DropdownMenuContent,
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
import { useAuth } from '~/providers/auth-provider'

export function PropertySwitcher() {
	const { currentUser } = useAuth()
	const { isMobile } = useSidebar()
	const { propertyId } = useParams()

	const { data } = useGetClientUserProperties({
		pagination: { page: 1, per: 5 },
		sorter: {},
		search: {},
		populate: ['Property'],
		filters: { client_user_id: currentUser?.id },
	})

	const activeProperty = React.useMemo(() => {
		return data?.rows?.find(
			(clientUserProperty) =>
				clientUserProperty?.property?.id === propertyId,
		)
	}, [data, propertyId])

	if (data?.rows?.length === 1) {
		return null
	}

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
								<FrameIcon className="size-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{activeProperty?.property?.name}
								</span>
								<span className="truncate text-xs">
									{activeProperty?.property?.slug}
								</span>
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
						{data?.rows
							?.filter(
								(clientUserProperty) =>
									clientUserProperty?.property?.id !== propertyId,
							)
							?.map((clientUserProperty) => (
								<Link
									key={clientUserProperty.id}
									to={`/properties/${clientUserProperty?.property?.id}`}
								>
									<DropdownMenuItem className="gap-2 p-2">
										<div className="flex size-6 items-center justify-center rounded-md border">
											<Frame className="size-3.5 shrink-0" />
										</div>
										{clientUserProperty?.property?.name}
									</DropdownMenuItem>
								</Link>
							))}
						<PermissionGuard roles={['ADMIN', 'OWNER']}>
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
						</PermissionGuard>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
