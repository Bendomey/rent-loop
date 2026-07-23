import { Trash2, TriangleAlert } from 'lucide-react'
import { useNavigate } from 'react-router'
import { ImpactRow } from './impact-row'
import {
	blockingReasonIcon,
	blockingReasonNote,
	blockingReasonResolvePath,
	willBeDeletedRows,
} from './lib'
import { DeleteModalHeader } from './modal-header'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
} from '~/components/ui/alert-dialog'

interface Props {
	propertyId: string
	propertyName: string
	preview: PropertyDeletionEligibility
	opened: boolean
	setOpened: (v: boolean) => void
}

export function BlockedDeletionModal({
	propertyId,
	propertyName,
	preview,
	opened,
	setOpened,
}: Props) {
	const navigate = useNavigate()

	const resolve = (reason: PropertyDeletionBlockingReason) => {
		setOpened(false)
		void navigate(blockingReasonResolvePath(propertyId, reason))
	}

	const blockingRows = willBeDeletedRows(preview.will_be_deleted)

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="sm:max-w-lg">
				<AlertDialogHeader>
					<DeleteModalHeader
						propertyName={propertyName}
						onClose={() => setOpened(false)}
					/>
				</AlertDialogHeader>

				<div className="max-h-[55vh] space-y-5 overflow-y-auto">
					<div className="bg-destructive/5 border-destructive/20 flex items-start gap-3 rounded-xl border p-4">
						<div className="bg-background border-destructive/20 flex size-9 shrink-0 items-center justify-center rounded-lg border">
							<TriangleAlert className="text-destructive size-4" />
						</div>
						<div>
							<p className="text-foreground text-sm font-semibold">
								This property can't be deleted yet
							</p>
							<p className="text-muted-foreground mt-1 text-sm leading-relaxed">
								It still has active occupancy. End or resolve everything below,
								and the Delete button will unlock.
							</p>
						</div>
					</div>

					<div>
						<p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
							Blocking deletion ·{' '}
							{preview.blocking_reasons.reduce((sum, r) => sum + r.count, 0)}{' '}
							items
						</p>
						<div className="rounded-lg border">
							{preview.blocking_reasons.map((reason) => (
								<ImpactRow
									key={`${reason.type}-${reason.status}`}
									icon={blockingReasonIcon(reason.type)}
									label={reason.label}
									count={reason.count}
									note={blockingReasonNote(reason.type)}
									tone="destructive"
									actionLabel="Resolve"
									onAction={() => resolve(reason)}
								/>
							))}
						</div>
					</div>

					{blockingRows.length > 0 ? (
						<div>
							<p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
								Would be deleted once cleared
							</p>
							<div className="rounded-lg border">
								{blockingRows.map((row) => (
									<ImpactRow
										key={row.key}
										icon={row.icon}
										label={row.label}
										count={row.count}
										note={row.note}
										dim
									/>
								))}
							</div>
						</div>
					) : null}
				</div>

				<AlertDialogFooter className="sm:justify-between">
					<span className="text-muted-foreground text-xs">
						Resolve the {preview.blocking_reasons.length} blockers to enable
						deletion.
					</span>
					<div className="flex gap-2">
						<AlertDialogCancel onClick={() => setOpened(false)}>
							Close
						</AlertDialogCancel>
						<AlertDialogAction disabled className="gap-2">
							<Trash2 className="size-4" />
							Delete property
						</AlertDialogAction>
					</div>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
