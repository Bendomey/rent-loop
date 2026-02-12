import { TypographyH4, TypographyMuted } from '~/components/ui/typography'

export function PropertyAssetUnitLeasesModule() {
	return (
		<div className="mt-3 flex flex-col items-center justify-center py-16">
			<TypographyH4>Leases</TypographyH4>
			<TypographyMuted>
				Leases tied to this unit will appear here.
			</TypographyMuted>
		</div>
	)
}
