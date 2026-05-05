import { Building, Mail, Phone } from 'lucide-react'
import {
	Link,
	Outlet,
	useLoaderData,
	useLocation,
	useParams,
} from 'react-router'
import { TenantProfileModule } from './profile'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { TypographyMuted, TypographyP } from '~/components/ui/typography'
import { getNameInitials } from '~/lib/misc'
import type { loader } from '~/routes/_auth.properties.$propertyId.tenants.all.$tenantId'

export function TenantModule() {
	const { clientUserProperty, tenant } = useLoaderData<typeof loader>()

	const { pathname } = useLocation()
	const { tenantId } = useParams()
	const name = `${tenant?.first_name} ${tenant?.other_names ? tenant?.other_names + ' ' : ''}${tenant?.last_name}`

	const baseUrl = `/properties/${clientUserProperty?.property?.id}/tenants/all/${tenantId}`
	return (
		<div className="m-5 grid grid-cols-12 gap-4">
			<div className="col-span-12 lg:col-span-4">
				<Card key={tenant?.id} className="shadow-none">
					<CardHeader className="flex items-start justify-between gap-3">
						<CardTitle>
							{/* <Badge
								variant={tenant?.status === 'ACTIVE' ? 'secondary' : 'default'}
								className="px-2 py-1 text-xs"
							>
								{tenant?.status === 'ACTIVE' ? 'Active' : 'Expired'}
							</Badge> */}
						</CardTitle>
					</CardHeader>

					<CardContent className="space-y-3">
						<div className="flex flex-col items-center gap-3">
							<Avatar className="h-16 w-16">
								{tenant?.profile_photo_url ? (
									<AvatarImage
										src={tenant.profile_photo_url}
										alt={name}
										className="object-cover"
									/>
								) : (
									<AvatarFallback>{getNameInitials(name)}</AvatarFallback>
								)}
							</Avatar>
							<div className="text-center">
								<CardTitle className="text-sm font-semibold">{name}</CardTitle>
								<TypographyMuted className="text-xs">
									{tenant?.gender === 'MALE' ? 'Male' : 'Female'}
								</TypographyMuted>
							</div>
						</div>

						<Separator className="my-5" />

						<div>
							<div className="flex items-center gap-2 text-sm">
								<Building size={14} className="text-zinc-500" />
								<TypographyP className="!mt-0">
									{tenant?.occupation}
								</TypographyP>
							</div>

							<div className="flex items-center gap-2 text-sm">
								<Phone size={14} className="text-zinc-500" />
								<TypographyP className="!mt-0">{tenant?.phone}</TypographyP>
							</div>

							<div className="flex items-center gap-2 text-sm">
								<Mail size={14} className="text-zinc-500" />
								<TypographyP className="!mt-0">{tenant?.email}</TypographyP>
							</div>
						</div>
					</CardContent>

					<CardFooter></CardFooter>
				</Card>
			</div>
			<div className="col-span-12 lg:col-span-8">
				<Tabs value={pathname}>
					<TabsList>
						<Link to={baseUrl}>
							<TabsTrigger value={baseUrl}>Profile</TabsTrigger>
						</Link>
						<Link to={`${baseUrl}/activity-logs`}>
							<TabsTrigger value={`${baseUrl}/activity-logs`}>
								Activity Logs
							</TabsTrigger>
						</Link>
						<Link to={`${baseUrl}/leases`}>
							<TabsTrigger value={`${baseUrl}/leases`}>Leases</TabsTrigger>
						</Link>
						<Link to={`${baseUrl}/payments`}>
							<TabsTrigger value={`${baseUrl}/payments`}>Payments</TabsTrigger>
						</Link>
						<Link to={`${baseUrl}/maintenance-requests`}>
							<TabsTrigger value={`${baseUrl}/maintenance-requests`}>
								Requests
							</TabsTrigger>
						</Link>
					</TabsList>
					<TabsContent value={pathname}>
						{pathname === baseUrl ? (
							tenant && <TenantProfileModule tenant={tenant} />
						) : (
							<Outlet />
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
