import { ArrowLeftRight, Loader2, TriangleAlert } from 'lucide-react'
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
import { Spinner } from '~/components/ui/spinner'
import { getErrorMessage } from '~/lib/error-messages'

// ---------------------------------------------------------------------------
// Switch to Single
// ---------------------------------------------------------------------------

function SwitchToSingleContent({
	property,
	onSuccess,
	onCancel,
}: {
	property: Property
	onSuccess: () => void
	onCancel: () => void
}) {
	const { data: blocksData, isLoading: blocksLoading } = useGetPropertyBlocks({
		property_id: property.id,
		pagination: { per: 2, page: 1 },
	})

	const { data: unitsData, isLoading: unitsLoading } = useGetPropertyUnits({
		property_id: property.id,
		pagination: { per: 2, page: 1 },
	})

	const { mutate, isPending } = useUpdateProperty()

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
			<div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
				<Loader2 className="size-4 animate-spin" />
				Checking property assets…
			</div>
		)
	}

	if (hasExcess) {
		return (
			<>
				<div className="border-destructive/30 bg-destructive/5 space-y-3 rounded-lg border p-4">
					<div className="flex items-start gap-2">
						<TriangleAlert className="text-destructive mt-0.5 size-4 shrink-0" />
						<div className="space-y-1">
							<p className="text-destructive text-sm font-medium">
								Cannot switch to Single type
							</p>
							<p className="text-muted-foreground text-sm">
								A Single property supports only 1 block and 1 unit. Remove the
								extras before switching.
							</p>
						</div>
					</div>

					<ul className="text-muted-foreground ml-6 space-y-1 text-sm">
						{hasExcessBlocks && (
							<li>
								<span className="text-foreground font-medium">
									{blockCount} blocks
								</span>{' '}
								— reduce to 1
							</li>
						)}
						{hasExcessUnits && (
							<li>
								<span className="text-foreground font-medium">
									{unitCount} units
								</span>{' '}
								— reduce to 1
							</li>
						)}
					</ul>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onCancel}>
						Close
					</Button>
				</DialogFooter>
			</>
		)
	}

	return (
		<>
			<p className="text-muted-foreground text-sm">
				This property has{' '}
				<span className="text-foreground font-medium">{blockCount}</span>{' '}
				{blockCount === 1 ? 'block' : 'blocks'} and{' '}
				<span className="text-foreground font-medium">{unitCount}</span>{' '}
				{unitCount === 1 ? 'unit' : 'units'} — eligible to switch to Single.
			</p>

			<DialogFooter>
				<Button variant="outline" onClick={onCancel} disabled={isPending}>
					Cancel
				</Button>
				<Button
					onClick={handleConfirm}
					disabled={isPending}
					className="min-w-[120px]"
				>
					{isPending ? <Spinner /> : null}
					Switch to Single
				</Button>
			</DialogFooter>
		</>
	)
}

// ---------------------------------------------------------------------------
// Switch to Single dialog wrapper
// ---------------------------------------------------------------------------

function SwitchToSingleDialog({
	property,
	open,
	onOpenChange,
	onSuccess,
}: {
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
					<DialogDescription>
						A Single property can have at most 1 block and 1 unit.
					</DialogDescription>
				</DialogHeader>

				{open && (
					<SwitchToSingleContent
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
// Public component
// ---------------------------------------------------------------------------

export function SwitchPropertyType({
	property,
	onSuccess,
}: {
	property: Property
	onSuccess: () => void
}) {
	const [open, setOpen] = useState(false)
	const { mutate, isPending } = useUpdateProperty()

	const isMulti = property.type === 'MULTI'

	const switchToMulti = () => {
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
		<>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="gap-2"
				disabled={isPending}
				onClick={isMulti ? () => setOpen(true) : switchToMulti}
			>
				{isPending ? <Spinner /> : <ArrowLeftRight className="size-4" />}
				Switch to {isMulti ? 'Single' : 'Multi'}
			</Button>

			{isMulti && (
				<SwitchToSingleDialog
					property={property}
					open={open}
					onOpenChange={setOpen}
					onSuccess={() => {
						setOpen(false)
						onSuccess()
					}}
				/>
			)}
		</>
	)
}
