import { Pencil } from 'lucide-react'
import {
	SettingField,
	SettingsPanel,
	SettingsPanelHeader,
} from '~/components/blocks/settings-ui'
import { Button } from '~/components/ui/button'
import { safeString } from '~/lib/strings'

interface Props {
	client: Client
	onEdit: () => void
}

export function CompanyTab({ client, onEdit }: Props) {
	const website = safeString(client.website_url)

	return (
		<div className="flex flex-col gap-5">
			<SettingsPanel>
				<SettingsPanelHeader
					caption="Company details"
					description="Information about your company. Support details appear to tenants when they need to reach you."
					action={
						<Button variant="outline" size="sm" onClick={onEdit}>
							<Pencil /> Edit
						</Button>
					}
				/>

				<div className="grid gap-6 sm:grid-cols-2 sm:gap-x-10">
					<SettingField
						label="Description"
						value={safeString(client.description)}
						className="sm:col-span-2"
					/>
					<SettingField
						label="Registration number"
						value={safeString(client.registration_number)}
					/>
					<SettingField
						label="Support email"
						value={safeString(client.support_email)}
					/>
					<SettingField
						label="Support phone"
						value={safeString(client.support_phone)}
					/>
					<SettingField
						label="Website"
						value={
							website ? (
								<a
									href={website}
									target="_blank"
									rel="noreferrer"
									className="text-primary underline underline-offset-4"
								>
									{website}
								</a>
							) : (
								''
							)
						}
					/>
				</div>
			</SettingsPanel>
		</div>
	)
}
