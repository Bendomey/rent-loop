import dayjs from 'dayjs'
import {
	CircleCheck,
	Copy,
	EllipsisVertical,
	Eye,
	ImageIcon,
	Info,
	Pencil,
	Trash,
	Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { PropertyAssetUnitsController } from './controller'
import DeletePropertyUnitModal from './delete'
import { useGetPropertyUnits } from '~/api/units'
import { GridElement } from '~/components/Grid'
import { Image } from '~/components/Image'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import {
	ASSET_MANAGEMENT_GUIDE_URL,
	PAGINATION_DEFAULTS,
} from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

export function PropertyAssetUnitsModule() {
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const isMultiProperty = clientUserProperty?.property?.type === 'MULTI'
	const [unitPendingDelete, setUnitPendingDelete] = useState<PropertyUnit>()
	const [openDeleteModal, setOpenDeleteModal] = useState(false)

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const status = searchParams.get('status') ?? undefined
	const block_ids = searchParams.getAll('blocks') ?? undefined

	const { data, isPending, isRefetching, error, refetch } = useGetPropertyUnits(
		safeString(clientUser?.client_id),
		{
			property_id: safeString(clientUserProperty?.property?.id),
			filters: {
				status: status,
				block_ids: block_ids.length ? block_ids : undefined,
			},
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

	const unitCards = useMemo(
		() =>
			({ data }: { data: PropertyUnit }) => {
				const isDeletable =
					data.status === 'Unit.Status.Draft' ||
					data.status === 'Unit.Status.Maintenance'
				const isOccupied =
					data.status === 'Unit.Status.Occupied' ||
					data.status === 'Unit.Status.PartiallyOccupied'
				const deleteDisabledReason = isOccupied
					? 'This unit is occupied and cannot be deleted.'
					: 'Switch this unit to Draft or Maintenance to delete it.'
				return (
					<Card
						key={data.id}
						className="gap-2 overflow-hidden pt-0 pb-3 shadow-none"
					>
						<div className="relative h-40 w-full overflow-hidden">
							{data.images?.[0] ? (
								<Image
									className="h-full w-full object-cover"
									src={data.images[0]}
									alt={data.name}
								/>
							) : (
								<div className="bg-muted flex h-44 w-full items-center justify-center">
									<ImageIcon className="text-muted-foreground size-10" />
								</div>
							)}
							<div className="absolute top-2 right-2 flex items-center gap-1">
								<Badge
									variant="outline"
									className={
										data.status === 'Unit.Status.Available'
											? 'border-none bg-teal-500 text-white shadow-sm'
											: data.status === 'Unit.Status.Maintenance'
												? 'border-none bg-yellow-500 text-white shadow-sm'
												: data.status === 'Unit.Status.Occupied'
													? 'border-none bg-rose-500 text-white shadow-sm'
													: data.status === 'Unit.Status.PartiallyOccupied'
														? 'border-none bg-orange-500 text-white shadow-sm'
														: 'border-none bg-zinc-400 text-white shadow-sm'
									}
								>
									{data.status === 'Unit.Status.Available'
										? 'Available'
										: data.status === 'Unit.Status.Maintenance'
											? 'Maintenance'
											: data.status === 'Unit.Status.Occupied'
												? 'Occupied'
												: data.status === 'Unit.Status.PartiallyOccupied'
													? 'Partially Occupied'
													: 'Draft'}
								</Badge>
								{(data.max_occupants_allowed ?? 0) > 1 && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Badge
												variant="outline"
												className="gap-1 border-none bg-sky-500 text-white shadow-sm"
											>
												<Users className="size-3" />
												Shared Unit
											</Badge>
										</TooltipTrigger>
										<TooltipContent>
											Up to {data.max_occupants_allowed} tenants
										</TooltipContent>
									</Tooltip>
								)}
							</div>
						</div>

						<CardHeader className="px-4">
							<CardTitle className="">{data.name}</CardTitle>
						</CardHeader>

						<CardContent className="space-y-2 px-4 pb-2">
							<div className="flex items-center gap-2">
								<CircleCheck className="text-zinc-500" size={16} />
								<TypographyMuted>{`Updated ${dayjs(data.updated_at).format('MMM D, YYYY')}`}</TypographyMuted>
							</div>
						</CardContent>

						<CardFooter className="flex space-x-2 border-t-[1px] pt-3">
							<Button
								type="button"
								variant="outline"
								size="icon-sm"
								className="flex w-10/12 flex-row gap-2 py-5 text-xs text-zinc-500"
								onClick={() => {
									void navigate(
										`/properties/${data.property_id}/assets/units/${data.id}`,
									)
								}}
							>
								<Eye />
								View
							</Button>
							<PropertyPermissionGuard roles={['MANAGER']}>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon">
											<EllipsisVertical className="size-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() =>
												void navigate(
													`/properties/${data.property_id}/assets/units/${data.id}/edit`,
												)
											}
										>
											<Pencil className="size-4" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												void navigate(
													`/properties/${data.property_id}/assets/units/new?unit_id=${data.id}`,
												)
											}
										>
											<Copy className="size-4" />
											Duplicate
										</DropdownMenuItem>
										{isMultiProperty && (
											<>
												<DropdownMenuSeparator />
												{isDeletable ? (
													<DropdownMenuItem
														variant="destructive"
														onClick={() => {
															setUnitPendingDelete(data)
															setOpenDeleteModal(true)
														}}
													>
														<Trash className="size-4" />
														Delete
													</DropdownMenuItem>
												) : (
													<Tooltip>
														<TooltipTrigger asChild>
															<span
																tabIndex={0}
																className="block cursor-not-allowed"
															>
																<DropdownMenuItem
																	variant="destructive"
																	disabled
																	className="pointer-events-none"
																>
																	<Trash className="size-4" />
																	Delete
																</DropdownMenuItem>
															</span>
														</TooltipTrigger>
														<TooltipContent side="left">
															{deleteDisabledReason}
														</TooltipContent>
													</Tooltip>
												)}
											</>
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							</PropertyPermissionGuard>
						</CardFooter>
					</Card>
				)
			},
		[navigate, isMultiProperty],
	)

	return (
		<div className="mx-auto my-6 flex w-full max-w-7xl flex-col gap-4 px-6 sm:gap-6">
			<div>
				<div className="flex items-center gap-2">
					<TypographyH4 className="mb-1">Manage Units</TypographyH4>
					<Tooltip>
						<TooltipTrigger asChild>
							<a
								href={`${ASSET_MANAGEMENT_GUIDE_URL}#what-are-units`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Info className="text-muted-foreground size-4 transition-colors hover:text-rose-600" />
							</a>
						</TooltipTrigger>
						<TooltipContent>Learn more about units</TooltipContent>
					</Tooltip>
				</div>
				<TypographyMuted>Manage all units under this property.</TypographyMuted>
			</div>

			<PropertyAssetUnitsController isLoading={isLoading} refetch={refetch} />

			<div>
				<GridElement
					boxHeight={62}
					isLoading={isLoading}
					gridColumns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
					gridElement={unitCards}
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
							'Units are the individual spaces your tenants rent. Add your first unit to get started.',
						learnMoreUrl: `${ASSET_MANAGEMENT_GUIDE_URL}#what-are-units`,
					}}
					refetch={refetch}
				/>
			</div>

			<DeletePropertyUnitModal
				opened={openDeleteModal}
				setOpened={setOpenDeleteModal}
				data={unitPendingDelete}
			/>
		</div>
	)
}
