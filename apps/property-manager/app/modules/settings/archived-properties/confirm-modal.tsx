import { ArrowLeftRight } from 'lucide-react'
import { toast } from 'sonner'
import { ImpactRow } from './impact-row'
import { restorePreviewRows } from './lib'
import {
	useGetPropertyRestorePreview,
	useRestoreProperty,
} from '~/api/properties'
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { Spinner } from '~/components/ui/spinner'

interface Props {
	clientId: string
	propertyId: string
	propertyName: string
	opened: boolean
	setOpened: (v: boolean) => void
	onRestored: () => void
}

export function RestoreConfirmModal({
	clientId,
	propertyId,
	propertyName,
	opened,
	setOpened,
	onRestored,
}: Props) {
	const { data: preview } = useGetPropertyRestorePreview(
		clientId,
		propertyId,
		opened,
	)
	const { mutate, isPending } = useRestoreProperty()

	const handleRestore = () => {
		mutate(
			{ clientId, id: propertyId },
			{
				onError: () => {
					toast.error('Failed to restore property. Try again later.')
				},
				// Query invalidation happens once the success modal is dismissed
				// (see restore-flow.tsx), not here — invalidating immediately
				// would refetch the archived list right away, causing this row
				// (and its modal) to unmount before the success state is shown.
				onSuccess: () => {
					onRestored()
				},
			},
		)
	}

	const rows = preview ? restorePreviewRows(preview) : []

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="sm:max-w-lg">
				<AlertDialogHeader>
					<div className="bg-primary/10 dark:bg-primary/15 mb-1 flex size-11 items-center justify-center rounded-xl">
						<ArrowLeftRight className="text-primary size-5" />
					</div>
					<AlertDialogTitle className="font-serif text-xl font-normal">
						Restore {propertyName}?
					</AlertDialogTitle>
					{preview ? (
						<AlertDialogDescription>
							It returns to your active portfolio with its {preview.blocks}{' '}
							blocks and {preview.units} units. Its records come back read-only.
							The property resumes as{' '}
							<span className="text-foreground font-medium">inactive</span> — no
							leases or bookings restart automatically.
						</AlertDialogDescription>
					) : (
						<div className="space-y-2 pt-1">
							<Skeleton className="h-3.5 w-full" />
							<Skeleton className="h-3.5 w-4/5" />
						</div>
					)}
				</AlertDialogHeader>

				{preview ? (
					rows.length > 0 ? (
						<div className="max-h-[40vh] overflow-y-auto rounded-lg border">
							{rows.map((row) => (
								<ImpactRow
									key={row.key}
									icon={row.icon}
									label={row.label}
									count={row.count}
								/>
							))}
						</div>
					) : null
				) : (
					<div className="rounded-lg border">
						{[0, 1, 2].map((i) => (
							<div
								key={i}
								className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
							>
								<Skeleton className="size-9 shrink-0 rounded-lg" />
								<div className="flex-1 space-y-1.5">
									<Skeleton className="h-3.5 w-24" />
								</div>
								<Skeleton className="h-3.5 w-6" />
							</div>
						))}
					</div>
				)}

				<AlertDialogFooter>
					<AlertDialogCancel
						disabled={isPending}
						onClick={() => setOpened(false)}
					>
						Cancel
					</AlertDialogCancel>
					{/*
						A plain Button, not AlertDialogAction: Radix's AlertDialogAction
						always closes the dialog synchronously on click, which would race
						ahead of the async restore call and tear down this modal before
						onRestored() can hand off to the done modal.
					*/}
					<Button
						type="button"
						disabled={!preview || isPending}
						onClick={handleRestore}
					>
						{isPending ? <Spinner /> : <ArrowLeftRight className="size-4" />}
						Restore property
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
