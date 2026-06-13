import { ClipboardList, ExternalLink, SkipForward } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
	useCreateLeaseChecklist,
	useGetLeaseChecklists,
} from '~/api/lease-checklists'
import {
	useGetLeaseTermination,
	useUpdateLeaseTermination,
} from '~/api/lease-terminations'
import { ChecklistModal } from '../../components/checklist-modal'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { Spinner } from '~/components/ui/spinner'
import { localizedDayjs } from '~/lib/date'
import {
	getChecklistStatusClass,
	getChecklistStatusLabel,
} from '~/lib/lease-checklist.utils'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface Props {
	lease: Lease
	propertyId: string
	terminationId: string
	onBack: () => void
	onNext: () => void
}

export function StepInspection({
	lease,
	propertyId,
	terminationId,
	onBack,
	onNext,
}: Props) {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const [viewChecklistId, setViewChecklistId] = useState<string | null>(null)

	const { data: terminationData } = useGetLeaseTermination(
		clientId,
		propertyId,
		lease.id,
		terminationId,
	)

	const { data: checklistsData, isLoading: isLoadingChecklists } =
		useGetLeaseChecklists(clientId, propertyId, lease.id, {
			filters: {},
			populate: ['Items', 'Acknowledgments'],
		})

	const { mutateAsync: createChecklist, isPending: isCreating } =
		useCreateLeaseChecklist()
	const { mutateAsync: updateTermination, isPending: isLinking } =
		useUpdateLeaseTermination()

	const checkOutChecklist =
		checklistsData?.rows?.find((c) => c.type === 'CHECK_OUT') ?? null
	const linkedChecklistId = terminationData?.lease_checklist_id ?? null
	const linkedChecklist =
		checklistsData?.rows?.find((c) => c.id === linkedChecklistId) ?? null
	const viewChecklist =
		checklistsData?.rows?.find((c) => c.id === viewChecklistId) ?? null

	const handleCreateAndLink = async () => {
		try {
			const checklist = await createChecklist({
				client_id: clientId,
				property_id: propertyId,
				lease_id: lease.id,
				type: 'CHECK_OUT',
				checklist_items: [],
			})
			if (!checklist) return
			await updateTermination({
				client_id: clientId,
				property_id: propertyId,
				lease_id: lease.id,
				termination_id: terminationId,
				lease_checklist_id: checklist.id,
			})
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to create inspection',
			)
		}
	}

	const handleLinkExisting = async () => {
		if (!checkOutChecklist) return
		try {
			await updateTermination({
				client_id: clientId,
				property_id: propertyId,
				lease_id: lease.id,
				termination_id: terminationId,
				lease_checklist_id: checkOutChecklist.id,
			})
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to link inspection',
			)
		}
	}

	return (
		<div className="flex flex-col gap-8 p-8">
			<div>
				<h2 className="text-base font-semibold">Move-Out Inspection</h2>
				<p className="text-muted-foreground mt-1 text-sm">
					Optional. Link a move-out condition report to document property state
					at the time of termination.
				</p>
			</div>

			{isLoadingChecklists ? (
				<div className="space-y-3">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			) : linkedChecklist ? (
				<div className="space-y-3">
					<p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
						Linked Inspection
					</p>
					<button
						type="button"
						onClick={() => setViewChecklistId(linkedChecklist.id)}
						className="hover:bg-muted/40 group flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors"
					>
						<div className="flex min-w-0 items-center gap-3">
							<div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
								<ClipboardList className="text-muted-foreground size-5" />
							</div>
							<div className="min-w-0">
								<p className="text-sm font-medium">Move-Out Inspection</p>
								<p className="text-muted-foreground mt-0.5 text-xs">
									{linkedChecklist.items?.length ?? 0} items ·{' '}
									{localizedDayjs(linkedChecklist.created_at).format(
										'MMM D, YYYY',
									)}
								</p>
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<Badge
								className={`text-xs ${getChecklistStatusClass(linkedChecklist.status)}`}
							>
								{getChecklistStatusLabel(linkedChecklist.status)}
							</Badge>
							<ExternalLink className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100" />
						</div>
					</button>
					<p className="text-muted-foreground text-xs">
						Click the report to open and edit inspection items.
					</p>
				</div>
			) : (
				<div className="rounded-xl border border-dashed p-8 text-center">
					<div className="bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
						<ClipboardList className="text-muted-foreground size-6" />
					</div>
					<p className="text-sm font-medium">No inspection linked</p>
					<p className="text-muted-foreground mt-1 text-sm">
						{checkOutChecklist
							? 'A move-out report already exists for this lease.'
							: 'Create a new move-out inspection to document property condition.'}
					</p>
					<div className="mt-4 flex justify-center gap-2">
						{checkOutChecklist ? (
							<Button
								variant="outline"
								onClick={handleLinkExisting}
								disabled={isLinking}
							>
								{isLinking ? <Spinner /> : <ClipboardList className="size-4" />}
								Link Existing Report
							</Button>
						) : (
							<Button
								variant="outline"
								onClick={handleCreateAndLink}
								disabled={isCreating || isLinking}
							>
								{isCreating || isLinking ? (
									<Spinner />
								) : (
									<ClipboardList className="size-4" />
								)}
								Create Move-Out Report
							</Button>
						)}
					</div>
				</div>
			)}

			<div className="flex items-center justify-between border-t pt-4">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
				<div className="flex gap-2">
					<Button variant="ghost" onClick={onNext}>
						<SkipForward className="size-4" />
						Skip
					</Button>
					{linkedChecklist && <Button onClick={onNext}>Continue</Button>}
				</div>
			</div>

			{viewChecklist && (
				<ChecklistModal
					leaseId={lease.id}
					propertyId={propertyId}
					checklist={viewChecklist}
					canEdit
					opened={!!viewChecklist}
					setOpened={(open) => !open && setViewChecklistId(null)}
				/>
			)}
		</div>
	)
}
