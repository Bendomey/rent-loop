import { Lock, LogOut, TriangleAlert } from 'lucide-react'
import type { AccountSession } from '../placeholder-data'
import {
	AccountBlurb,
	AccountIconTile,
	AccountPanel,
	SuccessBadge,
} from './account-ui'
import { deviceIcon } from './device-icon'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface Props {
	sessions: AccountSession[]
	onSignOutOne: (session: AccountSession) => void
	onSignOutAll: () => void
}

export function SessionsTab({ sessions, onSignOutOne, onSignOutAll }: Props) {
	const others = sessions.filter((s) => !s.current).length

	return (
		<div className="flex flex-col gap-5">
			<AccountPanel>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
					<AccountIconTile icon={Lock} />
					<AccountBlurb
						title={`${sessions.length} active ${sessions.length === 1 ? 'session' : 'sessions'}`}
						description="Everywhere you're signed in. If you see something you don't recognise, sign it out and change your password."
					/>
					{others > 0 ? (
						<Button
							variant="outline"
							size="sm"
							onClick={onSignOutAll}
							className="text-primary border-primary/30 hover:text-primary hover:bg-primary/10 shrink-0"
						>
							<TriangleAlert /> Sign out all others ({others})
						</Button>
					) : (
						<span className="text-muted-foreground shrink-0 text-sm">
							No other sessions
						</span>
					)}
				</div>
			</AccountPanel>

			<AccountPanel caption="Signed-in devices" className="pb-2">
				{sessions.map((session, index) => (
					<div
						key={session.id}
						className={cn(
							'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4',
							index === sessions.length - 1 ? '' : 'border-b',
						)}
					>
						<AccountIconTile
							icon={deviceIcon(session.kind)}
							tone={session.current ? 'success' : 'muted'}
						/>

						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-2.5">
								<span className="truncate text-[15px] font-semibold">
									{session.device}
								</span>
								{session.current ? (
									<SuccessBadge>This device</SuccessBadge>
								) : null}
							</div>
							<div className="text-muted-foreground mt-1 text-sm">
								{session.os} · {session.where}
							</div>
							<div className="text-muted-foreground/70 mt-1 font-mono text-xs">
								{session.ip} · {session.last}
							</div>
						</div>

						{session.current ? (
							<span className="text-muted-foreground shrink-0 text-sm">
								Current session
							</span>
						) : (
							<Button
								variant="outline"
								size="sm"
								onClick={() => onSignOutOne(session)}
								className="text-primary border-primary/30 hover:text-primary hover:bg-primary/10 shrink-0"
							>
								<LogOut /> Sign out
							</Button>
						)}
					</div>
				))}

				{sessions.length === 1 ? (
					<p className="text-muted-foreground py-3 text-sm">
						All other sessions have been signed out.
					</p>
				) : null}
			</AccountPanel>
		</div>
	)
}
