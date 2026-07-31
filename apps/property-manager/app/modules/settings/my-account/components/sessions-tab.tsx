import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Lock, LogOut, TriangleAlert } from 'lucide-react'
import {
	AccountBlurb,
	AccountIconTile,
	AccountPanel,
	MutedBadge,
	SuccessBadge,
} from './account-ui'
import { deviceIcon } from './device-icon'
import { useGetSessions } from '~/api/sessions'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'

dayjs.extend(relativeTime)

interface Props {
	onSignOutOne: (session: Session) => void
	onSignOutAll: (otherCount: number) => void
}

export function SessionsTab({ onSignOutOne, onSignOutAll }: Props) {
	const { data: sessions, isLoading, isError, error } = useGetSessions()

	if (isLoading) return <SessionsSkeleton />

	if (isError) {
		return (
			<AccountPanel>
				<p className="text-muted-foreground text-sm">
					{error instanceof Error
						? error.message
						: 'Could not load your sessions.'}
				</p>
			</AccountPanel>
		)
	}

	const list = sessions ?? []
	const others = list.filter((s) => !s.is_current).length

	return (
		<div className="flex flex-col gap-5">
			<AccountPanel>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
					<AccountIconTile icon={Lock} />
					<AccountBlurb
						title={`${list.length} active ${list.length === 1 ? 'session' : 'sessions'}`}
						description="Everywhere you're signed in. If you see something you don't recognise, sign it out and change your password."
					/>
					{others > 0 ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onSignOutAll(others)}
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
				{list.map((session, index) => (
					<SessionRow
						key={session.id}
						session={session}
						last={index === list.length - 1}
						onSignOut={() => onSignOutOne(session)}
					/>
				))}

				{list.length === 0 ? (
					<p className="text-muted-foreground py-3 text-sm">
						No active sessions.
					</p>
				) : null}
			</AccountPanel>

			{list.length === 1 && list[0]?.is_current ? (
				<p className="text-muted-foreground text-center text-sm">
					All other sessions have been signed out.
				</p>
			) : null}
		</div>
	)
}

/** "MacBook Pro · Chrome", falling back to whichever half is known. */
function describeDevice(session: Session) {
	const parts = [session.device_name, session.client_name].filter(Boolean)
	return parts.length ? parts.join(' · ') : 'Unknown device'
}

/**
 * "macOS 15.3 · Accra" — every segment is omitted when absent rather than
 * filled with a placeholder. The backend returns these only when it genuinely
 * knows, and a wrong device is worse than a sparse one.
 */
function describeContext(session: Session) {
	const os = [session.os, session.os_version].filter(Boolean).join(' ')
	const place = [session.location_city, session.location_country]
		.filter(Boolean)
		.join(', ')
	return [os, place].filter(Boolean).join(' · ')
}

function SessionRow({
	session,
	last,
	onSignOut,
}: {
	session: Session
	last: boolean
	onSignOut: () => void
}) {
	const Icon = deviceIcon(session.device_kind)
	const context = describeContext(session)

	return (
		<div
			className={cn(
				'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4',
				last ? '' : 'border-b',
			)}
		>
			<AccountIconTile
				icon={Icon}
				tone={session.is_current ? 'success' : 'muted'}
			/>

			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2.5">
					<span className="truncate text-[15px] font-semibold">
						{describeDevice(session)}
					</span>
					{session.is_current ? <SuccessBadge>This device</SuccessBadge> : null}
					{/* The place is whatever the device claimed, so it is labelled as
					    reported rather than presented as verified. */}
					{session.location_source === 'CLIENT' && session.location_city ? (
						<MutedBadge>Reported by device</MutedBadge>
					) : null}
				</div>

				{context ? (
					<div className="text-muted-foreground mt-1 text-sm">{context}</div>
				) : null}

				<div className="text-muted-foreground/70 mt-1 font-mono text-xs">
					{[
						session.ip_address,
						`Signed in ${dayjs(session.signed_in_at).fromNow()}`,
					]
						.filter(Boolean)
						.join(' · ')}
				</div>
			</div>

			{session.is_current ? (
				<span className="text-muted-foreground shrink-0 text-sm">
					Current session
				</span>
			) : (
				<Button
					variant="outline"
					size="sm"
					onClick={onSignOut}
					className="text-primary border-primary/30 hover:text-primary hover:bg-primary/10 shrink-0"
				>
					<LogOut /> Sign out
				</Button>
			)}
		</div>
	)
}

function SessionsSkeleton() {
	return (
		<div className="flex flex-col gap-5">
			<AccountPanel>
				<div className="flex items-center gap-4">
					<Skeleton className="size-11 rounded-xl" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-3 w-full max-w-md" />
					</div>
				</div>
			</AccountPanel>

			<AccountPanel caption="Signed-in devices" className="pb-2">
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						className={cn(
							'flex items-center gap-4 py-4',
							i === 2 ? '' : 'border-b',
						)}
					>
						<Skeleton className="size-11 rounded-xl" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-52" />
							<Skeleton className="h-3 w-40" />
							<Skeleton className="h-3 w-32" />
						</div>
						<Skeleton className="h-8 w-24" />
					</div>
				))}
			</AccountPanel>
		</div>
	)
}
