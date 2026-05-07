import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

export function ApprovalsModule() {
	return (
		<main className="px-4 py-8 md:px-8">
			<TypographyH2>Approvals</TypographyH2>
			<TypographyMuted>
				Review and action pending property manager applications.
			</TypographyMuted>
		</main>
	)
}
