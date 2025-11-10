import {
	Building,
	CircleEllipsis,
	Mail,
	MessageCircle,
	Phone,
} from 'lucide-react'
import { PropertyTenantsController } from './controller'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import {
	TypographyH4,
	TypographyMuted,
	TypographyP,
} from '~/components/ui/typography'
import { getNameInitials } from '~/lib/misc'
import { useProperty } from '~/providers/property-provider'

const tenants = [
	{
		id: 't1',
		name: 'Gideon Bempong',
		since: 'Jan 2025',
		location: 'Osu, Accra',
		phone: '(233) 277099230',
		email: 'gideon@example.com',
		profile: 'https://github.com/shadcn.png',
		status: 'Active',
	},
	{
		id: 't2',
		name: 'Adwoa Mensah',
		since: 'Mar 2024',
		location: 'Kumasi, Ashanti',
		phone: '(233) 244000111',
		email: 'adwoa@example.com',
		profile: `https://i.pravatar.cc/150?u=adwoa`,
		status: 'Suspended',
	},
	{
		id: 't3',
		name: 'Kofi Adu',
		since: 'Jul 2023',
		location: 'Takoradi, Western',
		phone: '(233) 201234567',
		email: 'kofi@example.com',
		profile: `https://i.pravatar.cc/150?u=kofi`,
		status: 'Active',
	},
	{
		id: 't4',
		name: 'Selina Koranteng',
		since: 'Nov 2022',
		location: 'Tema, Greater Accra',
		phone: '(233) 205555888',
		email: 'selina@example.com',
		profile: `https://i.pravatar.cc/150?u=selina`,
		status: 'Supended',
	},
]

export function PropertyTenantsModule() {
	const { property } = useProperty()

	return (
		<div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
			<div>
				<TypographyH4 className="mb-1">
					Manage {property?.name ?? 'Property'}'s Tenants
				</TypographyH4>
				<TypographyMuted>
					Tenants with active access and contact details.
				</TypographyMuted>
			</div>

			<PropertyTenantsController />

			<div className="h-full w-full">
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{tenants.map((tenant) => (
						<Card
							key={tenant.id}
							className="transform transition-shadow will-change-transform hover:-translate-y-0.5 hover:shadow-lg"
						>
							<CardHeader className="flex items-start justify-between gap-3">
								<CardTitle>
									<Badge
										variant={tenant.status === 'Active' ? 'outline' : 'default'}
										className="px-2 py-1 text-xs"
									>
										{tenant.status}
									</Badge>
								</CardTitle>

								<CardAction className="flex items-center gap-2">
									<Button variant="outline" size="icon-sm" title="Message">
										<MessageCircle />
									</Button>

									<Button variant="outline" size="icon-sm" title="More">
										<CircleEllipsis />
									</Button>
								</CardAction>
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

								<Separator className="my-2" />

								<div>
									<div className="flex items-center gap-2 text-sm">
										<Building size={14} className="text-zinc-500" />
										<TypographyP className="!mt-0">
											{tenant.location}
										</TypographyP>
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

							<CardFooter>
								<Button size="sm" variant="outline" className="w-full">
									View Profile
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			</div>
		</div>
	)
}
