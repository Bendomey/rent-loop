import dayjs from 'dayjs'
import {
	Building,
	Clock,
	MoreHorizontalIcon,
	Pencil,
	Trash,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'
import { PropertyAssetBlocksController } from './controller'
import { useGetPropertyBlocks } from '~/api/blocks'
import { EmptyOutline } from '~/components/datatable/empty'
import { ErrorContainer } from '~/components/ErrorContainer'
import { Image } from '~/components/Image'
import { LoadingContainer } from '~/components/LoadingContainer'
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
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { useProperty } from '~/providers/property-provider'

export function PropertyAssetBlocksModule() {
	const { clientUserProperty } = useProperty()
	const navigate = useNavigate()

	const [searchParams] = useSearchParams()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE

	const { data, isPending, isRefetching, error, refetch } =
		useGetPropertyBlocks({
			property_id: clientUserProperty?.property?.id!,
			filters: {},
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
				<TypographyH4 className="mb-1">Manage Blocks</TypographyH4>
				<TypographyMuted>
					Manage all blocks under this property.
				</TypographyMuted>
			</div>

			<PropertyAssetBlocksController isLoading={isLoading} refetch={refetch} />

			{isLoading ? (
				<LoadingContainer />
			) : error ? (
				<ErrorContainer />
			) : !data?.rows.length ? (
				<EmptyOutline />
			) : (
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
					{data?.rows.map((block) => (
						<Card
							key={block.id}
							className="gap-2 overflow-hidden pt-0 pb-3 shadow-none"
						>
							<div className="h-44 w-full overflow-hidden">
								<Image
									className="h-full w-full object-cover"
									src={block.images?.[0] ?? 'https://placehold.co/600x400'}
									alt={block.name}
								/>
							</div>

							<CardHeader className="flex items-center justify-between">
								<CardTitle className="">{block.name}</CardTitle>
							</CardHeader>

							<CardContent className="mt-2 space-y-2 pb-2">
								<Badge
									className={
										block.status === 'PropertyBlock.Status.Active'
											? 'bg-teal-500 text-white'
											: 'bg-rose-500 text-white'
									}
								>
									Active
								</Badge>
								<div className="flex items-center gap-2">
									<Building className="text-zinc-500" size={16} />
									<TypographyMuted className="truncate">
										{block.unitsCount} Units
									</TypographyMuted>
								</div>
								<div className="flex items-center gap-2">
									<Clock className="text-zinc-500" size={16} />
									<TypographyMuted className="truncate">
										{dayjs(block.created_at).format('MMM D, YYYY')}
									</TypographyMuted>
								</div>
							</CardContent>

							<CardFooter className="border-t-[1px] pt-3">
								<div className="mx-auto">
									<ButtonGroup>
										<Button
											onClick={() =>
												navigate(
													`/properties/${clientUserProperty?.property_id}/assets/units?filters=blocks&blocks=${block.id}`,
												)
											}
											variant="outline"
										>
											View Units
										</Button>
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
													<DropdownMenuItem>
														<Pencil />
														Edit
													</DropdownMenuItem>
													<DropdownMenuItem variant="destructive">
														<Trash />
														Delete
													</DropdownMenuItem>
												</DropdownMenuGroup>
											</DropdownMenuContent>
										</DropdownMenu>
									</ButtonGroup>
								</div>
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</div>
	)
}
