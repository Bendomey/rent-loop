import { Calendar, Clock, User } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { PropertyAssetUnitMaintenanceRequestsController } from './controller'
import { useGetMaintenanceRequests } from '~/api/maintenance-requests'
import { GridElement } from '~/components/Grid'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import {
	TypographyH4,
	TypographyMuted,
	TypographyP,
} from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import {
	CATEGORY_LABELS,
	getStatusConfig,
	PRIORITY_LABELS,
	PRIORITY_STYLES,
} from '~/lib/maintenance-request.utils'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

export function PropertyAssetUnitMaintenanceRequestsModule() {
	const [searchParams] = useSearchParams()
	const { clientUser } = useClient()
	const { clientUserProperty } = useProperty()
	const { unitId } = useParams<{ unitId: string }>()

	const propertyId = safeString(clientUserProperty?.property_id)

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const status = searchParams.get('status') as
		| MaintenanceRequest['status']
		| undefined

	const { data, isPending, isRefetching, error, refetch } =
		useGetMaintenanceRequests(safeString(clientUser?.client_id), propertyId, {
			filters: { unit_id: unitId, status },
			pagination: { page, per },
			sorter: { sort: 'desc', sort_by: 'created_at' },
			populate: ['AssignedWorker', 'AssignedWorker.User'],
		})

	const isLoading = isPending || isRefetching

	return (
		<div className="mx-auto my-2 flex flex-col gap-4 sm:gap-6">
			<div className="space-y-1">
				<TypographyH4>Maintenance Requests</TypographyH4>
				<TypographyMuted>
					Track and manage maintenance requests for your property efficiently.
				</TypographyMuted>
			</div>

			<PropertyAssetUnitMaintenanceRequestsController />

			<div className="h-full w-full">
				<GridElement
					boxHeight={60}
					isLoading={isLoading}
					gridColumns={{ sm: 1, md: 1, lg: 2, xl: 3 }}
					gridElement={({ data }: { data: MaintenanceRequest }) => {
						const statusConfig = getStatusConfig(data.status)
						const StatusIcon = statusConfig.icon

						return (
							<Card
								key={data.id}
								className="shadow-sm transition-shadow hover:shadow-md"
							>
								<CardHeader className="pb-0">
									<div className="flex items-start justify-between gap-3">
										<div className="flex min-w-0 flex-1 flex-col items-start gap-2">
											<h3 className="hover:text-primary line-clamp-2 cursor-pointer text-sm leading-tight font-semibold">
												{data.title}
											</h3>
											<span className="text-muted-foreground text-xs">
												ID: #{data.code}
											</span>
										</div>
										<div className="flex flex-col items-end gap-2">
											<Badge
												variant={statusConfig.variant}
												className="flex items-center gap-1 px-2 py-1 text-xs font-medium"
											>
												<StatusIcon size={12} />
												{statusConfig.label}
											</Badge>
										</div>
									</div>
									<div className="flex flex-wrap items-center gap-1">
										<Badge
											variant="outline"
											className={cn(
												'border-0 px-1.5 py-0 text-[10px] font-medium',
												PRIORITY_STYLES[data.priority],
											)}
										>
											{PRIORITY_LABELS[data.priority]}
										</Badge>
										<Badge
											variant="outline"
											className="px-1.5 py-0 text-[10px] font-normal"
										>
											{CATEGORY_LABELS[data.category]}
										</Badge>
									</div>
								</CardHeader>

								<CardContent className="space-y-3">
									<Separator />

									<div className="flex items-center gap-2 text-xs">
										<Calendar size={14} className="text-muted-foreground" />
										<TypographyP className="!mt-0 text-xs">
											Submitted:{' '}
											<span className="text-muted-foreground font-medium">
												{data.created_at
													? localizedDayjs(data.created_at).format(
															'ddd, DD MMMM YYYY',
														)
													: 'N/A'}
											</span>
										</TypographyP>
									</div>

									{data.updated_at ? (
										<div className="flex items-center gap-2 text-xs">
											<Clock size={14} className="text-muted-foreground" />
											<TypographyP className="!mt-0 text-xs">
												Updated:{' '}
												<span className="text-muted-foreground">
													{localizedDayjs(data.updated_at).format(
														'ddd, DD MMMM YYYY',
													)}
												</span>
											</TypographyP>
										</div>
									) : null}
									{data.assigned_worker ? (
										<div className="flex items-center gap-2 text-xs">
											<User size={14} className="text-muted-foreground" />
											<TypographyP className="!mt-0 truncate text-xs">
												Assigned to:{' '}
												<span className="text-muted-foreground font-medium">
													{data.assigned_worker.user?.name}
												</span>
											</TypographyP>
										</div>
									) : null}
								</CardContent>

								<CardFooter className="pt-0">
									<Link
										className="w-full"
										to={`/properties/${propertyId}/activities/maintenance-requests/${data.id}`}
									>
										<Button size="sm" variant="outline" className="w-full">
											View Details
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
					error={
						error
							? { message: 'Failed to load maintenance requests.' }
							: undefined
					}
					empty={{
						message: 'No maintenance requests found',
						description:
							'There are no maintenance requests for this property yet.',
					}}
					refetch={refetch}
				/>
			</div>
		</div>
	)
}
