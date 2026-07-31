import { useQueryClient } from '@tanstack/react-query'
import { LogOut, TriangleAlert } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import { AccountIconTile } from './account-ui'
import { deviceIcon } from './device-icon'
import { useRevokeOtherSessions, useRevokeSession } from '~/api/sessions'
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import { getErrorMessage } from '~/lib/error-messages'

/** "MacBook Pro · Chrome", or a neutral fallback when neither half is known. */
function describeDevice(session?: Session) {
	const parts = [session?.device_name, session?.client_name].filter(Boolean)
	return parts.length ? parts.join(' · ') : 'Unknown device'
}

interface SignOutOneProps {
	session?: Session
	setSession: Dispatch<SetStateAction<Session | undefined>>
}

export function SignOutSessionModal({ session, setSession }: SignOutOneProps) {
	const queryClient = useQueryClient()
	const { mutate, isPending } = useRevokeSession()

	const confirm = () => {
		if (!session) return
		mutate(session.id, {
			onError: (e: unknown) => {
				if (e instanceof Error) {
					toast.error(
						getErrorMessage(e.message, 'Failed to sign out that device.'),
					)
				}
			},
			onSuccess: () => {
				toast.success('Device signed out')
				void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSIONS] })
				setSession(undefined)
			},
		})
	}

	return (
		<AlertDialog
			open={Boolean(session)}
			onOpenChange={(open) => {
				// Don't let a dismiss land mid-request and leave the list stale.
				if (!open && !isPending) setSession(undefined)
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
							{describeDevice(session)}
						</span>
						. Signing back in needs the password again.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{session ? (
					<div className="flex items-center gap-3.5 rounded-xl border p-3.5">
						<AccountIconTile icon={deviceIcon(session.device_kind)} />
						<div className="min-w-0">
							<div className="truncate text-sm font-semibold">
								{describeDevice(session)}
							</div>
							<div className="text-muted-foreground mt-0.5 text-[13px]">
								{[session.location_city, session.ip_address]
									.filter(Boolean)
									.join(' · ')}
							</div>
						</div>
					</div>
				) : null}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<Button
						onClick={confirm}
						disabled={isPending}
						className="bg-primary hover:bg-primary/90 text-white"
					>
						{isPending ? <Spinner /> : null}
						Sign out device
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

interface SignOutAllProps {
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	count: number
}

export function SignOutAllSessionsModal({
	opened,
	setOpened,
	count,
}: SignOutAllProps) {
	const queryClient = useQueryClient()
	const { mutate, isPending } = useRevokeOtherSessions()

	const confirm = () => {
		mutate(undefined, {
			onError: (e: unknown) => {
				if (e instanceof Error) {
					toast.error(
						getErrorMessage(e.message, 'Failed to sign out other sessions.'),
					)
				}
			},
			onSuccess: (data) => {
				// The backend reports how many it actually ended, which can differ
				// from what the list showed if one expired in between.
				const revoked = data?.revoked_count ?? count
				toast.success(
					`Signed out ${revoked} other ${revoked === 1 ? 'session' : 'sessions'}`,
				)
				void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSIONS] })
				setOpened(false)
			},
		})
	}

	return (
		<AlertDialog
			open={opened}
			onOpenChange={(open) => {
				if (!open && !isPending) setOpened(false)
			}}
		>
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
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<Button
						onClick={confirm}
						disabled={isPending}
						className="bg-primary hover:bg-primary/90 text-white"
					>
						{isPending ? <Spinner /> : null}
						Sign out all others
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
