import dayjs from 'dayjs'
import { Calendar, Copy, Link } from 'lucide-react'
import { toast } from 'sonner'
import { useUnitContext } from '../context'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { TypographyMuted, TypographyP } from '~/components/ui/typography'
import { WEBSITE_URL } from '~/lib/constants'
import { toFirstUpperCase } from '~/lib/strings'
import { useProperty } from '~/providers/property-provider'

const paymentFrequencyLabels: Record<
	PropertyUnit['payment_frequency'],
	string
> = {
	WEEKLY: 'Weekly',
	DAILY: 'Daily',
	MONTHLY: 'Monthly',
	// QUARTERLY: 'Quarterly',
	// BIANNUALLY: 'Biannually',
	// ANNUALLY: 'Annually',
}

export function PropertyAssetUnitDetailsModule() {
	const { unit } = useUnitContext()
	const { clientUserProperty } = useProperty()

	const modes = clientUserProperty?.property?.modes ?? []
	const isBooking = modes.includes('BOOKING')
	const propertySlug = unit.property?.slug
	const unitSlug = unit.slug
	const bookingUrl =
		propertySlug && unitSlug
			? `${WEBSITE_URL}/book/${propertySlug}/${unitSlug}`
			: null

	const handleCopyLink = () => {
		if (!bookingUrl) return
		void navigator.clipboard.writeText(bookingUrl).then(() => {
			toast.success('Booking link copied')
		})
	}

	return (
		<div className="mt-3 space-y-4">
			{/* Description */}
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle>Description</CardTitle>
				</CardHeader>
				<CardContent>
					<TypographyP className="!mt-0 text-sm text-zinc-700 dark:text-zinc-400">
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
						{unit.features &&
							Object.entries(unit.features).map(([key, val], idx) => (
								<div key={idx}>
									<TypographyMuted className="text-xs">{key}</TypographyMuted>
									<TypographyP className="!mt-0 text-sm">{val}</TypographyP>
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

			{isBooking && bookingUrl ? (
				<Card className="shadow-none">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Link className="size-4" />
							Public Booking Link
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="bg-muted flex items-center justify-between gap-2 rounded-md px-3 py-2">
							<span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
								{bookingUrl}
							</span>
							<Button
								size="icon"
								variant="ghost"
								className="shrink-0"
								onClick={handleCopyLink}
							>
								<Copy className="size-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			) : null}
		</div>
	)
}
