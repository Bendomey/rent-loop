import { Pencil } from 'lucide-react'
import { idTypeOptions } from './use-client-mutation'
import {
	SettingField,
	SettingsPanel,
	SettingsPanelHeader,
} from '~/components/blocks/settings-ui'
import { Button } from '~/components/ui/button'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'

interface Props {
	client: Client
	onEdit: () => void
}

export function IdentityTab({ client, onEdit }: Props) {
	const idTypeLabel = client.id_type
		? idTypeOptions.find((o) => o.value === client.id_type)?.label
		: undefined
	const documentUrl = safeString(client.id_document_url)

	return (
		<div className="flex flex-col gap-5">
			<SettingsPanel>
				<SettingsPanelHeader
					caption="Identity"
					description="Your government-issued identification. Used to verify the person behind this account."
					action={
						<Button variant="outline" size="sm" onClick={onEdit}>
							<Pencil /> Edit
						</Button>
					}
				/>

				<div className="grid gap-6 sm:grid-cols-2 sm:gap-x-10">
					<SettingField label="ID type" value={idTypeLabel} />
					<SettingField
						label="ID number"
						value={safeString(client.id_number)}
					/>
					<SettingField
						label="Expiry date"
						value={
							client.id_expiry
								? localizedDayjs(client.id_expiry).format('MMM D, YYYY')
								: ''
						}
					/>
					<SettingField
						label="ID document"
						value={
							documentUrl ? (
								<a
									href={documentUrl}
									target="_blank"
									rel="noreferrer"
									className="text-primary underline underline-offset-4"
								>
									View document
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
