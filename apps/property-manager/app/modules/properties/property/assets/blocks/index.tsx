import dayjs from 'dayjs'
import {
	Building,
	Clock,
	Info,
	MoreHorizontalIcon,
	Pencil,
	Trash,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { PropertyAssetBlocksController } from './controller'
import DeletePropertyBlockModal from './delete'
import { useGetPropertyBlocks } from '~/api/blocks'
import { GridElement } from '~/components/Grid'
import { Image } from '~/components/Image'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { ButtonGroup } from '~/components/ui/button-group'
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
	DropdownMenuGroup,
	DropdownMenuItem,
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

export function PropertyAssetBlocksModule() {
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const navigate = useNavigate()

	const [selectedPropertyBlock, setSelectedPropertyBlock] =
		useState<PropertyBlock>()
	const [openDeletePropertyBlockModal, setOpenDeletePropertyBlockModal] =
		useState(false)

	const [searchParams] = useSearchParams()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const status = searchParams.get('status') ?? undefined

	const { data, isPending, isRefetching, error, refetch } =
		useGetPropertyBlocks(safeString(clientUser?.client_id), {
			property_id: safeString(clientUserProperty?.property?.id),
			filters: { status: status },
			pagination: { page, per },
			populate: [],
			sorter: { sort: 'desc', sort_by: 'created_at' },
			search: {
				query: searchParams.get('query') ?? undefined,
				fields: ['name'],
			},
		})

	const isLoading = isPending || isRefetching

	return (
		<div className="m-6 space-y-3">
			<div>
				<div className="flex items-center gap-2">
					<TypographyH4 className="mb-1">Manage Blocks</TypographyH4>
					<Tooltip>
						<TooltipTrigger asChild>
							<a
								href={`${ASSET_MANAGEMENT_GUIDE_URL}#what-are-blocks`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Info className="text-muted-foreground size-4 transition-colors hover:text-rose-600" />
							</a>
						</TooltipTrigger>
						<TooltipContent>Learn more about blocks</TooltipContent>
					</Tooltip>
				</div>
				<TypographyMuted>
					Manage all blocks under this property.
				</TypographyMuted>
			</div>

			<PropertyAssetBlocksController isLoading={isLoading} refetch={refetch} />

			<div>
				<GridElement
					boxHeight={62}
					isLoading={isLoading}
					gridColumns={{ sm: 2, md: 2, lg: 3, xl: 4 }}
					gridElement={({ data }: { data: PropertyBlock }) => (
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
								<CardTitle className="">{data.name}</CardTitle>
							</CardHeader>

							<CardContent className="mt-2 space-y-2 pb-2">
								<Badge
									className={
										data.status === 'PropertyBlock.Status.Active'
											? 'bg-teal-500 text-white'
											: data.status === 'PropertyBlock.Status.Maintenance'
												? 'bg-yellow-500 text-white'
												: 'bg-rose-500 text-white'
									}
								>
									{data.status === 'PropertyBlock.Status.Active'
										? 'Active'
										: data.status === 'PropertyBlock.Status.Maintenance'
											? 'Maintenance'
											: 'Inactive'}
								</Badge>
								<div className="flex items-center gap-2">
									<Building className="text-zinc-500" size={16} />
									<TypographyMuted className="truncate">
										{data.units_count} Units
									</TypographyMuted>
								</div>
								<div className="flex items-center gap-2">
									<Clock className="text-zinc-500" size={16} />
									<TypographyMuted className="truncate">
										{dayjs(data.created_at).format('MMM D, YYYY')}
									</TypographyMuted>
								</div>
							</CardContent>

							<CardFooter className="border-t-[1px] pt-3">
								<div className="mx-auto">
									<ButtonGroup>
										<Button
											onClick={() =>
												navigate(
													`/properties/${clientUserProperty?.property_id}/assets/units?filters=blocks&blocks=${data.id}`,
												)
											}
											variant="outline"
										>
											View Units
										</Button>
										<PropertyPermissionGuard roles={['MANAGER']}>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="outline"
														size="icon"
														aria-label="More Options"
													>
														<MoreHorizontalIcon />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-52">
													<DropdownMenuGroup>
														<DropdownMenuItem
															onClick={() =>
																navigate(
																	`/properties/${clientUserProperty?.property_id}/assets/blocks/${data.id}/edit`,
																)
															}
														>
															<Pencil />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															variant="destructive"
															onClick={() => {
																setSelectedPropertyBlock(data)
																setOpenDeletePropertyBlockModal(true)
															}}
														>
															<Trash />
															Delete
														</DropdownMenuItem>
													</DropdownMenuGroup>
												</DropdownMenuContent>
											</DropdownMenu>
										</PropertyPermissionGuard>
									</ButtonGroup>
								</div>
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
					error={error ? { message: 'Failed to load blocks.' } : undefined}
					empty={{
						message: 'No blocks found',
						description:
							'Blocks help you organise units within this property — think buildings, wings, or floors.',
						learnMoreUrl: `${ASSET_MANAGEMENT_GUIDE_URL}#what-are-blocks`,
					}}
					refetch={refetch}
				/>
			</div>

			<DeletePropertyBlockModal
				opened={openDeletePropertyBlockModal}
				setOpened={setOpenDeletePropertyBlockModal}
				data={selectedPropertyBlock}
			/>
		</div>
	)
}
