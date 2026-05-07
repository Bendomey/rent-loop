import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

export function SettingsModule() {
	return (
		<main className="px-4 py-8 md:px-8">
			<TypographyH2>Settings</TypographyH2>
			<TypographyMuted>
				Configure platform-level options and preferences.
			</TypographyMuted>
		</main>
	)
}
