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
import { cn } from '~/lib/utils'

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

interface ActivityTabProps {
	requestId: string
}

export function ActivityTab({ requestId }: ActivityTabProps) {
	const { data, isLoading, isError, refetch } =
		useGetMaintenanceRequestActivityLogs(requestId, {
			pagination: { page: 1, per: 100 },
			filters: {},
		})

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
							{log.description && (
								<p className="text-muted-foreground text-sm">
									{log.description}
								</p>
							)}
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
