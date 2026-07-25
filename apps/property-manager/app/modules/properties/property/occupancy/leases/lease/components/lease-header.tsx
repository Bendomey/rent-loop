import { AlertTriangle, CheckIcon, Download, RefreshCw } from 'lucide-react'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { getLeaseStatusClass, getLeaseStatusLabel } from '~/lib/lease.utils'

interface LeaseHeaderProps {
	lease: Lease
	subtitle: string
	isPending: boolean
	isTerminable: boolean
	onStartLease: () => void
}

export function LeaseHeader({
	lease,
	subtitle,
	isPending,
	isTerminable,
	onStartLease,
}: LeaseHeaderProps) {
	return (
		<div className="flex flex-wrap items-start justify-between gap-4">
			<div>
				<div className="flex items-center gap-3">
					<h1 className="font-mono text-2xl font-semibold tracking-tight">
						{lease.code}
					</h1>
					<Badge
						variant="outline"
						className={`px-2.5 py-0.5 text-xs ${getLeaseStatusClass(lease.status)}`}
					>
						{getLeaseStatusLabel(lease.status)}
					</Badge>
				</div>
				<p className="text-muted-foreground mt-1.5 text-sm">{subtitle}</p>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				{lease.lease_agreement_document_url && (
					<Button variant="outline" size="sm" asChild>
						<a
							href={lease.lease_agreement_document_url}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Download className="size-4" />
							Download PDF
						</a>
					</Button>
				)}

				{isPending && (
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Button
							variant="default"
							size="sm"
							className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-900 dark:hover:bg-teal-800"
							onClick={onStartLease}
						>
							Start Lease
							<CheckIcon className="size-4" />
						</Button>
					</PropertyPermissionGuard>
				)}

				{isTerminable && (
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Tooltip>
							<TooltipTrigger asChild>
								<span tabIndex={0}>
									<Button variant="outline" size="sm" disabled>
										<RefreshCw className="size-4" />
										Renew
									</Button>
								</span>
							</TooltipTrigger>
							<TooltipContent>Coming soon</TooltipContent>
						</Tooltip>
					</PropertyPermissionGuard>
				)}

				{isTerminable && (
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Tooltip>
							<TooltipTrigger asChild>
								<span tabIndex={0}>
									<Button variant="destructive" size="sm" disabled>
										<AlertTriangle className="size-4" />
										Terminate Lease
									</Button>
								</span>
							</TooltipTrigger>
							<TooltipContent>Coming soon</TooltipContent>
						</Tooltip>
					</PropertyPermissionGuard>
				)}
			</div>
		</div>
	)
}
