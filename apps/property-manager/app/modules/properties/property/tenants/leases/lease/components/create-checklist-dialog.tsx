import { AlertTriangleIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateLeaseChecklist } from '~/api/lease-checklists'
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
import { getChecklistTypeLabel } from '~/lib/lease-checklist.utils'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface Props {
	leaseId: string
	propertyId: string
	type: LeaseChecklistType
	opened: boolean
	setOpened: (open: boolean) => void
}

export function CreateChecklistDialog({
	leaseId,
	propertyId,
	type,
	opened,
	setOpened,
}: Props) {
	const { clientUser } = useClient()
	const { mutateAsync, isPending } = useCreateLeaseChecklist()
	const [skipped, setSkipped] = useState(false)

	const label = getChecklistTypeLabel(type)

	async function handleCreate() {
		try {
			await mutateAsync({
				client_id: safeString(clientUser?.client_id),
				lease_id: leaseId,
				property_id: propertyId,
				type,
				checklist_items: [],
			})
			toast.success(`${label} created`)
			setOpened(false)
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to create checklist',
			)
		}
	}

	function handleSkip() {
		setSkipped(true)
		setOpened(false)
	}

	// Reset skip state when dialog re-opens
	if (opened && skipped) setSkipped(false)

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Create {label}</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="space-y-2">
							<p>
								{type === 'CHECK_IN'
									? 'Documenting the property condition at move-in protects both you and your tenant against future disputes.'
									: 'Documenting the property condition at move-out lets you accurately assess damage and support any deposit deductions.'}
							</p>
							{type === 'CHECK_OUT' && (
								<div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
									<AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
									<span>
										Without a Move-Out Report you may not be able to support
										damage claims or deposit deductions.
									</span>
								</div>
							)}
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={handleSkip} disabled={isPending}>
						Not now
					</AlertDialogCancel>
					<AlertDialogAction onClick={handleCreate} disabled={isPending}>
						{isPending ? 'Creating…' : 'Create Report'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
