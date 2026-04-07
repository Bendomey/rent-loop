import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import {
	AlertCircle,
	CheckCircle2,
	MessageSquare,
	RefreshCw,
	UserCheck,
	Wrench,
} from 'lucide-react'
import { useGetMaintenanceRequestActivityLogs } from '~/api/maintenance-requests'
import { TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'

const ACTION_CONFIG: Record<
	MaintenanceRequestActivityLog['action'],
	{ icon: React.ElementType; label: string; iconClass: string }
> = {
	CREATED: {
		icon: Wrench,
		label: 'Request created',
		iconClass: 'text-zinc-500',
	},
	STATUS_CHANGED: {
		icon: RefreshCw,
		label: 'Status changed',
		iconClass: 'text-blue-500',
	},
	WORKER_ASSIGNED: {
		icon: UserCheck,
		label: 'Worker assigned',
		iconClass: 'text-amber-500',
	},
	MANAGER_ASSIGNED: {
		icon: UserCheck,
		label: 'Manager assigned',
		iconClass: 'text-purple-500',
	},
	RESOLVED: {
		icon: CheckCircle2,
		label: 'Resolved',
		iconClass: 'text-emerald-500',
	},
	CANCELED: {
		icon: AlertCircle,
		label: 'Canceled',
		iconClass: 'text-red-500',
	},
	NOTE: {
		icon: MessageSquare,
		label: 'Note added',
		iconClass: 'text-zinc-500',
	},
}

const STATUS_LABELS: Record<string, string> = {
	NEW: 'New',
	IN_PROGRESS: 'In Progress',
	IN_REVIEW: 'In Review',
	RESOLVED: 'Resolved',
	CANCELED: 'Canceled',
}

function UserChip({ name, photoUrl }: { name: string; photoUrl?: string }) {
	const initials = name
		.split(' ')
		.map((p) => p[0])
		.join('')
		.slice(0, 2)
		.toUpperCase()

	return (
		<span className="inline-flex items-center gap-1.5">
			{photoUrl ? (
				<Avatar>
					<AvatarImage
						src={photoUrl}
						alt={name}
						className="h-4 w-auto rounded-full"
					/>
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
			) : (
				<span className="bg-muted text-foreground flex items-center justify-center rounded-full p-1.5 text-xs font-medium">
					{initials}
				</span>
			)}
			<span className="font-medium">{name}</span>
		</span>
	)
}

function ActivityDetail({
	log,
	mr,
}: {
	log: MaintenanceRequestActivityLog
	mr: MaintenanceRequest
}) {
	if (log.action === 'CREATED') {
		const byTenant = !!mr.created_by_tenant_id
		const byManager = !!mr.created_by_client_user_id

		if (byTenant && byManager) {
			return (
				<p className="text-muted-foreground text-sm">
					Created by{' '}
					{log.performed_by_client_user ? (
						<UserChip
							name={safeString(log.performed_by_client_user?.user?.name)}
						/>
					) : (
						'a manager'
					)}{' '}
					on behalf of the tenant
				</p>
			)
		}
		if (byManager) {
			return (
				<p className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
					Created by{' '}
					{log.performed_by_client_user ? (
						<UserChip
							name={safeString(log.performed_by_client_user?.user?.name)}
						/>
					) : (
						'a manager'
					)}
				</p>
			)
		}

		return (
			<p className="text-muted-foreground text-sm">
				Submitted by{' '}
				{mr.created_by_tenant ? (
					<UserChip
						name={`${mr.created_by_tenant?.first_name} ${mr.created_by_tenant?.last_name}`}
						photoUrl={mr.created_by_tenant?.profile_photo_url ?? undefined}
					/>
				) : (
					'a tenant'
				)}
			</p>
		)
	}

	if (log.action === 'STATUS_CHANGED') {
		const meta = log.metadata as { from?: string; to?: string } | null
		if (meta?.from && meta?.to) {
			return (
				<p className="text-muted-foreground text-sm">
					Changed from{' '}
					<span className="text-foreground font-medium">
						{STATUS_LABELS[meta.from] ?? meta.from}
					</span>{' '}
					to{' '}
					<span className="text-foreground font-medium">
						{STATUS_LABELS[meta.to] ?? meta.to}
					</span>
				</p>
			)
		}
		if (log.description) {
			return <p className="text-muted-foreground text-sm">{log.description}</p>
		}
		return null
	}

	if (log.action === 'WORKER_ASSIGNED') {
		const worker = mr.assigned_worker
		const assignedToSelf =
			!!log.performed_by_client_user_id &&
			log.performed_by_client_user_id === mr.assigned_worker_id
		return (
			<p className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
				Assigned to{' '}
				{worker ? (
					<UserChip name={safeString(worker?.user?.name)} />
				) : (
					'a worker'
				)}
				{assignedToSelf && (
					<span className="text-muted-foreground italic">
						(assigned to themselves)
					</span>
				)}
			</p>
		)
	}

	if (log.action === 'MANAGER_ASSIGNED') {
		const manager = mr.assigned_manager
		const assignedToSelf =
			!!log.performed_by_client_user_id &&
			log.performed_by_client_user_id === mr.assigned_manager_id
		return (
			<p className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
				Assigned to{' '}
				{manager ? (
					<UserChip name={safeString(manager?.user?.name)} />
				) : (
					'a manager'
				)}
				{assignedToSelf && (
					<span className="text-muted-foreground italic">
						(assigned to themselves)
					</span>
				)}
			</p>
		)
	}

	if (log.description) {
		return <p className="text-muted-foreground text-sm">{log.description}</p>
	}

	return null
}

interface ActivityTabProps {
	requestId: string
	propertyId: string
	mr: MaintenanceRequest
}

export function ActivityTab({ requestId, propertyId, mr }: ActivityTabProps) {
	const { clientUser } = useClient()
	const { data, isLoading, isError, refetch } =
		useGetMaintenanceRequestActivityLogs(
			safeString(clientUser?.client_id),
			propertyId,
			requestId,
			{
				pagination: { page: 1, per: 100 },
				filters: {},
				populate: [
					'PerformedByClientUser',
					'PerformedByClientUser.User',
					'PerformedByTenant',
				],
			},
		)

	const logs = data?.rows ?? []

	if (isError) {
		return (
			<div className="flex flex-col items-center gap-2 py-8">
				<AlertCircle className="text-destructive h-5 w-5" />
				<TypographyMuted className="text-sm">
					Failed to load activity.
				</TypographyMuted>
				<button
					onClick={() => void refetch()}
					className="text-primary text-xs underline underline-offset-2"
				>
					Try again
				</button>
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className="flex flex-col gap-3 py-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="flex items-start gap-3">
						<div className="bg-muted mt-0.5 h-7 w-7 shrink-0 animate-pulse rounded-full" />
						<div className="flex flex-1 flex-col gap-1.5">
							<div className="bg-muted h-3 w-32 animate-pulse rounded" />
							<div className="bg-muted h-3 w-48 animate-pulse rounded" />
						</div>
					</div>
				))}
			</div>
		)
	}

	if (!logs.length) {
		return (
			<TypographyMuted className="py-6 text-center text-sm">
				No activity yet.
			</TypographyMuted>
		)
	}

	return (
		<div className="flex flex-col gap-1 py-2">
			{logs.map((log, index) => {
				const config = ACTION_CONFIG[log.action]
				const Icon = config.icon
				const isLast = index === logs.length - 1

				return (
					<div key={log.id} className="flex items-start gap-3">
						<div className="flex flex-col items-center">
							<div
								className={cn(
									'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
									'bg-muted',
								)}
							>
								<Icon className={cn('h-3.5 w-3.5', config.iconClass)} />
							</div>
							{!isLast && (
								<div className="bg-border mt-1 h-full min-h-[20px] w-px" />
							)}
						</div>
						<div className="flex flex-col gap-0.5 pb-4">
							<p className="text-sm font-medium">{config.label}</p>
							<ActivityDetail log={log} mr={mr} />
							<TypographyMuted className="text-xs">
								{localizedDayjs(log.created_at).format(
									'MMM D, YYYY [at] h:mm A',
								)}
							</TypographyMuted>
						</div>
					</div>
				)
			})}
		</div>
	)
}
