import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { useGetClientUsers } from '~/api/client-users'
import {
	useAssignManager,
	useAssignWorker,
	useCreateMaintenanceRequestComment,
	useUpdateMaintenanceRequest,
	useUpdateMaintenanceRequestStatus,
} from '~/api/maintenance-requests'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'
import { TypographyMuted } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'

const STATUS_COLORS: Record<MaintenanceRequestStatus, string> = {
	NEW: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
	IN_PROGRESS:
		'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
	IN_REVIEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
	RESOLVED:
		'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
	CANCELED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const PRIORITY_COLORS: Record<MaintenanceRequestPriority, string> = {
	LOW: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
	MEDIUM:
		'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
	HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
	EMERGENCY: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const CATEGORY_LABELS: Record<MaintenanceRequestCategory, string> = {
	PLUMBING: 'Plumbing',
	ELECTRICAL: 'Electrical',
	HVAC: 'HVAC',
	OTHER: 'Other',
}

function SidebarSection({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-col gap-3">{children}</div>
}

function SidebarRow({
	label,
	children,
}: {
	label: string
	children: React.ReactNode
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<TypographyMuted className="shrink-0 text-xs">{label}</TypographyMuted>
			<div className="min-w-0 text-right text-sm">{children}</div>
		</div>
	)
}

interface SidebarProps {
	mr: MaintenanceRequest
	propertyId: string
}

export function MaintenanceRequestSidebar({ mr, propertyId }: SidebarProps) {
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)

	const [pendingStatus, setPendingStatus] =
		useState<MaintenanceRequestStatus | null>(null)
	const [statusNote, setStatusNote] = useState('')

	const isLocked = mr.status === 'RESOLVED' || mr.status === 'CANCELED'

	const invalidate = () => {
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, mr.id],
		})
		void revalidator.revalidate()
	}

	const invalidateComments = () => {
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, mr.id, 'comments'],
		})
	}

	const updateStatus = useUpdateMaintenanceRequestStatus()
	const updateRequest = useUpdateMaintenanceRequest()
	const assignWorker = useAssignWorker()
	const assignManager = useAssignManager()
	const createComment = useCreateMaintenanceRequestComment()

	const { data: clientUsers } = useGetClientUsers(clientId, {
		pagination: { page: 1, per: 100 },
		populate: ['User'],
	})

	const handleStatusChange = (status: MaintenanceRequestStatus) => {
		if (status === 'RESOLVED' || status === 'CANCELED') {
			setPendingStatus(status)
			setStatusNote('')
			return
		}
		updateStatus.mutate(
			{ client_id: clientId, id: mr.id, property_id: propertyId, status },
			{
				onSuccess: () => {
					toast.success('Status updated')
					invalidate()
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to update status',
					),
			},
		)
	}

	const handleStatusConfirm = async () => {
		if (!pendingStatus) return
		if (pendingStatus === 'CANCELED' && !statusNote.trim()) {
			toast.error('Please provide a cancellation reason')
			return
		}

		const note = statusNote.trim()

		try {
			await updateStatus.mutateAsync({
				client_id: clientId,
				id: mr.id,
				property_id: propertyId,
				status: pendingStatus,
				cancellation_reason:
					pendingStatus === 'CANCELED' ? note || undefined : undefined,
			})
			await createComment.mutateAsync({
				client_id: clientId,
				id: mr.id,
				property_id: propertyId,
				content: note,
			})
			invalidate()
			invalidateComments()
			setStatusNote('')
			setPendingStatus(null)
			toast.success('Status updated')
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to update status',
			)
		}
	}

	const handlePriorityChange = (priority: MaintenanceRequestPriority) => {
		updateRequest.mutate(
			{ client_id: clientId, id: mr.id, property_id: propertyId, priority },
			{
				onSuccess: () => {
					toast.success('Priority updated')
					invalidate()
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to update priority',
					),
			},
		)
	}

	const handleCategoryChange = (category: MaintenanceRequestCategory) => {
		updateRequest.mutate(
			{ client_id: clientId, id: mr.id, property_id: propertyId, category },
			{
				onSuccess: () => {
					toast.success('Category updated')
					invalidate()
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to update category',
					),
			},
		)
	}

	const handleVisibilityChange = (
		visibility: MaintenanceRequest['visibility'],
	) => {
		updateRequest.mutate(
			{ client_id: clientId, id: mr.id, property_id: propertyId, visibility },
			{
				onSuccess: () => {
					toast.success('Visibility updated')
					invalidate()
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to update visibility',
					),
			},
		)
	}

	const handleWorkerChange = (worker_id: string) => {
		assignWorker.mutate(
			{ client_id: clientId, id: mr.id, property_id: propertyId, worker_id },
			{
				onSuccess: () => {
					toast.success('Worker assigned')
					invalidate()
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to assign worker',
					),
			},
		)
	}

	const handleManagerChange = (manager_id: string) => {
		assignManager.mutate(
			{ client_id: clientId, id: mr.id, property_id: propertyId, manager_id },
			{
				onSuccess: () => {
					toast.success('Manager assigned')
					invalidate()
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to assign manager',
					),
			},
		)
	}

	const isCanceled = pendingStatus === 'CANCELED'
	const isConfirming = updateStatus.isPending

	return (
		<>
			<Dialog
				open={!!pendingStatus}
				onOpenChange={(open) => {
					if (!open) {
						setPendingStatus(null)
						setStatusNote('')
					}
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{isCanceled ? 'Cancel request' : 'Resolve request'}
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-2">
						<TypographyMuted className="text-sm">
							{isCanceled
								? 'Provide a reason for cancellation.'
								: 'Add an optional note about the resolution.'}
						</TypographyMuted>
						<Textarea
							placeholder={
								isCanceled
									? 'Cancellation reason...'
									: 'Resolution notes (optional)...'
							}
							value={statusNote}
							onChange={(e) => setStatusNote(e.target.value)}
							rows={3}
							className="h-44 resize-none"
							autoFocus
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setPendingStatus(null)
								setStatusNote('')
							}}
							disabled={isConfirming}
						>
							Cancel
						</Button>
						<Button
							variant={isCanceled ? 'destructive' : 'default'}
							onClick={handleStatusConfirm}
							disabled={isConfirming || (isCanceled && !statusNote.trim())}
							className={cn({
								'bg-green-600 text-white hover:bg-green-700': !isCanceled,
							})}
						>
							{isConfirming
								? 'Saving...'
								: isCanceled
									? 'Cancel request'
									: 'Mark as resolved'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="flex flex-col gap-5 text-sm">
				{/* Status */}
				<SidebarSection>
					<Select
						value={mr.status}
						onValueChange={(v) =>
							handleStatusChange(v as MaintenanceRequestStatus)
						}
					>
						<SelectTrigger className="h-8 w-full text-xs">
							<SelectValue>
								<Badge
									variant="outline"
									className={cn('border-0 text-xs', STATUS_COLORS[mr.status])}
								>
									{mr.status.replace('_', ' ')}
								</Badge>
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{(
								[
									'NEW',
									'IN_PROGRESS',
									'IN_REVIEW',
									'RESOLVED',
									'CANCELED',
								] as MaintenanceRequestStatus[]
							).map((s) => (
								<SelectItem key={s} value={s}>
									<Badge
										variant="outline"
										className={cn('border-0 text-xs', STATUS_COLORS[s])}
									>
										{s.replace('_', ' ')}
									</Badge>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</SidebarSection>

				{/* Assignments */}
				<Card className="p-5 shadow-none">
					<SidebarSection>
						<p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
							Assignments
						</p>
						<div className="flex flex-col gap-2">
							<TypographyMuted className="text-xs">Worker</TypographyMuted>
							<Select
								value={mr.assigned_worker_id ?? ''}
								onValueChange={handleWorkerChange}
								disabled={isLocked}
							>
								<SelectTrigger className="h-8 w-full bg-white text-xs">
									<SelectValue placeholder="Unassigned">
										{mr.assigned_worker?.user?.name ?? 'Unassigned'}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{clientUsers?.rows.map((u) => (
										<SelectItem key={u.id} value={u.id}>
											{u.user?.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2">
							<TypographyMuted className="text-xs">Manager</TypographyMuted>
							<Select
								value={mr.assigned_manager_id ?? ''}
								onValueChange={handleManagerChange}
								disabled={isLocked}
							>
								<SelectTrigger className="h-8 w-full text-xs">
									<SelectValue placeholder="Unassigned">
										{mr.assigned_manager?.user?.name ?? 'Unassigned'}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{clientUsers?.rows.map((u) => (
										<SelectItem key={u.id} value={u.id}>
											{u.user?.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</SidebarSection>
				</Card>

				{/* Properties */}
				<Card className="p-5 shadow-none">
					<SidebarSection>
						<p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
							Properties
						</p>
						<Separator />
						<SidebarRow label="Priority">
							<Select
								value={mr.priority}
								onValueChange={(v) =>
									handlePriorityChange(v as MaintenanceRequestPriority)
								}
								disabled={isLocked}
							>
								<SelectTrigger className="h-7 w-auto border-0 p-0 text-xs shadow-none focus:ring-0">
									<Badge
										variant="outline"
										className={cn(
											'border-0 text-xs',
											PRIORITY_COLORS[mr.priority],
										)}
									>
										{mr.priority}
									</Badge>
								</SelectTrigger>
								<SelectContent>
									{(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] as const).map(
										(p) => (
											<SelectItem key={p} value={p}>
												<Badge
													variant="outline"
													className={cn('border-0 text-xs', PRIORITY_COLORS[p])}
												>
													{p}
												</Badge>
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						</SidebarRow>
						<SidebarRow label="Category">
							<Select
								value={mr.category}
								onValueChange={(v) =>
									handleCategoryChange(v as MaintenanceRequestCategory)
								}
								disabled={isLocked}
							>
								<SelectTrigger className="h-7 w-auto border-0 p-0 text-xs shadow-none focus:ring-0">
									<SelectValue>{CATEGORY_LABELS[mr.category]}</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{(['PLUMBING', 'ELECTRICAL', 'HVAC', 'OTHER'] as const).map(
										(c) => (
											<SelectItem key={c} value={c}>
												{CATEGORY_LABELS[c]}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						</SidebarRow>
						<SidebarRow label="Visibility">
							<Select
								value={mr.visibility}
								onValueChange={(v) =>
									handleVisibilityChange(v as MaintenanceRequest['visibility'])
								}
								disabled={isLocked}
							>
								<SelectTrigger className="h-7 w-auto border-0 p-0 text-xs shadow-none focus:ring-0">
									<SelectValue>
										{mr.visibility === 'TENANT_VISIBLE'
											? 'Tenant Visible'
											: 'Internal Only'}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="TENANT_VISIBLE">Tenant Visible</SelectItem>
									<SelectItem value="INTERNAL_ONLY">Internal Only</SelectItem>
								</SelectContent>
							</Select>
						</SidebarRow>
						{mr.unit && (
							<SidebarRow label="Unit">
								<Link
									to={`/properties/${propertyId}/assets/units/${mr.unit_id}`}
									className="text-xs text-blue-600 hover:underline dark:text-blue-400"
								>
									{mr.unit.name}
								</Link>
							</SidebarRow>
						)}
						{mr.lease_id && (
							<SidebarRow label="Lease">
								<Link
									to={`/properties/${propertyId}/tenants/leases/${mr.lease_id}`}
									className="text-xs text-blue-600 hover:underline dark:text-blue-400"
								>
									View lease
								</Link>
							</SidebarRow>
						)}
					</SidebarSection>
				</Card>

				{/* Details */}
				<SidebarSection>
					<small className="shrink-0 text-xs">
						Created {localizedDayjs(mr.created_at).format('LL')} at{' '}
						{localizedDayjs(mr.created_at).format('LT')}
					</small>
					<small className="shrink-0 text-xs">
						Updated {localizedDayjs(mr.updated_at).format('LL')} at{' '}
						{localizedDayjs(mr.updated_at).format('LT')}
					</small>
				</SidebarSection>
			</div>
		</>
	)
}
