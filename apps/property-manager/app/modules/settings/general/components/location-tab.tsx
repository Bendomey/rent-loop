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

export function LocationTab({ client, onEdit }: Props) {
	return (
		<div className="flex flex-col gap-5">
			<SettingsPanel>
				<SettingsPanelHeader
					caption="Business location"
					description="Your official physical address. Used on invoices and lease documents."
					action={
						<Button variant="outline" size="sm" onClick={onEdit}>
							<Pencil /> Edit
						</Button>
					}
				/>

				<div className="flex flex-col gap-6">
					<SettingField label="Address" value={safeString(client.address)} />

					<div className="grid gap-6 sm:grid-cols-3 sm:gap-x-10">
						<SettingField label="Country" value={safeString(client.country)} />
						<SettingField label="Region" value={safeString(client.region)} />
						<SettingField label="City" value={safeString(client.city)} />
					</div>
				</div>
			</SettingsPanel>
		</div>
	)
}
