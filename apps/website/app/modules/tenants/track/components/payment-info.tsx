import dayjs from 'dayjs'
import { useState } from 'react'
import { useFetcher } from 'react-router'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { cn } from '~/lib/utils'

interface Props {
	invoice: TrackingInvoice | null
	code: string
}

const STATUS_STYLES: Record<string, string> = {
	DRAFT: 'bg-zinc-100 text-zinc-600',
	ISSUED: 'bg-blue-100 text-blue-700',
	PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700',
	PAID: 'bg-green-100 text-green-700',
	VOID: 'bg-red-100 text-red-700',
}

const PROVIDERS = ['MTN', 'VODAFONE', 'AIRTELTIGO', 'CASH', 'BANK_API']

export function PaymentInfo({ invoice }: Props) {
	const fetcher = useFetcher<{
		paymentSuccess?: boolean
		error?: string | null
	}>()
	const [showPayForm, setShowPayForm] = useState(false)
	const [provider, setProvider] = useState<string>('')
	const [reference, setReference] = useState('')
	const isSubmitting = fetcher.state !== 'idle'

	// React to submission result
	const lastSuccess = fetcher.data?.paymentSuccess
	const lastError = fetcher.data?.error

	if (!invoice) {
		return (
			<div className="rounded-lg border bg-white p-6">
				<h3 className="text-sm font-semibold text-zinc-900">Payment</h3>
				<p className="mt-3 text-sm text-zinc-400">No payment information yet</p>
			</div>
		)
	}

	const canPay =
		invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID'

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!provider) {
			toast.error('Please select a payment method')
			return
		}
		const form = e.currentTarget
		const formData = new FormData(form)
		formData.set('intent', 'payInvoice')
		formData.set('invoice_id', invoice.id)
		formData.set('provider', provider)
		formData.set('amount', String(invoice.total_amount))
		await fetcher.submit(formData, { method: 'POST' })
	}

	return (
		<div className="rounded-lg border bg-white p-6">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-zinc-900">Payment</h3>
				<span
					className={cn(
						'rounded-full px-2.5 py-0.5 text-xs font-medium',
						STATUS_STYLES[invoice.status] ?? STATUS_STYLES.DRAFT,
					)}
				>
					{invoice.status.replace('_', ' ')}
				</span>
			</div>

			<div className="mt-3 space-y-1 text-sm text-zinc-500">
				<p>
					Invoice:{' '}
					<span className="font-medium text-zinc-700">{invoice.code}</span>
				</p>
				{invoice.due_date && (
					<p>
						Due:{' '}
						<span className={cn('text-zinc-700')}>
							{dayjs(invoice.due_date).format('LL')}
						</span>
					</p>
				)}
				{invoice.paid_at && (
					<p>
						Paid:{' '}
						<span className="text-green-600">
							{dayjs(invoice.paid_at).format('LL')}
						</span>
					</p>
				)}
			</div>

			{/* Line items */}
			{invoice.line_items.length > 0 && (
				<div className="mt-4">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b text-left text-xs text-zinc-400">
								<th className="pb-2 font-medium">Item</th>
								<th className="pb-2 text-right font-medium">Amount</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{invoice.line_items.map((item, idx) => (
								<tr key={idx}>
									<td className="py-2 text-zinc-600">{item.label}</td>
									<td className="py-2 text-right text-zinc-700">
										{formatAmount(convertPesewasToCedis(item.total_amount))}
									</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr className="border-t">
								<td className="pt-2 font-semibold text-zinc-900">Total</td>
								<td className="pt-2 text-right font-semibold text-zinc-900">
									{formatAmount(convertPesewasToCedis(invoice.total_amount))}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			)}

			{/* Success banner */}
			{lastSuccess && (
				<div className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
					Payment submitted successfully. Your property manager will verify it
					shortly.
				</div>
			)}

			{/* Error banner */}
			{lastError && !lastSuccess && (
				<div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
					{lastError}
				</div>
			)}

			{/* Pay Now button / form */}
			{canPay && !lastSuccess && (
				<div className="mt-5">
					{!showPayForm ? (
						<Button
							onClick={() => setShowPayForm(true)}
							className="w-full bg-rose-600 hover:bg-rose-500"
							size="sm"
						>
							Pay Now
						</Button>
					) : (
						<form onSubmit={handleSubmit} className="space-y-3">
							<div className="space-y-1">
								<Label className="text-xs text-zinc-600">Payment Method</Label>
								<Select value={provider} onValueChange={setProvider}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select method" />
									</SelectTrigger>
									<SelectContent>
										{PROVIDERS.map((p) => (
											<SelectItem key={p} value={p}>
												{p.replace('_', ' ')}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1">
								<Label className="text-xs text-zinc-600">
									Reference (optional)
								</Label>
								<Input
									name="reference"
									value={reference}
									onChange={(e) => setReference(e.target.value)}
									placeholder="e.g. receipt number"
									className="text-sm"
								/>
							</div>

							<div className="flex gap-2">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setShowPayForm(false)}
									disabled={isSubmitting}
									className="flex-1"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									size="sm"
									disabled={isSubmitting || !provider}
									className="flex-1 bg-rose-600 hover:bg-rose-500"
								>
									{isSubmitting ? (
										<>
											<Spinner className="mr-2" />
											Submitting...
										</>
									) : (
										`Confirm ${formatAmount(convertPesewasToCedis(invoice.total_amount))}`
									)}
								</Button>
							</div>
						</form>
					)}
				</div>
			)}
		</div>
	)
}
