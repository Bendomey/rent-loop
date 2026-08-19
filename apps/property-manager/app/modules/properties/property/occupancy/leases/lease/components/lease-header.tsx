import { AlertTriangle, CheckIcon, Download, RotateCw } from 'lucide-react'
import { Link } from 'react-router'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { localizedDayjs } from '~/lib/date'
import {
	getLeaseStatusClass,
	getLeaseStatusLabel,
	leaseExpiringInDays,
} from '~/lib/lease.utils'

interface LeaseHeaderProps {
	lease: Lease
	subtitle: string
	isPending: boolean
	isTerminable: boolean
	onStartLease: () => void
	/** Where the renewal wizard lives for this lease. */
	renewHref: string
	/** Why renewing is off, or null when it is available. */
	renewBlockedReason: Nullable<string>
}

export function LeaseHeader({
	lease,
	subtitle,
	isPending,
	isTerminable,
	onStartLease,
	renewHref,
	renewBlockedReason,
}: LeaseHeaderProps) {
	const expiringInDays = leaseExpiringInDays(lease)

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
					{expiringInDays !== null && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Badge
									variant="outline"
									className="border-transparent bg-amber-500 px-2.5 py-0.5 text-xs text-white dark:bg-amber-600"
								>
									{expiringInDays === 0
										? 'Ends today'
										: `Ends in ${expiringInDays} ${expiringInDays === 1 ? 'day' : 'days'}`}
								</Badge>
							</TooltipTrigger>
							<TooltipContent>
								Move-out {localizedDayjs(lease.move_out_date).format('LL')}
							</TooltipContent>
						</Tooltip>
					)}
				</div>
				<p className="text-muted-foreground mt-1.5 text-sm">{subtitle}</p>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<PropertyPermissionGuard roles={['MANAGER']}>
					{renewBlockedReason ? (
						<Tooltip>
							{/*
							 * A disabled button fires no pointer events, so the
							 * tooltip needs a live wrapper — otherwise the reason
							 * the button is off is the one thing you cannot read.
							 */}
							<TooltipTrigger asChild>
								<span tabIndex={0}>
									<Button variant="outline" size="sm" disabled>
										<RotateCw className="size-4" />
										Renew
									</Button>
								</span>
							</TooltipTrigger>
							<TooltipContent>{renewBlockedReason}</TooltipContent>
						</Tooltip>
					) : (
						<Button variant="outline" size="sm" asChild>
							<Link to={renewHref}>
								<RotateCw className="size-4" />
								Renew
							</Link>
						</Button>
					)}
				</PropertyPermissionGuard>

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
