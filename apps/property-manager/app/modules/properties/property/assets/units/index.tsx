import dayjs from 'dayjs'
import { CircleCheck, House, MapPin, Wrench } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { PropertyAssetUnitsController } from './controller'
import { useGetPropertyUnits } from '~/api/units'
import { GridElement } from '~/components/Grid'
import { Image } from '~/components/Image'
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
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { useProperty } from '~/providers/property-provider'

export function PropertyAssetUnitsModule() {
	const { clientUserProperty } = useProperty()

	const [searchParams] = useSearchParams()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const status = searchParams.get('status') ?? undefined
	const block_ids = searchParams.getAll('blocks') ?? undefined

	const { data, isPending, isRefetching, error, refetch } = useGetPropertyUnits(
		{
			property_id: safeString(clientUserProperty?.property?.id),
			filters: { status: status, block_ids: block_ids },
			pagination: { page, per },
			populate: [],
			sorter: { sort: 'desc', sort_by: 'created_at' },
			search: {
				query: searchParams.get('query') ?? undefined,
				fields: ['name'],
			},
		},
	)

	const isLoading = isPending || isRefetching

	return (
		<div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
			<div>
				<TypographyH4 className="mb-1">Manage Units</TypographyH4>
				<TypographyMuted>Manage all units under this property.</TypographyMuted>
			</div>

			<PropertyAssetUnitsController isLoading={isLoading} refetch={refetch} />

			<div>
				<GridElement
					boxHeight={62}
					isLoading={isLoading}
					gridColumns={{ sm: 2, md: 2, lg: 3, xl: 4 }}
					gridElement={({ data }: { data: PropertyUnit }) => (
						<Card
							key={data.id}
							className="gap-2 overflow-hidden pt-0 pb-3 shadow-none"
						>
							<div className="h-44 w-full overflow-hidden">
								<Image
									className="h-full w-full object-cover"
									src={data.images?.[0] ?? 'https://placehold.co/600x400'}
									alt={data.name}
								/>
							</div>

							<CardHeader className="flex items-center justify-between">
								<CardTitle className="truncate">{data.name}</CardTitle>
								<CardAction>
									<Badge
										variant="outline"
										className={
											data.status === 'Unit.Status.Available'
												? 'bg-teal-500 text-white'
												: data.status === 'Unit.Status.Maintenance'
													? 'bg-yellow-500 text-white'
													: data.status === 'Unit.Status.Occupied'
														? 'bg-rose-500 text-white'
														: 'bg-zinc-400 text-white'
										}
									>
										{data.status === 'Unit.Status.Available'
											? 'Available'
											: data.status === 'Unit.Status.Maintenance'
												? 'Maintenance'
												: data.status === 'Unit.Status.Occupied'
													? 'Occupied'
													: 'Draft'}
									</Badge>
								</CardAction>
							</CardHeader>

							<CardContent className="space-y-2 pb-2">
								<div className="flex items-center gap-2">
									<MapPin className="text-zinc-500" size={16} />
									<TypographyMuted className="truncate">
										{data.max_occupants_allowed}
									</TypographyMuted>
								</div>
								<div className="flex items-center gap-2">
									<CircleCheck className="text-zinc-500" size={16} />
									<TypographyMuted>{`Updated ${dayjs(data.updated_at).format('MMM D, YYYY')}`}</TypographyMuted>
								</div>
							</CardContent>

							<CardFooter className="flex justify-around border-t-[1px] pt-3">
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="flex w-fit flex-col gap-1 px-3 py-6 text-xs text-zinc-500"
								>
									<House />
									Tenants
								</Button>

								{/* <Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="flex w-fit flex-col gap-1 px-3 py-6 text-xs text-zinc-500"
							>
								<BadgeCent />
								Accounting
							</Button> */}

								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="flex w-fit flex-col gap-1 px-3 py-6 text-xs text-zinc-500"
								>
									<Wrench />
									Maintenance
								</Button>
							</CardFooter>
						</Card>
					)}
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
					error={error ? { message: 'Failed to load units.' } : undefined}
					empty={{
						message: 'No units found',
						description:
							"Try adjusting your search to find what you're looking for.",
					}}
					refetch={refetch}
				/>
			</div>
		</div>
	)
}
