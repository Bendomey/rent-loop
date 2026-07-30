import { Pencil, ShieldCheck, TriangleAlert } from 'lucide-react'
import { PLACEHOLDER_PASSWORD_CHANGED } from '../placeholder-data'
import {
	AccountBlurb,
	AccountIconTile,
	AccountPanel,
	AccountRow,
	MutedBadge,
	comingSoon,
} from './account-ui'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'

interface Props {
	onChangePassword: () => void
}

export function SecurityTab({ onChangePassword }: Props) {
	return (
		<div className="flex flex-col gap-5">
			<AccountPanel caption="Sign-in password" className="pb-1">
				<AccountRow
					label="Password"
					sub={`Last changed ${PLACEHOLDER_PASSWORD_CHANGED}`}
					value="••••••••••"
					action={
						<Button size="sm" onClick={onChangePassword}>
							<Pencil /> Change password
						</Button>
					}
					last
				/>
			</AccountPanel>

			<AccountPanel caption="Two-factor authentication">
				<div className="flex items-center gap-4">
					<AccountIconTile icon={ShieldCheck} />
					<AccountBlurb
						title="Authenticator app"
						description="Require a code from your phone in addition to your password when signing in."
						tone={<MutedBadge>Coming soon</MutedBadge>}
					/>
					{/* Stays off until 2FA ships — the switch never changes state. */}
					<Switch
						checked={false}
						onCheckedChange={comingSoon('Two-factor authentication')}
						aria-label="Enable two-factor authentication"
					/>
				</div>
			</AccountPanel>

			<AccountPanel
				caption="Danger zone"
				className="border-primary/25 bg-primary/5"
			>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
					<AccountBlurb
						title="Delete my account"
						description="Permanently closes your account and removes you from this workspace. Properties you own must be transferred first."
						tone={<MutedBadge>Coming soon</MutedBadge>}
					/>
					<Button
						variant="outline"
						size="sm"
						onClick={comingSoon('Account deletion')}
						className="text-primary border-primary/30 hover:text-primary hover:bg-primary/10 shrink-0"
					>
						<TriangleAlert /> Delete account
					</Button>
				</div>
			</AccountPanel>
		</div>
	)
}
