import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

export function ActivityModule() {
	return (
		<main className="px-4 py-8 md:px-8">
			<TypographyH2>Activity Log</TypographyH2>
			<TypographyMuted>
				Audit trail of all admin actions taken on the platform.
			</TypographyMuted>
		</main>
	)
}
