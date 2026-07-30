import { LogOut, TriangleAlert } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { AccountSession } from '../placeholder-data'
import { AccountIconTile } from './account-ui'
import { deviceIcon } from './device-icon'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'

interface SignOutOneProps {
	session?: AccountSession
	setSession: Dispatch<SetStateAction<AccountSession | undefined>>
	onConfirm: (session: AccountSession) => void
}

/**
 * UI only — revoking a session is not wired to the API yet; confirming
 * just drops the row from the local list.
 */
export function SignOutSessionModal({
	session,
	setSession,
	onConfirm,
}: SignOutOneProps) {
	return (
		<AlertDialog
			open={Boolean(session)}
			onOpenChange={(open) => {
				if (!open) setSession(undefined)
			}}
		>
			<AlertDialogContent className="sm:max-w-md">
				<AlertDialogHeader>
					<div className="bg-primary/10 text-primary mb-2 flex size-12 items-center justify-center rounded-xl">
						<LogOut className="size-5" />
					</div>
					<AlertDialogTitle>Sign out this device?</AlertDialogTitle>
					<AlertDialogDescription>
						We&rsquo;ll end the session on{' '}
						<span className="text-foreground font-semibold">
							{session?.device}
						</span>
						. Signing back in needs the password again.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{session ? (
					<div className="flex items-center gap-3.5 rounded-xl border p-3.5">
						<AccountIconTile icon={deviceIcon(session.kind)} />
						<div className="min-w-0">
							<div className="truncate text-sm font-semibold">
								{session.device}
							</div>
							<div className="text-muted-foreground mt-0.5 text-[13px]">
								{session.where} · {session.last}
							</div>
						</div>
					</div>
				) : null}

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						className="bg-primary hover:bg-primary/90 text-white"
						onClick={() => {
							if (session) onConfirm(session)
						}}
					>
						Sign out device
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

interface SignOutAllProps {
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	count: number
	onConfirm: () => void
}

/**
 * UI only — revoking every other session is not wired to the API yet.
 */
export function SignOutAllSessionsModal({
	opened,
	setOpened,
	count,
	onConfirm,
}: SignOutAllProps) {
	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="sm:max-w-md">
				<AlertDialogHeader>
					<div className="bg-primary/10 text-primary mb-2 flex size-12 items-center justify-center rounded-xl">
						<TriangleAlert className="size-5" />
					</div>
					<AlertDialogTitle>
						Sign out {count} other {count === 1 ? 'session' : 'sessions'}?
					</AlertDialogTitle>
					<AlertDialogDescription>
						Every device except this one is signed out. This device stays signed
						in.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="rounded-xl bg-amber-500/10 px-3.5 py-3 text-[13px] leading-relaxed text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
					If you think someone else has access, change your password too —
					signing out alone won&rsquo;t stop them logging back in.
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						className="bg-primary hover:bg-primary/90 text-white"
						onClick={onConfirm}
					>
						Sign out all others
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
