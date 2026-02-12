import dayjs from 'dayjs'
import { Calendar } from 'lucide-react'
import { useUnitContext } from '../context'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { TypographyMuted, TypographyP } from '~/components/ui/typography'
import { toFirstUpperCase } from '~/lib/strings'

const paymentFrequencyLabels: Record<
	PropertyUnit['payment_frequency'],
	string
> = {
	WEEKLY: 'Weekly',
	DAILY: 'Daily',
	MONTHLY: 'Monthly',
	QUARTERLY: 'Quarterly',
	BIANNUALLY: 'Biannually',
	ANNUALLY: 'Annually',
}

export function PropertyAssetUnitDetailsModule() {
	const { unit } = useUnitContext()

	return (
		<div className="mt-3 space-y-4">
			{/* Description */}
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle>Description</CardTitle>
				</CardHeader>
				<CardContent>
					<TypographyP className="!mt-0 text-sm text-zinc-700">
						{unit.description ?? 'No description provided.'}
					</TypographyP>
				</CardContent>
			</Card>

			{/* Property & Block */}
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle>Property & Block</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<TypographyMuted className="text-xs">Property</TypographyMuted>
							<TypographyP className="!mt-0 text-sm">
								{unit.property?.name ?? '---'}
							</TypographyP>
						</div>
						<div>
							<TypographyMuted className="text-xs">Block</TypographyMuted>
							<TypographyP className="!mt-0 text-sm">
								{unit.property_block?.name ?? '---'}
							</TypographyP>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Specifications */}
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle>Specifications</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<TypographyMuted className="text-xs">Area</TypographyMuted>
							<TypographyP className="!mt-0 text-sm">
								{unit.area != null ? `${unit.area} sq m` : '---'}
							</TypographyP>
						</div>
						<div>
							<TypographyMuted className="text-xs">
								Max Occupants
							</TypographyMuted>
							<TypographyP className="!mt-0 text-sm">
								{unit.max_occupants_allowed ?? '---'}
							</TypographyP>
						</div>
						<div>
							<TypographyMuted className="text-xs">
								Payment Frequency
							</TypographyMuted>
							<TypographyP className="!mt-0 text-sm">
								{paymentFrequencyLabels[unit.payment_frequency]}
							</TypographyP>
						</div>
						<div>
							<TypographyMuted className="text-xs">Unit Type</TypographyMuted>
							<TypographyP className="!mt-0 text-sm">
								{toFirstUpperCase(unit.type)}
							</TypographyP>
						</div>
						<div>
							<TypographyMuted className="text-xs">Currency</TypographyMuted>
							<TypographyP className="!mt-0 text-sm">
								{unit.rent_fee_currency ?? 'GHS'}
							</TypographyP>
						</div>
						{unit.features && Object.entries(unit.features).map(([key, val], idx) => (
							<div key={idx}>
								<TypographyMuted className="text-xs">{key}</TypographyMuted>
								<TypographyP className="!mt-0 text-sm">
									{val}
								</TypographyP>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Timeline */}
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle>Timeline</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4">
						<div className="flex items-center gap-2">
							<Calendar size={14} className="text-zinc-500" />
							<div>
								<TypographyMuted className="text-xs">Created</TypographyMuted>
								<TypographyP className="!mt-0 text-sm">
									{dayjs(unit.created_at).format('LL')}
								</TypographyP>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Calendar size={14} className="text-zinc-500" />
							<div>
								<TypographyMuted className="text-xs">
									Last Updated
								</TypographyMuted>
								<TypographyP className="!mt-0 text-sm">
									{dayjs(unit.updated_at).format('LL')}
								</TypographyP>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
