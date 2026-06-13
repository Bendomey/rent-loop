import {
	AlertTriangle,
	CheckCircle2,
	CircleDashed,
	FileText,
	Receipt,
	ClipboardList,
	XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
	useCancelLeaseTermination,
	useCompleteLeaseTermination,
	useGetLeaseTermination,
} from '~/api/lease-terminations'
import { useGetInvoices } from '~/api/invoices'
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
import { Skeleton } from '~/components/ui/skeleton'
import { Spinner } from '~/components/ui/spinner'
import { cn } from '~/lib/utils'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

const TYPE_LABELS: Record<LeaseTerminationType, string> = {
	EVICTION: 'Eviction',
	MUTUAL_AGREEMENT: 'Mutual Agreement',
	TENANT_INITIATED: 'Tenant-Initiated',
}

interface SummaryCardProps {
	icon: React.ElementType
	label: string
	description: string
	done: boolean
	required?: boolean
}

function SummaryCard({
	icon: Icon,
	label,
	description,
	done,
	required,
}: SummaryCardProps) {
	return (
		<div
			className={cn(
				'flex items-center gap-4 rounded-xl border p-4 transition-colors',
				done
					? 'border-teal-200 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/40'
					: 'border-border bg-muted/20',
			)}
		>
			<div
				className={cn(
					'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
					done ? 'bg-teal-100 dark:bg-teal-900/50' : 'bg-muted',
				)}
			>
				{done ? (
					<CheckCircle2 className="size-5 text-teal-600 dark:text-teal-400" />
				) : (
					<Icon className="text-muted-foreground size-5" />
				)}
			</div>
			<div className="min-w-0 flex-1">
				<p
					className={cn(
						'text-sm font-medium',
						!done && 'text-muted-foreground',
					)}
				>
					{label}
				</p>
				<p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
			</div>
			{required && !done && (
				<span className="shrink-0 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
					Required
				</span>
			)}
		</div>
	)
}

interface Props {
	lease: Lease
	propertyId: string
	terminationId: string
	onBack: () => void
	onDone: () => void
}

export function StepConfirm({
	lease,
	propertyId,
	terminationId,
	onBack,
	onDone,
}: Props) {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)

	const [completeOpen, setCompleteOpen] = useState(false)
	const [cancelOpen, setCancelOpen] = useState(false)

	const { data: termination, isLoading } = useGetLeaseTermination(
		clientId,
		propertyId,
		lease.id,
		terminationId,
	)

	const { data: invoicesData } = useGetInvoices(clientId, propertyId, {
		filters: { context_lease_termination_id: terminationId },
		pagination: { page: 1, per: 50 },
		populate: [],
	})
	const invoiceCount = invoicesData?.rows?.length ?? 0

	const { mutateAsync: complete, isPending: isCompleting } =
		useCompleteLeaseTermination()
	const { mutateAsync: cancel, isPending: isCancelling } =
		useCancelLeaseTermination()

	const hasReason = Boolean(termination?.type && termination?.reason)
	const hasInspection = Boolean(termination?.lease_checklist_id)
	const hasDocument = Boolean(termination?.document_mode)
	const hasInvoices = invoiceCount > 0

	const canComplete = hasReason

	const handleComplete = async () => {
		try {
			await complete({
				client_id: clientId,
				property_id: propertyId,
				lease_id: lease.id,
				termination_id: terminationId,
			})
			toast.success('Lease terminated successfully.')
			setCompleteOpen(false)
			onDone()
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to complete termination',
			)
		}
	}

	const handleCancel = async () => {
		try {
			await cancel({
				client_id: clientId,
				property_id: propertyId,
				lease_id: lease.id,
				termination_id: terminationId,
			})
			toast.success('Termination process cancelled. Lease remains active.')
			setCancelOpen(false)
			onDone()
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to cancel termination',
			)
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-4 p-8">
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-16 w-full" />
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-8 p-8">
			<div>
				<h2 className="text-base font-semibold">Review &amp; Confirm</h2>
				<p className="text-muted-foreground mt-1 text-sm">
					Review the checklist below. Once completed, the lease will be set to{' '}
					<strong>Terminated</strong> and the unit will be freed up. This cannot
					be undone.
				</p>
			</div>

			{/* Summary cards */}
			<div className="space-y-3">
				<SummaryCard
					icon={CircleDashed}
					label="Reason & Type"
					done={hasReason}
					required
					description={
						hasReason && termination?.type
							? `${TYPE_LABELS[termination.type]} — reason recorded`
							: 'Required — go back to Step 1 to complete'
					}
				/>
				<SummaryCard
					icon={ClipboardList}
					label="Move-Out Inspection"
					done={hasInspection}
					description={
						hasInspection ? 'Inspection report linked' : 'Optional — not linked'
					}
				/>
				<SummaryCard
					icon={FileText}
					label="Termination Agreement"
					done={hasDocument}
					description={
						hasDocument
							? termination?.document_mode === 'MANUAL'
								? 'External document attached'
								: 'Library document linked'
							: 'Optional — no document attached'
					}
				/>
				<SummaryCard
					icon={Receipt}
					label="Financial Settlement"
					done={hasInvoices}
					description={
						hasInvoices
							? `${invoiceCount} invoice${invoiceCount > 1 ? 's' : ''} created`
							: 'Optional — no invoices created'
					}
				/>
			</div>

			{!hasReason && (
				<div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
					<p className="text-sm text-amber-700 dark:text-amber-400">
						You must set the termination type and reason before completing. Go
						back to Step 1.
					</p>
				</div>
			)}

			<Separator />

			<div className="flex items-center justify-between">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
				<div className="flex gap-3">
					<Button
						variant="outline"
						className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
						onClick={() => setCancelOpen(true)}
						disabled={isCancelling || isCompleting}
					>
						<XCircle className="size-4" />
						Cancel Process
					</Button>
					<Button
						variant="destructive"
						disabled={!canComplete || isCompleting || isCancelling}
						onClick={() => setCompleteOpen(true)}
					>
						{isCompleting ? <Spinner /> : null}
						Complete Termination
					</Button>
				</div>
			</div>

			{/* Complete confirmation */}
			<AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Complete lease termination?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently set the lease status to{' '}
							<strong>Terminated</strong> and release the unit. The tenant will
							be notified. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isCompleting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive hover:bg-destructive/90 text-white"
							onClick={(e) => {
								e.preventDefault()
								void handleComplete()
							}}
							disabled={isCompleting}
						>
							{isCompleting ? <Spinner /> : null}
							Yes, Terminate Lease
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Cancel confirmation */}
			<AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel termination process?</AlertDialogTitle>
						<AlertDialogDescription>
							The termination process will be cancelled and the lease will
							remain active. You can start a new termination later if needed.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isCancelling}>
							No, keep process
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault()
								void handleCancel()
							}}
							disabled={isCancelling}
						>
							{isCancelling ? <Spinner /> : null}
							Cancel Process
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
