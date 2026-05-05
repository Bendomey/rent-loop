import { Users, Building2, FileText, ClipboardList } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { PropertySectionCards } from './components/cards'
import { PropertyChartBar } from './components/chart'
import { PropertyRentIncomeCards } from './components/rent-cards'
import { PropertyUnitsChart } from './components/units-chart'
import { TypographyH1, TypographyP } from '~/components/ui/typography'
import { useTour } from '~/hooks/use-tour'
import { PROPERTY_OVERVIEW_TOUR_STEPS, TOUR_KEYS } from '~/lib/tours'
import { useProperty } from '~/providers/property-provider'

const NAV_ITEMS = (propertyId: string) => {
	const baseUrl = `/properties/${propertyId}`
	return [
		{
			label: 'Manage Tenants',
			icon: Users,
			to: `${baseUrl}/tenants/all`,
		},
		{
			label: 'Manage Units',
			icon: Building2,
			to: `${baseUrl}/assets/units`,
		},
		{
			label: 'View Leases',
			icon: FileText,
			to: `${baseUrl}/tenants/leases`,
		},
		{
			label: 'Lease Applications',
			icon: ClipboardList,
			to: `${baseUrl}/tenants/applications`,
		},
	]
}

export function PropertyModule() {
	const { clientUserProperty } = useProperty()
	const propertyId = clientUserProperty?.property_id ?? ''
	const { startTour, hasCompletedTour } = useTour(
		TOUR_KEYS.PROPERTY_OVERVIEW,
		PROPERTY_OVERVIEW_TOUR_STEPS,
	)

	useEffect(() => {
		if (!hasCompletedTour()) startTour()
	}, [hasCompletedTour, startTour])

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-8">
			{/* Header */}
			<div id="property-overview-header" className="mb-8">
				<TypographyH1 className="text-2xl font-semibold tracking-tight md:text-3xl">
					Property Overview{' '}
					{clientUserProperty?.property?.name
						? `— ${clientUserProperty?.property.name}`
						: ''}
				</TypographyH1>
				<TypographyP className="text-muted-foreground mt-1 mb-4 text-sm">
					Comprehensive insights into rental performance, occupancy, and
					maintenance trends.
				</TypographyP>
				<div className="flex gap-2 overflow-x-auto pb-1">
					{NAV_ITEMS(propertyId).map(({ label, icon: Icon, to }) => (
						<Link
							key={label}
							to={to}
							className="bg-background hover:bg-muted text-foreground flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
						>
							<Icon className="text-muted-foreground size-4" />
							{label}
						</Link>
					))}
				</div>
			</div>

			{/* Summary Cards */}
			<section id="property-summary-cards" className="mb-8">
				<PropertySectionCards propertyId={propertyId} />
			</section>

			{/* Charts Section */}
			<section
				id="property-charts"
				className="grid grid-cols-1 gap-6 lg:grid-cols-6"
			>
				<div className="order-2 lg:order-1 lg:col-span-4">
					<PropertyChartBar propertyId={propertyId} />
				</div>

				<div className="order-1 lg:order-2 lg:col-span-2">
					<PropertyUnitsChart propertyId={propertyId} />
				</div>
			</section>

			{/* Bottom Widgets */}
			<section className="mt-8">
				<div
					id="property-rent-income"
					className="bg-background rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md"
				>
					<PropertyRentIncomeCards propertyId={propertyId} />
				</div>
			</section>
		</div>
	)
}
