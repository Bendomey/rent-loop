import { Building2, Eye, ImageIcon } from 'lucide-react'
import { Link } from 'react-router'
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
import { Separator } from '~/components/ui/separator'
import { TypographyMuted, TypographyP } from '~/components/ui/typography'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import {
	getPaymentFrequencyPeriodLabel,
	getPropertyUnitStatusLabel,
} from '~/lib/properties.utils'
import { toFirstUpperCase } from '~/lib/strings'

function getStatusBadgeClass(status: PropertyUnit['status']) {
	switch (status) {
		case 'Unit.Status.Available':
			return 'bg-teal-500 text-white'
		case 'Unit.Status.Maintenance':
			return 'bg-yellow-500 text-white'
		case 'Unit.Status.Occupied':
			return 'bg-rose-500 text-white'
		case 'Unit.Status.PartiallyOccupied':
			return 'bg-orange-500 text-white'
		case 'Unit.Status.Draft':
		default:
			return 'bg-zinc-600 text-white'
	}
}

export function UnitAvailabilitySummaryCard({ unit }: { unit: PropertyUnit }) {
	const unitUrl = `/properties/${unit.property_id}/assets/units/${unit.id}`

	return (
		<Card className="overflow-hidden pt-0 shadow-none">
			<div className="relative h-48 w-full overflow-hidden">
				{unit.images?.[0] ? (
					<Image
						className="h-full w-full object-cover"
						src={unit.images[0]}
						alt={unit.name}
					/>
				) : (
					<div className="bg-muted flex h-full w-full items-center justify-center">
						<ImageIcon className="text-muted-foreground size-10" />
					</div>
				)}
			</div>

			<CardHeader className="flex items-start justify-between">
				<CardTitle className="text-lg">{unit.name}</CardTitle>
				<CardAction>
					<Badge variant="outline" className={getStatusBadgeClass(unit.status)}>
						{getPropertyUnitStatusLabel(unit.status)}
					</Badge>
				</CardAction>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="flex items-center gap-2 text-sm">
					<Building2 size={16} className="text-zinc-500" />
					<TypographyP className="!mt-0">
						{toFirstUpperCase(unit.type)}
					</TypographyP>
				</div>

				<Separator />

				<div className="space-y-1">
					<TypographyMuted className="text-xs">Rent Fee</TypographyMuted>
					<p className="text-2xl font-semibold">
						{formatAmount(
							convertPesewasToCedis(unit.rent_fee),
							unit.rent_fee_currency,
						)}
					</p>
					<TypographyMuted className="text-xs">
						a {getPaymentFrequencyPeriodLabel(unit.payment_frequency)}
					</TypographyMuted>
				</div>
			</CardContent>

			<CardFooter className="border-t pt-4">
				<Link to={unitUrl} className="w-full">
					<Button variant="outline" size="sm" className="w-full">
						<Eye className="mr-1 size-4" />
						View unit
					</Button>
				</Link>
			</CardFooter>
		</Card>
	)
}
