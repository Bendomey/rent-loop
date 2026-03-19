import {
	CheckCircle2Icon,
	PencilIcon,
	PlusIcon,
	SendIcon,
	Trash2Icon,
	XCircleIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ChecklistItemDialog } from './checklist-item-dialog'
import {
	useDeleteLeaseChecklistItem,
	useSubmitLeaseChecklist,
} from '~/api/lease-checklists'
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
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Separator } from '~/components/ui/separator'
import { TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import {
	getChecklistStatusClass,
	getChecklistStatusLabel,
	getChecklistTypeLabel,
	getItemStatusClass,
	getItemStatusLabel,
	isChecklistEditable,
} from '~/lib/lease-checklist.utils'

interface Props {
	leaseId: string
	propertyId: string
	checklist: LeaseChecklist
	canEdit: boolean
	opened: boolean
	setOpened: (open: boolean) => void
}

function groupItemsByCategory(
	items: LeaseChecklistItem[],
): Record<string, LeaseChecklistItem[]> {
	const groups: Record<string, LeaseChecklistItem[]> = {}
	for (const item of items) {
		const parts = item.description.split(' - ')
		const category = parts.length > 1 ? (parts[0] ?? 'General') : 'General'
		if (!groups[category]) groups[category] = []
		groups[category]!.push(item)
	}
	return groups
}

function getDescriptionLabel(description: string): string {
	const parts = description.split(' - ')
	return parts.length > 1 ? parts.slice(1).join(' - ') : description
}

export function ChecklistModal({
	leaseId,
	propertyId,
	checklist,
	canEdit,
	opened,
	setOpened,
}: Props) {
	const [itemDialogOpen, setItemDialogOpen] = useState(false)
	const [editingItem, setEditingItem] = useState<
		LeaseChecklistItem | undefined
	>()
	const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
	const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)

	const submitMutation = useSubmitLeaseChecklist()
	const deleteItemMutation = useDeleteLeaseChecklistItem()

	const editable = isChecklistEditable(checklist.status)
	const canEditItems = canEdit && editable
	const items = checklist.items ?? []
	const acknowledgments = checklist.acknowledgments ?? []
	const hasPendingItems = items.some((i) => i.status === 'PENDING')
	const groups = groupItemsByCategory(items)

	async function handleSubmit() {
		try {
			await submitMutation.mutateAsync({
				lease_id: leaseId,
				property_id: propertyId,
				checklist_id: checklist.id,
			})
			toast.success('Checklist submitted for tenant review')
			setSubmitConfirmOpen(false)
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to submit checklist',
			)
		}
	}

	async function handleDeleteItem(itemId: string) {
		try {
			await deleteItemMutation.mutateAsync({
				lease_id: leaseId,
				property_id: propertyId,
				checklist_id: checklist.id,
				item_id: itemId,
			})
			toast.success('Item removed')
			setDeleteItemId(null)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to remove item')
		}
	}

	function openAddItem() {
		setEditingItem(undefined)
		setItemDialogOpen(true)
	}

	function openEditItem(item: LeaseChecklistItem) {
		setEditingItem(item)
		setItemDialogOpen(true)
	}

	return (
		<>
			<Dialog open={opened} onOpenChange={setOpened}>
				<DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
					<DialogHeader>
						<div className="flex items-center justify-between gap-3 pr-6">
							<DialogTitle>{getChecklistTypeLabel(checklist.type)}</DialogTitle>
							<div className="flex items-center gap-2">
								<Badge
									className={`text-xs ${getChecklistStatusClass(checklist.status)}`}
								>
									{getChecklistStatusLabel(checklist.status)}
								</Badge>
								{checklist.round > 1 && (
									<Badge variant="outline" className="text-xs">
										Round {checklist.round}
									</Badge>
								)}
							</div>
						</div>
						{checklist.submitted_at && (
							<TypographyMuted className="text-xs">
								Submitted {localizedDayjs(checklist.submitted_at).format('LL')}
							</TypographyMuted>
						)}
					</DialogHeader>

					<div className="flex-1 space-y-5 overflow-y-auto pr-1">
						{/* Items */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<p className="text-sm font-semibold">Items ({items.length})</p>
								{canEditItems && (
									<Button size="sm" variant="outline" onClick={openAddItem}>
										<PlusIcon className="mr-1 size-3.5" />
										Add Item
									</Button>
								)}
							</div>

							{items.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No items yet. Add items to document the property condition.
								</p>
							) : (
								<div className="space-y-4">
									{Object.entries(groups).map(([category, items]) => (
										<div key={category} className="space-y-2">
											<p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
												{category}
											</p>
											<Separator />
											<div className="space-y-2">
												{items.map((item) => (
													<div
														key={item.id}
														className="flex items-start justify-between gap-3 rounded-md border px-3 py-2 dark:bg-zinc-900"
													>
														<div className="min-w-0 flex-1 space-y-0.5">
															<p className="text-sm font-medium">
																{getDescriptionLabel(item.description)}
															</p>
															{item.notes && (
																<p className="text-muted-foreground text-xs">
																	{item.notes}
																</p>
															)}
														</div>
														<div className="flex shrink-0 items-center gap-2">
															<Badge
																className={`text-xs ${getItemStatusClass(item.status)}`}
															>
																{getItemStatusLabel(item.status)}
															</Badge>
															{canEditItems && (
																<>
																	<Button
																		size="icon"
																		variant="ghost"
																		className="size-7"
																		onClick={() => openEditItem(item)}
																	>
																		<PencilIcon className="size-3.5" />
																	</Button>
																	<Button
																		size="icon"
																		variant="ghost"
																		className="text-destructive hover:text-destructive size-7"
																		onClick={() => setDeleteItemId(item.id)}
																	>
																		<Trash2Icon className="size-3.5" />
																	</Button>
																</>
															)}
														</div>
													</div>
												))}
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Acknowledgment history */}
						{acknowledgments.length > 0 && (
							<div className="space-y-3">
								<Separator />
								<p className="text-sm font-semibold">Acknowledgment History</p>
								<div className="space-y-2">
									{acknowledgments.map((ack) => (
										<div
											key={ack.id}
											className="flex items-start gap-3 rounded-md border px-3 py-2"
										>
											{ack.action === 'ACKNOWLEDGED' ? (
												<CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-teal-500" />
											) : (
												<XCircleIcon className="mt-0.5 size-4 shrink-0 text-rose-500" />
											)}
											<div className="flex-1 space-y-0.5">
												<div className="flex items-center gap-2">
													<p className="text-sm font-medium">
														{ack.action === 'ACKNOWLEDGED'
															? 'Acknowledged'
															: 'Disputed'}
													</p>
													<Badge variant="outline" className="text-xs">
														Round {ack.round}
													</Badge>
												</div>
												{ack.comment && (
													<p className="text-muted-foreground text-xs">
														{ack.comment}
													</p>
												)}
												<TypographyMuted className="text-xs">
													{localizedDayjs(ack.created_at).format('LLL')}
												</TypographyMuted>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Footer actions */}
					{canEdit && editable && items.length > 0 && (
						<div className="border-t pt-4">
							{hasPendingItems ? (
								<p className="text-muted-foreground text-xs">
									All items must have a condition set before you can submit.
								</p>
							) : (
								<Button
									className="w-full"
									onClick={() => setSubmitConfirmOpen(true)}
									disabled={submitMutation.isPending}
								>
									<SendIcon className="mr-2 size-4" />
									Submit for Tenant Review
								</Button>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Item add/edit dialog */}
			<ChecklistItemDialog
				leaseId={leaseId}
				propertyId={propertyId}
				checklistId={checklist.id}
				item={editingItem}
				opened={itemDialogOpen}
				setOpened={setItemDialogOpen}
			/>

			{/* Delete item confirmation */}
			<AlertDialog
				open={!!deleteItemId}
				onOpenChange={(o) => !o && setDeleteItemId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove item?</AlertDialogTitle>
						<AlertDialogDescription>
							This item will be permanently removed from the checklist.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteItemId && handleDeleteItem(deleteItemId)}
							disabled={deleteItemMutation.isPending}
						>
							{deleteItemMutation.isPending ? 'Removing…' : 'Remove'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Submit confirmation */}
			<AlertDialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Submit checklist?</AlertDialogTitle>
						<AlertDialogDescription>
							The tenant will be notified to review and acknowledge this report.
							You won't be able to edit items until they respond.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleSubmit}
							disabled={submitMutation.isPending}
						>
							{submitMutation.isPending ? 'Submitting…' : 'Submit'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
