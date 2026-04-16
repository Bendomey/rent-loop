import {
	ArrowLeftRight,
	Building2,
	DoorOpen,
	Loader2,
	TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useGetPropertyBlocks } from '~/api/blocks'
import { useUpdateProperty } from '~/api/properties'
import { useGetPropertyUnits } from '~/api/units'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { getErrorMessage } from '~/lib/error-messages'

// ---------------------------------------------------------------------------
// Switch to Single
// ---------------------------------------------------------------------------

function SwitchToSingleContent({
	clientId,
	property,
	onSuccess,
	onCancel,
}: {
	clientId: string
	property: Property
	onSuccess: () => void
	onCancel: () => void
}) {
	const { data: blocksData, isLoading: blocksLoading } = useGetPropertyBlocks(
		clientId,
		{
			property_id: property.id,
			pagination: { per: 2, page: 1 },
		},
	)

	const { data: unitsData, isLoading: unitsLoading } = useGetPropertyUnits(
		clientId,
		{
			property_id: property.id,
			pagination: { per: 2, page: 1 },
		},
	)

	const { mutate, isPending } = useUpdateProperty(clientId)

	const isLoading = blocksLoading || unitsLoading
	const blockCount = blocksData?.meta.total ?? 0
	const unitCount = unitsData?.meta.total ?? 0
	const hasExcessBlocks = blockCount > 1
	const hasExcessUnits = unitCount > 1
	const hasExcess = hasExcessBlocks || hasExcessUnits

	const handleConfirm = () => {
		mutate(
			{ propertyId: property.id, data: { type: 'SINGLE' } },
			{
				onSuccess: () => {
					toast.success('Property type switched to Single')
					onSuccess()
				},
				onError: (e: unknown) => {
					toast.error(
						getErrorMessage(
							e instanceof Error ? e.message : 'Unknown error',
							'Failed to switch property type. Please try again.',
						),
					)
				},
			},
		)
	}

	if (isLoading) {
		return (
			<div className="flex flex-col items-center gap-3 py-8">
				<Loader2 className="text-muted-foreground size-6 animate-spin" />
				<p className="text-muted-foreground text-sm">
					Checking property assets…
				</p>
			</div>
		)
	}

	if (hasExcess) {
		return (
			<div className="space-y-4">
				<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
					<TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
					<p className="text-sm text-amber-800 dark:text-amber-400">
						Before switching, reduce this property to at most{' '}
						<span className="font-semibold">1 block</span> and{' '}
						<span className="font-semibold">1 unit</span>.
					</p>
				</div>

				<div className="space-y-2">
					{hasExcessBlocks && (
						<div className="flex items-center justify-between rounded-md border px-3 py-2.5">
							<div className="flex items-center gap-2.5">
								<Building2 className="text-muted-foreground size-4" />
								<span className="text-sm font-medium">Blocks</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground text-xs">current</span>
								<span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400">
									{blockCount}
								</span>
								<span className="text-muted-foreground text-xs">→ max</span>
								<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
									1
								</span>
							</div>
						</div>
					)}
					{hasExcessUnits && (
						<div className="flex items-center justify-between rounded-md border px-3 py-2.5">
							<div className="flex items-center gap-2.5">
								<DoorOpen className="text-muted-foreground size-4" />
								<span className="text-sm font-medium">Units</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground text-xs">current</span>
								<span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400">
									{unitCount}
								</span>
								<span className="text-muted-foreground text-xs">→ max</span>
								<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
									1
								</span>
							</div>
						</div>
					)}
				</div>

				<Separator />

				<DialogFooter>
					<Button variant="outline" onClick={onCancel} className="w-full">
						Got it
					</Button>
				</DialogFooter>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center justify-between rounded-md border px-3 py-2.5">
					<div className="flex items-center gap-2.5">
						<Building2 className="text-muted-foreground size-4" />
						<span className="text-sm font-medium">Blocks</span>
					</div>
					<span className="text-muted-foreground text-sm">
						{blockCount} {blockCount === 1 ? 'block' : 'blocks'}
					</span>
				</div>
				<div className="flex items-center justify-between rounded-md border px-3 py-2.5">
					<div className="flex items-center gap-2.5">
						<DoorOpen className="text-muted-foreground size-4" />
						<span className="text-sm font-medium">Units</span>
					</div>
					<span className="text-muted-foreground text-sm">
						{unitCount} {unitCount === 1 ? 'unit' : 'units'}
					</span>
				</div>
			</div>

			<p className="text-muted-foreground text-xs">
				After switching, this property will be locked to 1 block and 1 unit. You
				can switch back to Multi at any time.
			</p>

			<Separator />

			<DialogFooter>
				<Button variant="outline" onClick={onCancel} disabled={isPending}>
					Cancel
				</Button>
				<Button
					onClick={handleConfirm}
					disabled={isPending}
					className="min-w-[130px]"
				>
					{isPending ? <Spinner /> : null}
					Yes, switch to Single
				</Button>
			</DialogFooter>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Switch to Single dialog wrapper
// ---------------------------------------------------------------------------

function SwitchToSingleDialog({
	property,
	clientId,
	open,
	onOpenChange,
	onSuccess,
}: {
	clientId: string
	property: Property
	open: boolean
	onOpenChange: (v: boolean) => void
	onSuccess: () => void
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm rounded-xl">
				<DialogHeader>
					<DialogTitle>Switch to Single type?</DialogTitle>
				</DialogHeader>

				{open && (
					<SwitchToSingleContent
						clientId={clientId}
						property={property}
						onSuccess={onSuccess}
						onCancel={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}

// ---------------------------------------------------------------------------
// Switch to Multi dialog
// ---------------------------------------------------------------------------

function SwitchToMultiDialog({
	property,
	clientId,
	open,
	onOpenChange,
	onSuccess,
}: {
	clientId: string
	property: Property
	open: boolean
	onOpenChange: (v: boolean) => void
	onSuccess: () => void
}) {
	const { mutate, isPending } = useUpdateProperty(clientId)

	const handleConfirm = () => {
		mutate(
			{ propertyId: property.id, data: { type: 'MULTI' } },
			{
				onSuccess: () => {
					toast.success('Property type switched to Multi')
					onSuccess()
				},
				onError: (e: unknown) => {
					toast.error(
						getErrorMessage(
							e instanceof Error ? e.message : 'Unknown error',
							'Failed to switch property type. Please try again.',
						),
					)
				},
			},
		)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm rounded-xl">
				<DialogHeader>
					<DialogTitle>Switch to Multi type?</DialogTitle>
					<DialogDescription>
						A Multi property supports multiple blocks and units. You can add
						more after switching.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={isPending}
						className="min-w-[120px]"
					>
						{isPending ? <Spinner /> : null}
						Switch to Multi
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export function SwitchPropertyType({
	property,
	clientId,
	onSuccess,
}: {
	property: Property
	clientId: string
	onSuccess: () => void
}) {
	const [open, setOpen] = useState(false)

	const isMulti = property.type === 'MULTI'

	const handleSuccess = () => {
		setOpen(false)
		onSuccess()
	}

	return (
		<>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="gap-2"
				onClick={() => setOpen(true)}
			>
				<ArrowLeftRight className="size-4" />
				Switch to {isMulti ? 'Single' : 'Multi'}
			</Button>

			{isMulti ? (
				<SwitchToSingleDialog
					property={property}
					clientId={clientId}
					open={open}
					onOpenChange={setOpen}
					onSuccess={handleSuccess}
				/>
			) : (
				<SwitchToMultiDialog
					property={property}
					clientId={clientId}
					open={open}
					onOpenChange={setOpen}
					onSuccess={handleSuccess}
				/>
			)}
		</>
	)
}
