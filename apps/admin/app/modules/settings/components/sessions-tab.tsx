import { Laptop, Lock, TriangleAlert } from 'lucide-react'
import {
	comingSoon,
	MutedBadge,
	SettingsBlurb,
	SettingsIconTile,
	SettingsPanel,
	SuccessBadge,
} from './settings-ui'
import { Button } from '~/components/ui/button'

export function SessionsTab() {
	return (
		<div className="flex flex-col gap-5">
			<SettingsPanel>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
					<SettingsIconTile icon={Lock} />
					<SettingsBlurb
						title="Signed-in devices"
						description="Everywhere you're signed in. If you see something you don't recognise, sign it out and change your password."
						tone={<MutedBadge>Coming soon</MutedBadge>}
					/>
					<Button
						variant="outline"
						size="sm"
						onClick={comingSoon('Session management')}
						className="text-primary border-primary/30 hover:text-primary hover:bg-primary/10 shrink-0"
					>
						<TriangleAlert /> Sign out all others
					</Button>
				</div>
			</SettingsPanel>

			<SettingsPanel caption="Signed-in devices" className="pb-2">
				<div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
					<SettingsIconTile icon={Laptop} tone="success" />
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2.5">
							<span className="truncate text-[15px] font-semibold">
								This device
							</span>
							<SuccessBadge>Current session</SuccessBadge>
						</div>
						<div className="text-muted-foreground mt-1 text-sm">
							The browser you&rsquo;re using right now.
						</div>
					</div>
					<span className="text-muted-foreground shrink-0 text-sm">
						Current session
					</span>
				</div>
			</SettingsPanel>

			<p className="text-muted-foreground text-center text-sm">
				A full list of your active sessions will appear here once session
				management ships.
			</p>
		</div>
	)
}
