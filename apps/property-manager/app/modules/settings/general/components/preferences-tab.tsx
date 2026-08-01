import { Pencil } from 'lucide-react'
import { PLACEHOLDER_PREFERENCES } from '../placeholder-data'
import {
	comingSoon,
	SettingsPanel,
	SettingsRow,
} from '~/components/blocks/settings-ui'
import { Button } from '~/components/ui/button'

/**
 * Regional preferences have no API behind them yet — none of these are on the
 * Client model, so every row toasts via comingSoon(). See
 * ../placeholder-data.ts.
 */
const ROWS = [
	{
		label: 'Currency',
		sub: 'All rents, invoices and reports use this currency.',
		value: PLACEHOLDER_PREFERENCES.currency,
		feature: 'Changing your currency',
	},
	{
		label: 'Time zone',
		sub: 'Due dates and reminders follow this zone.',
		value: PLACEHOLDER_PREFERENCES.timezone,
		feature: 'Changing your time zone',
	},
	{
		label: 'Date format',
		sub: 'How dates are written across the portal and on documents.',
		value: PLACEHOLDER_PREFERENCES.dateFormat,
		feature: 'Changing your date format',
	},
	{
		label: 'Language',
		sub: 'The portal language for your account.',
		value: PLACEHOLDER_PREFERENCES.language,
		feature: 'Changing your language',
	},
]

export function PreferencesTab() {
	return (
		<div className="flex flex-col gap-5">
			<SettingsPanel caption="Regional preferences" className="pb-1">
				{ROWS.map((row, index) => (
					<SettingsRow
						key={row.label}
						label={row.label}
						sub={row.sub}
						value={row.value}
						action={
							<Button
								variant="outline"
								size="sm"
								onClick={comingSoon(row.feature)}
							>
								<Pencil /> Change
							</Button>
						}
						last={index === ROWS.length - 1}
					/>
				))}
			</SettingsPanel>
		</div>
	)
}
