import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Clock, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ImpactRow } from './impact-row'
import { willBeDeletedRows, willBeDeletedTotal } from './lib'
import { DeleteModalHeader } from './modal-header'
import { useDeleteProperty } from '~/api/properties'
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import { convertToSlug } from '~/lib/misc'

interface Props {
	clientId: string
	propertyId: string
	propertyName: string
	preview: PropertyDeletionEligibility
	opened: boolean
	setOpened: (v: boolean) => void
	onDeleted: () => void
	onNowBlocked: () => void
}

export function ConfirmDeletionModal({
	clientId,
	propertyId,
	propertyName,
	preview,
	opened,
	setOpened,
	onDeleted,
	onNowBlocked,
}: Props) {
	const [typed, setTyped] = useState('')
	const { mutate, isPending } = useDeleteProperty()
	const queryClient = useQueryClient()

	const confirmed = convertToSlug(typed) === convertToSlug(propertyName)
	const rows = willBeDeletedRows(preview.will_be_deleted)
	const empty = rows.length === 0

	const handleDelete = () => {
		if (!confirmed) return
		mutate(
			{ clientId, id: propertyId },
			{
				onError: (error: unknown) => {
					const message = error instanceof Error ? error.message : ''
					if (message === 'PropertyHasActiveOccupancy') {
						toast.error(
							'This property gained active occupancy since you opened this dialog.',
						)
						onNowBlocked()
						return
					}
					toast.error('Failed to delete property. Try again later.')
				},
				onSuccess: () => {
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.PROPERTIES],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.CURRENT_USER, QUERY_KEYS.PROPERTIES],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.CLIENT_USER_PROPERTIES],
					})
					onDeleted()
				},
			},
		)
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="sm:max-w-lg">
				<AlertDialogHeader>
					<DeleteModalHeader
						propertyName={propertyName}
						onClose={() => setOpened(false)}
					/>
				</AlertDialogHeader>

				<div className="max-h-[50vh] space-y-5 overflow-y-auto">
					<div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
						<div className="bg-background flex size-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 dark:border-blue-900/40">
							<Clock className="size-4 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p className="text-foreground text-sm font-semibold">
								You can undo this
							</p>
							<p className="text-muted-foreground mt-1 text-sm leading-relaxed">
								The property is archived, not permanently erased. Restore it
								anytime from Settings › Archived properties.
							</p>
						</div>
					</div>

					{empty ? (
						<div className="flex items-start gap-3 rounded-lg border p-4">
							<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
							<p className="text-muted-foreground text-sm">
								Nothing else is connected to this property. Deleting it removes
								only the property record itself.
							</p>
						</div>
					) : (
						<div>
							<p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
								What will be archived ·{' '}
								{willBeDeletedTotal(preview.will_be_deleted)} records
							</p>
							<div className="rounded-lg border">
								{rows.map((row, i) => (
									<ImpactRow
										key={row.key}
										icon={row.icon}
										label={row.label}
										count={row.count}
										note={row.note}
										tone={i < 2 ? 'destructive' : 'default'}
									/>
								))}
							</div>
							<p className="text-muted-foreground mt-2 text-xs leading-relaxed">
								Blocks, units, leases, bookings and applications are archived,
								not erased.
							</p>
						</div>
					)}

					<div>
						<Label
							htmlFor="confirm-property-name"
							className="mb-2 block text-sm"
						>
							Type{' '}
							<span className="text-destructive font-semibold">
								{propertyName}
							</span>{' '}
							to confirm.
						</Label>
						<Input
							id="confirm-property-name"
							value={typed}
							onChange={(e) => setTyped(e.target.value)}
							placeholder={propertyName}
						/>
					</div>
				</div>

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
						ahead of the async delete call and tear down this modal before
						onDeleted() can hand off to the done modal.
					*/}
					<Button
						type="button"
						disabled={!confirmed || isPending}
						onClick={handleDelete}
					>
						{isPending ? <Spinner /> : <Trash2 className="size-4" />}
						Delete property
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
