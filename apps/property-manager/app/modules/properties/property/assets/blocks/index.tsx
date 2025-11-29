import dayjs from 'dayjs'
import {
	Building,
	Clock,
	MoreHorizontalIcon,
	Pencil,
	Trash,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { PropertyAssetBlocksController } from './controller'
import { Image } from '~/components/Image'
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
import { useProperty } from '~/providers/property-provider'

const blocks: Array<PropertyBlock> = [
	{
		id: 'block-1',
		name: 'Block A',
		description: 'This is Block A of the property.',
		property_id: 'property-1',
		property: null,
		floorsCount: 4,
		unitsCount: 10,
		images: [],
		created_at: new Date('2023-01-15T10:00:00Z'),
		updated_at: new Date('2023-06-20T12:00:00Z'),
		status: 'PropertyBlock.Status.Active',
	},
]

export function PropertyAssetBlocksModule() {
	const { clientUserProperty } = useProperty()
	const navigate = useNavigate()
	return (
		<div className="m-6 space-y-3">
			<div>
				<TypographyH4 className="mb-1">Manage Blocks</TypographyH4>
				<TypographyMuted>
					Manage all blocks under this property.
				</TypographyMuted>
			</div>

			<PropertyAssetBlocksController />

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
				{blocks.map((block) => (
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
		</div>
	)
}
