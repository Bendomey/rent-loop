import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCreateExpense } from '~/api/expenses'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import { Switch } from '~/components/ui/switch'
import { TypographyMuted } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
	{ value: 'REPAIRS', label: 'Repairs' },
	{ value: 'UTILITIES', label: 'Utilities' },
	{ value: 'INSURANCE', label: 'Insurance' },
	{ value: 'LANDSCAPING', label: 'Landscaping' },
	{ value: 'SECURITY', label: 'Security' },
	{ value: 'MANAGEMENT', label: 'Management' },
	{ value: 'OTHER', label: 'Other' },
]

const expenseSchema = z.object({
	description: z.string().min(1, 'Description is required'),
	amount: z.string().min(1, 'Amount is required'),
	category: z.enum([
		'REPAIRS',
		'UTILITIES',
		'INSURANCE',
		'LANDSCAPING',
		'SECURITY',
		'MANAGEMENT',
		'OTHER',
	]),
	vendor_name: z.string().min(1, 'Vendor name is required'),
	vendor_contact: z.string(),
	already_paid: z.boolean(),
	payment_reference: z.string(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export function CreateExpenseDialog({ propertyId }: { propertyId: string }) {
	const queryClient = useQueryClient()
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const [open, setOpen] = useState(false)

	const createExpense = useCreateExpense()

	const form = useForm<ExpenseFormValues>({
		resolver: zodResolver(expenseSchema),
		defaultValues: {
			description: '',
			amount: '',
			category: 'REPAIRS',
			vendor_name: '',
			vendor_contact: '',
			already_paid: false,
			payment_reference: '',
		},
	})

	const alreadyPaid = form.watch('already_paid')

	const onSubmit = (values: ExpenseFormValues) => {
		const amount = parseFloat(values.amount)
		if (isNaN(amount) || amount <= 0) {
			form.setError('amount', { message: 'Amount must be positive' })
			return
		}

		createExpense.mutate(
			{
				client_id: clientId,
				property_id: propertyId,
				category: values.category,
				vendor_name: values.vendor_name,
				vendor_contact: values.vendor_contact || undefined,
				description: values.description,
				amount: Math.round(amount * 100),
				already_paid: values.already_paid,
				payment_reference: values.payment_reference || undefined,
			},
			{
				onSuccess: () => {
					toast.success(
						values.already_paid
							? 'Expense recorded and settled'
							: 'Expense recorded',
					)
					form.reset()
					setOpen(false)
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.EXPENSES],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.INVOICES],
					})
				},
				onError: (err: Error) => toast.error(err.message),
			},
		)
	}

	return (
		<PropertyPermissionGuard roles={['MANAGER']}>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button size="sm">
						<Plus className="size-4" />
						New expense
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Record an expense</DialogTitle>
						<DialogDescription>
							Money owed to a vendor for a service provided to this property.
							Costs tied to a maintenance request are recorded on that request
							instead.
						</DialogDescription>
					</DialogHeader>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex flex-col gap-4"
						>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Generator service" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="amount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Amount (GHS)</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="number"
													step="0.01"
													min="0"
													placeholder="0.00"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="category"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Category</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{CATEGORIES.map((c) => (
														<SelectItem key={c.value} value={c.value}>
															{c.label}
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
									name="vendor_name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Vendor</FormLabel>
											<FormControl>
												<Input {...field} placeholder="Kofi Engineering" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="vendor_contact"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Vendor contact (optional)</FormLabel>
											<FormControl>
												<Input {...field} placeholder="024 000 0000" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="already_paid"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
										<div className="flex flex-col gap-0.5">
											<FormLabel>Already paid</FormLabel>
											<TypographyMuted className="text-xs">
												Records the payment at the same time, so this expense
												lands settled.
											</TypographyMuted>
										</div>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							{alreadyPaid && (
								<FormField
									control={form.control}
									name="payment_reference"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Payment reference (optional)</FormLabel>
											<FormControl>
												<Input
													{...field}
													placeholder="Cheque no., momo ref..."
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={createExpense.isPending}>
									{createExpense.isPending ? 'Saving...' : 'Record expense'}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</PropertyPermissionGuard>
	)
}
