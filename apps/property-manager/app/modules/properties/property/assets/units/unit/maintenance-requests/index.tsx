import { TypographyH4, TypographyMuted } from '~/components/ui/typography'

export function PropertyAssetUnitMaintenanceRequestsModule() {
	return (
		<div className="mt-3 flex flex-col items-center justify-center py-16">
			<TypographyH4>Maintenance Requests</TypographyH4>
			<TypographyMuted>
				Maintenance requests tied to this unit will appear here.
			</TypographyMuted>
		</div>
	)
}
