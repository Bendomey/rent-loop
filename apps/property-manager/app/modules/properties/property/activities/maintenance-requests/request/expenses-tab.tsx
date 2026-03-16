import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, FileText, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	useCreateMaintenanceExpense,
	useDeleteMaintenanceExpense,
	useGenerateMaintenanceInvoice,
	useGetMaintenanceRequestExpenses,
} from '~/api/maintenance-requests'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
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
import { Separator } from '~/components/ui/separator'
import { Switch } from '~/components/ui/switch'
import { TypographyMuted } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { formatAmount } from '~/lib/format-amount'

const expenseSchema = z.object({
	description: z.string().min(1, 'Description is required'),
	amount: z.string().min(1, 'Amount is required'),
	paid_by: z.enum(['BUSINESS', 'TENANT', 'OWNER']),
	billable_to_tenant: z.boolean(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

const PAID_BY_LABELS: Record<MaintenanceExpense['paid_by'], string> = {
	BUSINESS: 'Business',
	TENANT: 'Tenant',
	OWNER: 'Owner',
}

interface ExpensesTabProps {
	requestId: string
	propertyId: string
}

export function ExpensesTab({ requestId, propertyId }: ExpensesTabProps) {
	const queryClient = useQueryClient()
	const [showForm, setShowForm] = useState(false)

	const {
		data: expensesData,
		isLoading,
		isError,
		refetch,
	} = useGetMaintenanceRequestExpenses(requestId, {
		pagination: { page: 1, per: 100 },
		filters: {},
	})
	const expenses = expensesData?.rows
	const createExpense = useCreateMaintenanceExpense()
	const deleteExpense = useDeleteMaintenanceExpense()
	const generateInvoice = useGenerateMaintenanceInvoice()

	const form = useForm<ExpenseFormValues>({
		resolver: zodResolver(expenseSchema),
		defaultValues: {
			description: '',
			amount: '',
			paid_by: 'BUSINESS',
			billable_to_tenant: false,
		},
	})

	const invalidate = () =>
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, requestId, 'expenses'],
		})

	const onSubmit = (values: ExpenseFormValues) => {
		const amount = parseFloat(values.amount)
		if (isNaN(amount) || amount <= 0) {
			form.setError('amount', { message: 'Amount must be positive' })
			return
		}
		createExpense.mutate(
			{ id: requestId, ...values, amount },
			{
				onSuccess: () => {
					toast.success('Expense added')
					form.reset()
					setShowForm(false)
					invalidate()
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to add expense',
					),
			},
		)
	}

	const handleDelete = (expenseId: string) => {
		deleteExpense.mutate(
			{ id: requestId, expense_id: expenseId },
			{
				onSuccess: () => {
					toast.success('Expense removed')
					invalidate()
				},
				onError: (err) =>
					toast.error(
						err instanceof Error ? err.message : 'Failed to remove expense',
					),
			},
		)
	}

	const handleGenerateInvoice = () => {
		generateInvoice.mutate(requestId, {
			onSuccess: (invoiceId) => {
				toast.success('Invoice draft created')
				invalidate()
				if (invoiceId) {
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.INVOICES],
					})
				}
			},
			onError: (err) =>
				toast.error(
					err instanceof Error ? err.message : 'Failed to generate invoice',
				),
		})
	}

	const billableExpenses =
		expenses?.filter((e) => e.billable_to_tenant && !e.invoice_id) ?? []
	const total = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0

	return (
		<div className="flex flex-col gap-4 py-2">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					{expenses && expenses.length > 0 && (
						<p className="text-sm font-medium">
							Total:{' '}
							<span className="text-foreground font-semibold">
								{formatAmount(total)}
							</span>
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					{billableExpenses.length > 0 && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleGenerateInvoice}
							disabled={generateInvoice.isPending}
						>
							<FileText className="mr-1.5 h-3.5 w-3.5" />
							{generateInvoice.isPending ? 'Generating...' : 'Generate Invoice'}
						</Button>
					)}
					<Button size="sm" onClick={() => setShowForm((v) => !v)}>
						{showForm ? 'Cancel' : 'Add Expense'}
					</Button>
				</div>
			</div>

			{showForm && (
				<div className="bg-muted/30 rounded-lg border p-4">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex flex-col gap-4"
						>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem className="sm:col-span-2">
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Input {...field} placeholder="Labour, materials..." />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
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
									name="paid_by"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Paid By</FormLabel>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="BUSINESS">Business</SelectItem>
													<SelectItem value="TENANT">Tenant</SelectItem>
													<SelectItem value="OWNER">Owner</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="billable_to_tenant"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg sm:col-span-2">
											<FormLabel>Billable to Tenant</FormLabel>
											<FormControl>
												<Switch
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							</div>
							<div className="flex justify-end">
								<Button
									type="submit"
									size="sm"
									disabled={createExpense.isPending}
								>
									{createExpense.isPending ? 'Saving...' : 'Add Expense'}
								</Button>
							</div>
						</form>
					</Form>
				</div>
			)}

			<Separator />

			{isError ? (
				<div className="flex flex-col items-center gap-2 py-6">
					<AlertCircle className="text-destructive h-5 w-5" />
					<TypographyMuted className="text-sm">
						Failed to load expenses.
					</TypographyMuted>
					<button
						onClick={() => void refetch()}
						className="text-primary text-xs underline underline-offset-2"
					>
						Try again
					</button>
				</div>
			) : isLoading ? (
				<div className="flex flex-col gap-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="bg-muted h-12 animate-pulse rounded-lg" />
					))}
				</div>
			) : !expenses?.length ? (
				<TypographyMuted className="py-4 text-center text-sm">
					No expenses recorded.
				</TypographyMuted>
			) : (
				<div className="flex flex-col gap-2">
					{expenses.map((expense) => (
						<div
							key={expense.id}
							className="flex items-center justify-between rounded-lg border px-4 py-3"
						>
							<div className="flex min-w-0 flex-col gap-0.5">
								<p className="truncate text-sm font-medium">
									{expense.description}
								</p>
								<div className="flex items-center gap-2">
									<TypographyMuted className="text-xs">
										{PAID_BY_LABELS[expense.paid_by]}
									</TypographyMuted>
									{expense.billable_to_tenant && (
										<Badge
											variant="outline"
											className="border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
										>
											Billable
										</Badge>
									)}
									{expense.invoice_id && (
										<Link
											to={`/properties/${propertyId}/financials/invoices/${expense.invoice_id}`}
											className="text-xs text-blue-600 hover:underline dark:text-blue-400"
										>
											Invoiced
										</Link>
									)}
									<TypographyMuted className="text-xs">
										{localizedDayjs(expense.created_at).format('MMM D, YYYY')}
									</TypographyMuted>
								</div>
							</div>
							<div className="flex shrink-0 items-center gap-3">
								<p className="text-sm font-semibold">
									{formatAmount(expense.amount)}
								</p>
								{!expense.invoice_id && (
									<Button
										variant="ghost"
										size="icon"
										className="text-destructive hover:text-destructive h-7 w-7"
										onClick={() => handleDelete(expense.id)}
										disabled={deleteExpense.isPending}
									>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
