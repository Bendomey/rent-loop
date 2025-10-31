import { SectionCards } from './cards'
import { ChartBarDefault } from './chart'
import { DateRangePicker } from '~/components/ui/date-ranger-picker'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import { useAuth } from '~/providers/auth-provider'

export function DashboardModule() {
	const { currentUser } = useAuth()
	return (
		<main className="px-2 py-5 md:px-7">
			<div className="@container/main flex flex-1 flex-col gap-2">
				<div className="flex flex-col md:flex-row md:items-center gap-4 justify-between px-4 lg:px-6">
					<div>
						<TypographyH2>Welcome back, {currentUser?.name}</TypographyH2>
						<TypographyMuted>
							Here is an overview of your dashboard metrics.
						</TypographyMuted>
					</div>
					<div>
						<DateRangePicker
							onUpdate={(values) => console.log(values)}
							initialDateFrom={localizedDayjs().subtract(1, 'month').toDate()}
							initialDateTo={new Date()}
							align="end"
							locale="en-GB"
							showCompare={false}
						/>
					</div>
				</div>
				<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
					<SectionCards />
					<div className="px-4 lg:px-6">
						<ChartBarDefault />
					</div>
				</div>
			</div>
		</main>
	)
}
