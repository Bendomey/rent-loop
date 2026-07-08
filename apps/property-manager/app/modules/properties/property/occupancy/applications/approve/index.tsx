import { AlertTriangle, CheckCircle2, FileX, ShieldCheck } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'

import { NextStepsContent } from './next-steps-modal'
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
import { cn } from '~/lib/utils'

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
			<ApprovalModalContent
				propertyId={propertyId}
				data={data}
				onClose={() => setOpened(false)}
			/>
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
				toast.success(`${name}'s lease has been created successfully.`)
			},
		})

	const handleClose = () => {
		if (state.status === 'PROCESSING') return
		reset()
		onClose()
	}

	const isNextSteps = state.status === 'NEXT_STEPS'

	return (
		<DialogContent
			showCloseButton={false}
			className={cn(
				'transition-[max-width] duration-300 ease-in-out',
				isNextSteps ? 'sm:max-w-lg' : 'sm:max-w-md',
			)}
			onInteractOutside={(e) => e.preventDefault()}
			onEscapeKeyDown={(e) => e.preventDefault()}
		>
			{state.status === 'IDLE' &&
				(() => {
					const docsSkipped = !data.lease_agreement_document_mode
					const hasOnlineDoc =
						data.lease_agreement_document_mode === 'ONLINE' &&
						data.lease_agreement_document?.content != null

					return (
						<>
							<DialogHeader className="items-center text-center">
								<div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
									<ShieldCheck className="size-6 text-green-600" />
								</div>
								<DialogTitle>Approve Application</DialogTitle>
								<DialogDescription className="text-center">
									{hasOnlineDoc
										? 'This will generate the lease agreement PDF, securely store it, and approve the lease application.'
										: 'This will approve the lease application and create the lease.'}{' '}
									This action cannot be undone.
								</DialogDescription>
							</DialogHeader>

							{docsSkipped && (
								<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
									<div className="flex gap-2">
										<FileX className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
										<div className="space-y-0.5">
											<p className="text-sm font-medium text-amber-800 dark:text-amber-300">
												Documentation skipped
											</p>
											<p className="text-xs text-amber-700 dark:text-amber-400">
												No lease agreement document was set up. You can always
												add and manage it from the lease page after the lease is
												created.
											</p>
										</div>
									</div>
								</div>
							)}

							<div className="flex justify-end gap-3 pt-2">
								<Button variant="outline" onClick={handleClose}>
									Cancel
								</Button>
								<Button
									onClick={start}
									className="bg-green-500 hover:bg-green-600"
								>
									Yes, Approve
								</Button>
							</div>
						</>
					)
				})()}

			{state.status === 'PROCESSING' && (
				<div className="flex flex-col items-center justify-center px-4 py-8 text-center">
					<Spinner className="text-primary mb-6 size-8" />
					<h3 className="mb-2 text-lg font-semibold">Processing Approval</h3>
					<p className="text-muted-foreground mb-6 min-h-[20px] text-sm">
						{description}
					</p>
					<Progress value={progress} className="mb-4 h-2.5 w-full" />
					<Alert variant="default" className="mt-2">
						<AlertDescription className="text-xs">
							Please do not close this tab or navigate away while the approval
							is being processed.
						</AlertDescription>
					</Alert>
				</div>
			)}

			{state.status === 'SUCCESS' && (
				<div className="flex flex-col items-center justify-center px-4 py-8 text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
						<CheckCircle2 className="size-8 text-green-600" />
					</div>
					<h3 className="mb-2 text-lg font-semibold">Application Approved</h3>
					<p className="text-muted-foreground text-sm">
						{name}&apos;s application has been approved successfully.
					</p>
				</div>
			)}

			{state.status === 'NEXT_STEPS' && state.lease && (
				<NextStepsContent
					lease={state.lease}
					name={name}
					propertyId={propertyId}
					onClose={handleClose}
				/>
			)}

			{state.status === 'ERROR' && (
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
			)}
		</DialogContent>
	)
}

export default ApproveTenantApplicationModal
