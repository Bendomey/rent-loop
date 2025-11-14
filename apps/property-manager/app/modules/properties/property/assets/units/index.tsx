import { BadgeCent, CircleCheck, House, MapPin, Wrench } from 'lucide-react'
import { PropertyAssetUnitsController } from './controller'
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
import { useProperty } from '~/providers/property-provider'

const Units = [
	{
		id: 1,
		title: 'Unit A1',
		status: 'Active',
		floor: '1st Floor',
		updated: 'Nov 14',
		img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto=format&fit=crop',
	},
	{
		id: 2,
		title: 'Unit A2',
		status: 'Active',
		floor: '1st Floor',
		updated: 'Nov 10',
		img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
	},
	{
		id: 3,
		title: 'Unit B1',
		status: 'Inactive',
		floor: '2nd Floor',
		updated: 'Nov 12',
		img: 'https://images.unsplash.com/photo-1599423300746-b62533397364?q=80&w=2070&auto=format&fit=crop',
	},
	{
		id: 4,
		title: 'Unit B2',
		status: 'Active',
		floor: '2nd Floor',
		updated: 'Nov 11',
		img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=2070&auto=format&fit=crop',
	},
	{
		id: 5,
		title: 'Unit C1',
		status: 'Inactive',
		floor: '3rd Floor',
		updated: 'Nov 9',
		img: 'https://images.unsplash.com/photo-1599423300746-b62533397364?q=80&w=2070&auto=format&fit=crop',
	},
	{
		id: 6,
		title: 'Unit C2',
		status: 'Active',
		floor: '3rd Floor',
		updated: 'Nov 8',
		img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto=format&fit=crop',
	},
	{
		id: 7,
		title: 'Unit D1',
		status: 'Active',
		floor: '4th Floor',
		updated: 'Nov 14',
		img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop',
	},
]

export function PropertyAssetUnitsModule() {
	const { property } = useProperty()

	return (
		<div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
			<div>
				<TypographyH4 className="mb-1">
					Manage {property?.name ?? 'Property'}'s Units
				</TypographyH4>
				<TypographyMuted>Manage all units under this property.</TypographyMuted>
			</div>

			<PropertyAssetUnitsController />

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Units.map((unit) => (
					<Card
						key={unit.id}
						className="gap-2 overflow-hidden pt-0 pb-3 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg"
					>
						<div className="h-44 w-full overflow-hidden">
							<Image
								className="h-full w-full object-cover"
								src={unit.img}
								alt={unit.title}
							/>
						</div>

						<CardHeader className="flex items-center justify-between">
							<CardTitle className="truncate">{unit.title}</CardTitle>
							<CardAction>
								<Badge
									variant="outline"
									className={
										unit.status === 'Active'
											? 'bg-teal-500 text-white'
											: 'bg-rose-500 text-white'
									}
								>
									{unit.status}
								</Badge>
							</CardAction>
						</CardHeader>

						<CardContent className="space-y-2 pb-2">
							<div className="flex items-center gap-2">
								<MapPin className="text-zinc-500" size={16} />
								<TypographyMuted className="truncate">
									{unit.floor}
								</TypographyMuted>
							</div>
							<div className="flex items-center gap-2">
								<CircleCheck className="text-zinc-500" size={16} />
								<TypographyMuted>{`Updated ${unit.updated}`}</TypographyMuted>
							</div>
						</CardContent>

						<CardFooter className="flex justify-between border-t-[1px] pt-3">
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="flex w-fit flex-col gap-1 px-3 py-6 text-xs text-zinc-500"
							>
								<House />
								Tenants
							</Button>

							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="flex w-fit flex-col gap-1 px-3 py-6 text-xs text-zinc-500"
							>
								<BadgeCent />
								Accounting
							</Button>

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
				))}
			</div>
		</div>
	)
}
