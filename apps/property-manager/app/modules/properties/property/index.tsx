import { PropertySectionCards } from './components/cards'
import { PropertyChartBar } from './components/chart'
import { PropertyMaintenanceRequest } from './components/maintenance'
import { PropertyRentIncomeCards } from './components/rent-cards'
import { PropertyUnitsChart } from './components/units-chart'
import { TypographyH1, TypographyP } from '~/components/ui/typography'
import { useProperty } from '~/providers/property-provider'

export function PropertyModule() {
	const { clientUserProperty } = useProperty()

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-8">
			{/* Header */}
			<div className="mb-8">
				<TypographyH1 className="text-2xl font-semibold tracking-tight md:text-3xl">
					Property Overview {clientUserProperty?.property?.name ? `— ${clientUserProperty?.property.name}` : ''}
				</TypographyH1>
				<TypographyP className="text-muted-foreground mt-1 text-sm">
					Comprehensive insights into rental performance, occupancy, and
					maintenance trends.
				</TypographyP>
			</div>

			{/* Summary Cards */}
			<section className="mb-8">
				<PropertySectionCards />
			</section>

			{/* Charts Section */}
			<section className="grid grid-cols-1 gap-6 lg:grid-cols-6">
				<div className="order-2 lg:order-1 lg:col-span-4">
					<PropertyChartBar />
				</div>

				<div className="order-1 lg:order-2 lg:col-span-2">
					<PropertyUnitsChart />
				</div>
			</section>

			{/* Bottom Widgets */}
			<section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
				<div className="bg-background rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
					<PropertyRentIncomeCards />
				</div>
				<div className="bg-background rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
					<PropertyMaintenanceRequest />
				</div>
			</section>
		</div>
	)
}
