import { Building2, LayoutGrid, TriangleAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { BlockedDeletionModal } from './blocked-modal'
import { ConfirmDeletionModal } from './confirm-modal'
import { DeletionDoneModal } from './done-modal'
import { useGetPropertyDeletionPreview } from '~/api/properties'
import { PermissionGuard } from '~/components/permissions/permission-guard'
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
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH3, TypographyMuted } from '~/components/ui/typography'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

type Stage = 'idle' | 'reviewing' | 'done'

export function PropertyDangerZoneModule() {
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const [stage, setStage] = useState<Stage>('idle')
	const [forceBlocked, setForceBlocked] = useState(false)

	const property = clientUserProperty?.property
	const clientId = safeString(clientUser?.client_id)
	const propertyId = safeString(property?.id)

	const flowOpen = stage === 'reviewing'
	const {
		data: preview,
		isError,
		refetch,
	} = useGetPropertyDeletionPreview(clientId, propertyId, flowOpen)

	const openDelete = () => {
		setForceBlocked(false)
		setStage('reviewing')
	}
	const close = () => setStage('idle')

	if (!property) return null

	return (
		<PermissionGuard roles={['OWNER', 'ADMIN']}>
			<div className="mx-auto max-w-4xl space-y-6 px-0 pt-0 pb-10 lg:px-4 lg:pt-1">
				<div className="space-y-1">
					<TypographyH3>Danger Zone</TypographyH3>
					<TypographyMuted>
						Irreversible-looking actions that need extra care. This one isn’t —
						deletion is a recoverable archive.
					</TypographyMuted>
				</div>

				<Separator />

				<div className="border-destructive/30 overflow-hidden rounded-xl border">
					<div className="flex flex-col items-start gap-4 p-6 sm:flex-row">
						<div className="flex-1">
							<h4 className="font-serif text-2xl font-normal">
								Delete this property
							</h4>
							<p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">
								Removes{' '}
								<span className="text-foreground font-medium">
									{property.name}
								</span>{' '}
								and everything under it — blocks, units, and its lease, booking
								and application history — from your active portfolio. It’s
								archived rather than erased, so it can be restored later.
							</p>
							<div className="mt-4 flex flex-wrap items-center gap-2">
								<span className="bg-muted flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm">
									<LayoutGrid className="text-muted-foreground size-4" />
									<span className="font-semibold">
										{property.blocks_count}
									</span>{' '}
									blocks
								</span>
								<span className="bg-muted flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm">
									<Building2 className="text-muted-foreground size-4" />
									<span className="font-semibold">
										{property.units_count}
									</span>{' '}
									units
								</span>
							</div>
						</div>
						<Button
							type="button"
							variant="destructive"
							onClick={openDelete}
							className="gap-2"
						>
							<Trash2 className="size-4" />
							Delete property
						</Button>
					</div>
					<div className="bg-destructive/5 border-destructive/30 flex items-center gap-2 border-t px-6 py-3">
						<TriangleAlert className="text-destructive size-4 shrink-0" />
						<span className="text-destructive text-sm font-medium">
							A property with active leases, bookings or pending applications
							can’t be deleted until those are resolved.
						</span>
					</div>
				</div>

				{flowOpen && !preview && !isError ? (
					<AlertDialog open onOpenChange={close}>
						<AlertDialogContent className="sm:max-w-sm">
							<div className="flex flex-col items-center gap-3 py-6">
								<Spinner />
								<p className="text-muted-foreground text-sm">
									Checking what’s connected to this property…
								</p>
							</div>
						</AlertDialogContent>
					</AlertDialog>
				) : null}

				{flowOpen && isError ? (
					<AlertDialog open onOpenChange={close}>
						<AlertDialogContent className="sm:max-w-sm">
							<AlertDialogHeader>
								<AlertDialogTitle>Couldn’t load this property</AlertDialogTitle>
								<AlertDialogDescription>
									Something went wrong checking what’s connected to this
									property.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel onClick={close}>Close</AlertDialogCancel>
								<AlertDialogAction onClick={() => void refetch()}>
									Retry
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				) : null}

				{flowOpen && preview ? (
					preview.can_delete && !forceBlocked ? (
						<ConfirmDeletionModal
							clientId={clientId}
							propertyId={propertyId}
							propertyName={property.name}
							preview={preview}
							opened
							setOpened={close}
							onDeleted={() => setStage('done')}
							onNowBlocked={() => setForceBlocked(true)}
						/>
					) : (
						<BlockedDeletionModal
							propertyId={propertyId}
							propertyName={property.name}
							preview={preview}
							opened
							setOpened={close}
						/>
					)
				) : null}

				{stage === 'done' ? (
					<DeletionDoneModal
						propertyName={property.name}
						opened
						setOpened={close}
					/>
				) : null}
			</div>
		</PermissionGuard>
	)
}
