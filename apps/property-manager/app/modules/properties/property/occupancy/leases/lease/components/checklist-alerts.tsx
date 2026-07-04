import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	CircleIcon,
	XCircleIcon,
} from 'lucide-react'
import { useState } from 'react'
import { ChecklistModal } from './checklist-modal'
import { CreateChecklistDialog } from './create-checklist-dialog'
import { useGetLeaseChecklists } from '~/api/lease-checklists'
import { useHasPropertyPermissions } from '~/components/permissions/use-has-role'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import {
	getChecklistTypeLabel,
	isChecklistHandled,
	shouldShowCheckInAlert,
	shouldShowLeaseEndingAlert,
} from '~/lib/lease-checklist.utils'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface Props {
	lease: Lease
	canEdit: boolean
	propertyId: string
}

export function ChecklistAlerts({ lease, canEdit, propertyId }: Props) {
	const { clientUser } = useClient()
	const { data, isSuccess } = useGetLeaseChecklists(
		safeString(clientUser?.client_id),
		propertyId,
		lease.id,
		{
			populate: ['Items', 'Acknowledgments'],
		},
	)
	const { hasPermissions: canCreateReport } = useHasPropertyPermissions({
		roles: ['MANAGER'],
	})
	const [createType, setCreateType] = useState<LeaseChecklistType | null>(null)
	const [viewChecklistId, setViewChecklistId] = useState<string | null>(null)

	if (!isSuccess || canCreateReport === 'UNAUTHORIZED') return null

	const checklists = data?.rows ?? []
	const viewChecklist = checklists.find((c) => c.id === viewChecklistId) ?? null

	const showCheckIn = shouldShowCheckInAlert(lease, checklists)
	const showLeaseEnding = shouldShowLeaseEndingAlert(lease)
	const disputedChecklists = checklists.filter((c) => c.status === 'DISPUTED')

	const draftCheckIn = checklists.find(
		(c) => c.type === 'CHECK_IN' && c.status === 'DRAFT',
	)
	const checkOut = checklists.find((c) => c.type === 'CHECK_OUT')
	const checkOutHandled = !!checkOut && isChecklistHandled(checkOut.status)
	const draftCheckOut = checkOut?.status === 'DRAFT' ? checkOut : undefined

	if (!showCheckIn && !showLeaseEnding && disputedChecklists.length === 0) {
		return null
	}

	return (
		<>
			<div className="space-y-2 px-5 pt-5">
				{disputedChecklists.map((checklist) => {
					const latestDispute = [...(checklist.acknowledgments ?? [])]
						.reverse()
						.find((a) => a.action === 'DISPUTED')
					return (
						<Alert
							key={checklist.id}
							className="border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-50"
						>
							<XCircleIcon className="size-4 text-rose-600 dark:text-rose-400" />
							<AlertTitle className="text-sm font-semibold">
								Tenant disputed the {getChecklistTypeLabel(checklist.type)}
							</AlertTitle>
							<AlertDescription className="flex items-center justify-between gap-3">
								<span className="text-xs">
									{latestDispute?.comment
										? `Note: ${latestDispute.comment}`
										: 'The tenant has raised concerns about this report. Review their feedback, update the items, and resubmit.'}
								</span>
								<Button
									size="sm"
									variant="outline"
									className="shrink-0 border-rose-400 bg-transparent text-rose-900 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-100 dark:hover:bg-rose-900"
									onClick={() => setViewChecklistId(checklist.id)}
								>
									Review
								</Button>
							</AlertDescription>
						</Alert>
					)
				})}

				{showCheckIn && (
					<Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
						<AlertTriangleIcon className="size-4 text-amber-600 dark:text-amber-400" />
						<AlertTitle className="text-sm font-semibold">
							Move-In Report not completed
						</AlertTitle>
						<AlertDescription className="flex items-center justify-between gap-3">
							<span className="text-xs">
								Documenting the property's condition at move-in protects you
								against future disputes. We recommend doing this within the
								first payment period.
							</span>
							<Button
								size="sm"
								variant="outline"
								className="shrink-0 border-amber-400 bg-transparent text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-900"
								onClick={() =>
									draftCheckIn
										? setViewChecklistId(draftCheckIn.id)
										: setCreateType('CHECK_IN')
								}
							>
								{draftCheckIn ? 'Complete Report' : 'Create Report'}
							</Button>
						</AlertDescription>
					</Alert>
				)}

				{showLeaseEnding && (
					<Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
						<AlertTriangleIcon className="size-4 text-amber-600 dark:text-amber-400" />
						<AlertTitle className="text-sm font-semibold">
							Lease Ending Soon
						</AlertTitle>
						<AlertDescription className="w-full space-y-2">
							<span className="text-xs">
								This lease is approaching its end date. Wrap up the Move-Out
								Report and decide whether to renew.
							</span>
							<div className="w-full space-y-1.5">
								<div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30">
									<div className="flex items-center gap-2">
										{checkOutHandled ? (
											<CheckCircle2Icon className="size-4 shrink-0 text-teal-600 dark:text-teal-400" />
										) : (
											<CircleIcon className="size-4 shrink-0 text-amber-500" />
										)}
										<span className="text-xs font-medium">Move-Out Report</span>
									</div>
									{!checkOutHandled && (
										<Button
											size="sm"
											variant="outline"
											className="shrink-0 border-amber-400 bg-transparent text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-900"
											onClick={() =>
												draftCheckOut
													? setViewChecklistId(draftCheckOut.id)
													: setCreateType('CHECK_OUT')
											}
										>
											{draftCheckOut ? 'Complete Report' : 'Create Report'}
										</Button>
									)}
								</div>

								<div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-100/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/30">
									<div className="flex items-center gap-2">
										<CircleIcon className="size-4 shrink-0 text-amber-500" />
										<span className="text-xs font-medium">Renew Lease</span>
									</div>
									<Tooltip>
										<TooltipTrigger asChild>
											<span tabIndex={0} className="shrink-0">
												<Button
													size="sm"
													variant="outline"
													disabled
													className="border-amber-400 bg-transparent text-amber-900 dark:border-amber-700 dark:text-amber-100"
												>
													Renew Lease
												</Button>
											</span>
										</TooltipTrigger>
										<TooltipContent>Coming soon</TooltipContent>
									</Tooltip>
								</div>
							</div>
						</AlertDescription>
					</Alert>
				)}
			</div>

			{createType && (
				<CreateChecklistDialog
					leaseId={lease.id}
					propertyId={propertyId}
					type={createType}
					opened={!!createType}
					setOpened={(open) => !open && setCreateType(null)}
				/>
			)}

			{viewChecklist && (
				<ChecklistModal
					leaseId={lease.id}
					propertyId={propertyId}
					checklist={viewChecklist}
					canEdit={canEdit}
					opened={!!viewChecklist}
					setOpened={(open) => !open && setViewChecklistId(null)}
				/>
			)}
		</>
	)
}
