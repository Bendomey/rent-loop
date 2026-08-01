import {
	ArrowLeftRight,
	Building2,
	CircleUserRound,
	Pencil,
} from 'lucide-react'
import { getSubTypeLabel } from './use-client-mutation'
import {
	MutedBadge,
	SettingsPanel,
	SettingsRow,
} from '~/components/blocks/settings-ui'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { safeString } from '~/lib/strings'

interface Props {
	client: Client
	onChangeName: () => void
	onChangeBusinessType: () => void
	onSwitchType: () => void
}

export function ProfileTab({
	client,
	onChangeName,
	onChangeBusinessType,
	onSwitchType,
}: Props) {
	const isCompany = client.type === 'COMPANY'
	const OwnershipIcon = isCompany ? Building2 : CircleUserRound

	return (
		<div className="flex flex-col gap-5">
			<SettingsPanel caption="Account profile" className="pb-1">
				<SettingsRow
					label="Account name"
					sub="Shown on invoices, leases and tenant-facing pages."
					value={safeString(client.name)}
					action={
						<Button variant="outline" size="sm" onClick={onChangeName}>
							<Pencil /> Change name
						</Button>
					}
				/>

				<SettingsRow
					label="Ownership type"
					sub="Whether this account bills as a company or a person."
					value={
						<Badge variant="outline" className="gap-1.5 px-3 py-1 text-sm">
							<OwnershipIcon className="size-3.5" />
							{isCompany ? 'Company' : 'Individual'}
						</Badge>
					}
					action={
						<Button variant="outline" size="sm" onClick={onSwitchType}>
							<ArrowLeftRight /> Switch to{' '}
							{isCompany ? 'Individual' : 'Company'}
						</Button>
					}
					last={!isCompany}
				/>

				{isCompany ? (
					<SettingsRow
						label="Business type"
						sub="How your company is described on tenant-facing pages."
						value={<MutedBadge>{getSubTypeLabel(client.sub_type)}</MutedBadge>}
						action={
							<Button
								variant="outline"
								size="sm"
								onClick={onChangeBusinessType}
							>
								<Pencil /> Change
							</Button>
						}
						last
					/>
				) : null}
			</SettingsPanel>
		</div>
	)
}
