import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	useCreateLeaseChecklistItem,
	useUpdateLeaseChecklistItem,
} from '~/api/lease-checklists'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'

const ITEM_STATUSES: { value: LeaseChecklistItemStatus; label: string }[] = [
	{ value: 'PENDING', label: 'Pending' },
	{ value: 'FUNCTIONAL', label: 'Functional' },
	{ value: 'DAMAGED', label: 'Damaged' },
	{ value: 'NEEDS_REPAIR', label: 'Needs Repair' },
	{ value: 'MISSING', label: 'Missing' },
	{ value: 'NOT_PRESENT', label: 'Not Present' },
]

const schema = z.object({
	description: z.string().min(1, 'Description is required'),
	status: z.enum([
		'FUNCTIONAL',
		'DAMAGED',
		'NEEDS_REPAIR',
		'MISSING',
		'NOT_PRESENT',
	]),
	notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
	leaseId: string
	propertyId: string
	checklistId: string
	item?: LeaseChecklistItem
	opened: boolean
	setOpened: (open: boolean) => void
}

export function ChecklistItemDialog({
	leaseId,
	propertyId,
	checklistId,
	item,
	opened,
	setOpened,
}: Props) {
	const isEdit = !!item
	const createMutation = useCreateLeaseChecklistItem()
	const updateMutation = useUpdateLeaseChecklistItem()
	const isPending = createMutation.isPending || updateMutation.isPending

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			description: item?.description ?? '',
			status: (item?.status as FormValues['status']) ?? 'FUNCTIONAL',
			notes: item?.notes ?? '',
		},
	})

	useEffect(() => {
		if (opened) {
			form.reset({
				description: item?.description ?? '',
				status: (item?.status as FormValues['status']) ?? 'FUNCTIONAL',
				notes: item?.notes ?? '',
			})
		}
	}, [opened, item, form])

	async function onSubmit(values: FormValues) {
		try {
			if (isEdit && item) {
				await updateMutation.mutateAsync({
					lease_id: leaseId,
					property_id: propertyId,
					checklist_id: checklistId,
					item_id: item.id,
					description: values.description,
					status: values.status,
					notes: values.notes || null,
				})
				toast.success('Item updated')
			} else {
				await createMutation.mutateAsync({
					lease_id: leaseId,
					property_id: propertyId,
					checklist_id: checklistId,
					description: values.description,
					status: values.status,
					notes: values.notes,
				})
				toast.success('Item added')
			}
			setOpened(false)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Something went wrong')
		}
	}

	return (
		<Dialog open={opened} onOpenChange={setOpened}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{isEdit ? 'Edit Item' : 'Add Item'}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g. Living Room - Wall paint condition"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="status"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Condition</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select condition" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{ITEM_STATUSES.map((s) => (
												<SelectItem key={s.value} value={s.value}>
													{s.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Notes (optional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Any additional details…"
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpened(false)}
								disabled={isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Item'}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
