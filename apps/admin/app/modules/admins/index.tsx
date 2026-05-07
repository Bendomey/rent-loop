import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

export function AdminsModule() {
	return (
		<main className="px-4 py-8 md:px-8">
			<TypographyH2>Admins</TypographyH2>
			<TypographyMuted>
				View and manage Rentloop admin accounts.
			</TypographyMuted>
		</main>
	)
}
