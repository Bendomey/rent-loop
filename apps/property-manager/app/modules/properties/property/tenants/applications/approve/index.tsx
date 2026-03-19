import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'

import { useApprovalPipeline } from './use-approval-pipeline'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Progress } from '~/components/ui/progress'
import { Spinner } from '~/components/ui/spinner'

interface Props {
	data?: TenantApplication
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	refetch?: VoidFunction
	propertyId: string
}

function ApproveTenantApplicationModal({
	opened,
	setOpened,
	data,
	propertyId,
}: Props) {
	if (!data) return null

	return (
		<Dialog
			open={opened}
			onOpenChange={(open) => {
				if (!open) setOpened(false)
			}}
		>
			<DialogContent
				showCloseButton={false}
				className="sm:max-w-md"
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<ApprovalModalContent
					propertyId={propertyId}
					data={data}
					onClose={() => setOpened(false)}
				/>
			</DialogContent>
		</Dialog>
	)
}

function ApprovalModalContent({
	data,
	onClose,
	propertyId,
}: {
	data: TenantApplication
	onClose: () => void
	propertyId: string
}) {
	const name = [data.first_name, data.other_names, data.last_name]
		.filter(Boolean)
		.join(' ')

	const { state, start, retry, reset, description, progress } =
		useApprovalPipeline({
			application: data,
			propertyId,
			onSuccess: () => {
				toast.success(`${name}'s application was approved successfully.`)
				onClose()
			},
		})

	const handleClose = () => {
		if (state.status === 'PROCESSING') return
		reset()
		onClose()
	}

	// ── IDLE ─────────────────────────────────────
	if (state.status === 'IDLE') {
		return (
			<>
				<DialogHeader className="items-center text-center">
					<div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
						<ShieldCheck className="size-6 text-green-600" />
					</div>
					<DialogTitle>Approve Application</DialogTitle>
					<DialogDescription className="text-center">
						This will generate the lease agreement PDF, securely store it, and
						approve the tenant application. This action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<div className="flex justify-end gap-3 pt-2">
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button onClick={start} className="bg-green-500 hover:bg-green-600">
						Yes, Approve
					</Button>
				</div>
			</>
		)
	}

	// ── PROCESSING ───────────────────────────────
	if (state.status === 'PROCESSING') {
		return (
			<div className="flex flex-col items-center justify-center px-4 py-8 text-center">
				<Spinner className="text-primary mb-6 size-8" />
				<h3 className="mb-2 text-lg font-semibold">Processing Approval</h3>
				<p className="text-muted-foreground mb-6 min-h-[20px] text-sm">
					{description}
				</p>
				<Progress value={progress} className="mb-4 h-2.5 w-full" />
				<Alert variant="default" className="mt-2">
					<AlertDescription className="text-xs">
						Please do not close this tab or navigate away while the approval is
						being processed.
					</AlertDescription>
				</Alert>
			</div>
		)
	}

	// ── SUCCESS ──────────────────────────────────
	if (state.status === 'SUCCESS') {
		return (
			<div className="flex flex-col items-center justify-center px-4 py-8 text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
					<CheckCircle2 className="size-8 text-green-600" />
				</div>
				<h3 className="mb-2 text-lg font-semibold">Application Approved</h3>
				<p className="text-muted-foreground text-sm">
					{name}&apos;s application has been approved successfully.
				</p>
			</div>
		)
	}

	// ── ERROR ────────────────────────────────────
	if (state.status === 'ERROR') {
		return (
			<div className="flex flex-col items-center justify-center px-4 py-8 text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
					<AlertTriangle className="size-8 text-red-600" />
				</div>
				<h3 className="mb-2 text-lg font-semibold">Something went wrong</h3>
				<p className="text-muted-foreground mb-6 text-sm">
					{state.error ||
						'An error occurred while processing the approval. Please try again.'}
				</p>
				<div className="flex gap-3">
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button onClick={retry}>Try Again</Button>
				</div>
			</div>
		)
	}

	return null
}

export default ApproveTenantApplicationModal
