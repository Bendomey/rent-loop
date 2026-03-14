import { BriefcaseBusiness, Mail, Phone } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { PropertyTenantsController } from './controller'
import { useGetPropertyTenants } from '~/api/tenants'
import { GridElement } from '~/components/Grid'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
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
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { getNameInitials } from '~/lib/misc'
import { safeString } from '~/lib/strings'
import { useProperty } from '~/providers/property-provider'

export function PropertyTenantsModule() {
	const { clientUserProperty } = useProperty()
	const [searchParams] = useSearchParams()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const status = searchParams.get('status') ?? undefined

	const { data, isPending, isRefetching, error, refetch } =
		useGetPropertyTenants({
			property_id: safeString(clientUserProperty?.property?.id),
			filters: { status: status },
			pagination: { page, per },
			populate: [],
			sorter: { sort: 'desc', sort_by: 'created_at' },
			search: {
				query: searchParams.get('query') ?? undefined,
				fields: ['first_name', 'last_name', 'other_names', 'email', 'phone'],
			},
		})

	const isLoading = isPending || isRefetching

	return (
		<div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
			<div>
				<TypographyH4 className="mb-1">
					Manage {clientUserProperty?.property?.name ?? 'Property'}'s Tenants
				</TypographyH4>
				<TypographyMuted>
					Tenants with active access and contact details.
				</TypographyMuted>
			</div>

			<PropertyTenantsController isLoading={isLoading} refetch={refetch} />

			<div className="h-full w-full">
				<GridElement
					boxHeight={58}
					isLoading={isLoading}
					gridColumns={{ sm: 2, md: 2, lg: 4, xl: 4 }}
					gridElement={({ data: tenant }: { data: Tenant }) => {
						const name = `${tenant.first_name} ${tenant.other_names ? tenant.other_names + ' ' : ''}${tenant.last_name}`

						return (
							<Card key={tenant.id} className="shadow-none">
								<CardHeader className="flex items-start justify-between gap-3">
									<CardTitle>
										<Badge
											variant={
												tenant.status === 'ACTIVE' ? 'secondary' : 'default'
											}
											className="px-2 py-1 text-xs"
										>
											{tenant.status === 'ACTIVE' ? 'Active' : 'Expired'}
										</Badge>
									</CardTitle>
								</CardHeader>

								<CardContent className="space-y-3">
									<div className="flex flex-col items-center gap-3">
										<Avatar className="h-16 w-16">
											{tenant.profile_photo_url ? (
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
											<CardTitle className="text-sm font-semibold">
												{name}
											</CardTitle>
											<TypographyMuted className="text-xs">
												{tenant.gender === 'MALE' ? 'Male' : 'Female'}
											</TypographyMuted>
										</div>
									</div>

									<Separator className="my-2" />

									<div>
										<div className="flex items-center gap-2 text-sm">
											<BriefcaseBusiness size={14} className="text-zinc-500" />
											<TypographyP className="!mt-0">
												{tenant.occupation}
											</TypographyP>
										</div>

										<div className="flex items-center gap-2 text-sm">
											<Phone size={14} className="text-zinc-500" />
											<TypographyP className="!mt-0">
												{tenant.phone}
											</TypographyP>
										</div>

										<div className="flex items-center gap-2 text-sm">
											<Mail size={14} className="text-zinc-500" />
											<TypographyP className="!mt-0 max-w-full truncate">
												{tenant.email}
											</TypographyP>
										</div>
									</div>
								</CardContent>

								<CardFooter>
									<Link
										className="w-full"
										to={`/properties/${clientUserProperty?.property_id}/tenants/all/${tenant.id}`}
									>
										<Button size="sm" variant="outline" className="w-full">
											View Profile
										</Button>
									</Link>
								</CardFooter>
							</Card>
						)
					}}
					dataResponse={{
						rows: data?.rows ?? [],
						total: data?.meta?.total ?? 0,
						page,
						page_size: per,
						order: data?.meta?.order ?? 'desc',
						order_by: data?.meta?.order_by ?? 'created_at',
						has_prev_page: data?.meta?.has_prev_page ?? false,
						has_next_page: data?.meta?.has_next_page ?? false,
					}}
					error={error ? { message: 'Failed to load tenants.' } : undefined}
					empty={{
						message: 'No tenants found',
						description:
							"Try adjusting your search to find what you're looking for.",
					}}
					refetch={refetch}
				/>
			</div>
		</div>
	)
}
