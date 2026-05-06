import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

export function PropertyCard({
	unit,
	propertyId,
}: {
	unit: PropertyUnit | null | undefined
	propertyId: string
}) {
	if (!unit) return null

	const image = unit.images?.[0]
	const property = unit.property

	return (
		<Card className="shadow-none">
			<CardHeader className="">
				<div className="flex items-center justify-between">
					<CardTitle className="text-[10px] font-semibold tracking-widest text-rose-600 uppercase">
						Property
					</CardTitle>
					<Link
						to={`/properties/${propertyId}/assets/units/${unit.id}`}
						className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
					>
						View unit
						<ExternalLink className="size-3" />
					</Link>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				{/* Unit image */}
				<div className="relative overflow-hidden rounded-lg">
					<Badge className="absolute top-2 left-2 z-10 bg-black/70 text-[10px] tracking-wide text-white uppercase">
						{unit.name}
					</Badge>
					{image ? (
						<img
							src={image}
							alt={unit.name}
							className="h-36 w-full object-cover"
						/>
					) : (
						<div className="bg-muted flex h-36 w-full items-center justify-center">
							<span className="text-muted-foreground text-xs">No image</span>
						</div>
					)}
				</div>

				{/* Property details */}
				<div className="space-y-0.5">
					<p className="text-sm font-semibold">{property?.name ?? unit.name}</p>
					{property ? (
						<p className="text-muted-foreground text-xs">
							{[property.address, property.city].filter(Boolean).join(' · ')}
						</p>
					) : null}
				</div>

				{/* Unit features */}
				{unit.max_occupants_allowed || unit.area || unit.type ? (
					<div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
						{unit.type ? <span>{unit.type.toLowerCase()}</span> : null}
						{unit.area ? <span>{unit.area} m²</span> : null}
						{unit.max_occupants_allowed ? (
							<span>Sleeps {unit.max_occupants_allowed}</span>
						) : null}
					</div>
				) : null}
			</CardContent>
		</Card>
	)
}
