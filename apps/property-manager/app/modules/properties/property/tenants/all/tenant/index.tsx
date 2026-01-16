import { Building, Mail, Phone } from 'lucide-react'
import { Link, Outlet, useLocation, useParams } from 'react-router'
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
import { useProperty } from '~/providers/property-provider'

const tenant = {
	id: 't1',
	name: 'Gideon Bempong',
	since: 'Jan 2025',
	location: 'Osu, Accra',
	phone: '(233) 277099230',
	email: 'gideon@example.com',
	profile: 'https://github.com/shadcn.png',
	status: 'Active',
}

export function TenantModule() {
	const { pathname } = useLocation()
	const { tenantId } = useParams()
	const { clientUserProperty } = useProperty()

	const baseUrl = `/properties/${clientUserProperty?.property?.id}/tenants/all/${tenantId}`
	return (
		<div className="m-5 grid grid-cols-12 gap-4">
			<div className="col-span-4">
				<Card key={tenant.id} className="shadow-none">
					<CardHeader className="flex items-start justify-between gap-3">
						<CardTitle>
							<Badge
								variant={tenant.status === 'Active' ? 'secondary' : 'default'}
								className="px-2 py-1 text-xs"
							>
								{tenant.status}
							</Badge>
						</CardTitle>
					</CardHeader>

					<CardContent className="space-y-3">
						<div className="flex flex-col items-center gap-3">
							<Avatar className="h-16 w-16">
								{tenant.profile ? (
									<AvatarImage src={tenant.profile} alt={tenant.name} />
								) : (
									<AvatarFallback>
										{getNameInitials(tenant.name)}
									</AvatarFallback>
								)}
							</Avatar>
							<div>
								<CardTitle className="text-sm font-semibold">
									{tenant.name}
								</CardTitle>
								<TypographyMuted className="text-xs">
									Rent from {tenant.since}
								</TypographyMuted>
							</div>
						</div>

						<Separator className="my-5" />

						<div>
							<div className="flex items-center gap-2 text-sm">
								<Building size={14} className="text-zinc-500" />
								<TypographyP className="!mt-0">{tenant.location}</TypographyP>
							</div>

							<div className="flex items-center gap-2 text-sm">
								<Phone size={14} className="text-zinc-500" />
								<TypographyP className="!mt-0">{tenant.phone}</TypographyP>
							</div>

							<div className="flex items-center gap-2 text-sm">
								<Mail size={14} className="text-zinc-500" />
								<TypographyP className="!mt-0">{tenant.email}</TypographyP>
							</div>
						</div>
					</CardContent>

					<CardFooter></CardFooter>
				</Card>
			</div>
			<div className="col-span-8">
				<Tabs value={pathname}>
					<TabsList>
						<Link to={baseUrl}>
							<TabsTrigger value={baseUrl}>Profile</TabsTrigger>
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
						<Outlet />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
