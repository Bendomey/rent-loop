import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import {
	AlertCircle,
	ArrowLeftRight,
	CheckCircle2,
	MessageSquare,
	Plus,
	User,
} from 'lucide-react'
import { useGetMaintenanceRequestActivityLogs } from '~/api/maintenance-requests'
import { TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'

// Each entry carries its own tinted disc, so the timeline reads by colour
// before it reads by label.
const ACTION_CONFIG: Record<
	MaintenanceRequestActivityLog['action'],
	{ icon: React.ElementType; label: string; iconClass: string }
> = {
	CREATED: {
		icon: Plus,
		label: 'Request created',
		iconClass:
			'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
	},
	STATUS_CHANGED: {
		icon: ArrowLeftRight,
		label: 'Status changed',
		iconClass:
			'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
	},
	WORKER_ASSIGNED: {
		icon: User,
		label: 'Worker assigned',
		iconClass:
			'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300',
	},
	MANAGER_ASSIGNED: {
		icon: User,
		label: 'Manager assigned',
		iconClass:
			'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
	},
	RESOLVED: {
		icon: CheckCircle2,
		label: 'Resolved',
		iconClass:
			'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
	},
	CANCELED: {
		icon: AlertCircle,
		label: 'Canceled',
		iconClass: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
	},
	NOTE: {
		icon: MessageSquare,
		label: 'Note added',
		iconClass: 'bg-muted text-muted-foreground',
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
				<p className="text-muted-foreground flex flex-wrap items-center gap-1 text-[15px]">
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
			return (
				<p className="text-muted-foreground text-[15px]">{log.description}</p>
			)
		}
		return null
	}

	if (log.action === 'WORKER_ASSIGNED') {
		const worker = mr.assigned_worker
		const assignedToSelf =
			!!log.performed_by_client_user_id &&
			log.performed_by_client_user_id === mr.assigned_worker_id
		return (
			<p className="text-muted-foreground flex flex-wrap items-center gap-1 text-[15px]">
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
			<p className="text-muted-foreground flex flex-wrap items-center gap-1 text-[15px]">
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
		<div className="flex flex-col py-2">
			{logs.map((log, index) => {
				const config = ACTION_CONFIG[log.action]
				const Icon = config.icon
				const isLast = index === logs.length - 1

				return (
					<div key={log.id} className="flex items-stretch gap-4">
						<div className="flex flex-col items-center">
							<div
								className={cn(
									'flex size-10 shrink-0 items-center justify-center rounded-full',
									config.iconClass,
								)}
							>
								<Icon className="size-[19px]" />
							</div>
							{!isLast && (
								<div className="bg-border my-1 min-h-4 w-px flex-1" />
							)}
						</div>
						<div className="flex flex-col gap-1 pb-6">
							<p className="text-base font-bold">{config.label}</p>
							<ActivityDetail log={log} mr={mr} />
							<TypographyMuted className="text-sm">
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
