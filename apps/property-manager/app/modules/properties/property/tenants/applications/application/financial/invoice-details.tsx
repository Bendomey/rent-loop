import { CheckCircle2, Clock, Receipt, Send } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { formatAmount } from '~/lib/format-amount'

const COOLDOWN_SECONDS = 60

const STATUS_CONFIG: Record<
	Invoice['status'],
	{ label: string; icon: typeof CheckCircle2; className: string }
> = {
	DRAFT: {
		label: 'Draft',
		icon: Clock,
		className: 'bg-zinc-50 text-zinc-600 border-zinc-200',
	},
	ISSUED: {
		label: 'Waiting for payment',
		icon: Clock,
		className: 'bg-amber-50 text-amber-700 border-amber-200',
	},
	PARTIALLY_PAID: {
		label: 'Partially paid',
		icon: Clock,
		className: 'bg-amber-50 text-amber-700 border-amber-200',
	},
	PAID: {
		label: 'Paid',
		icon: CheckCircle2,
		className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	},
	VOID: {
		label: 'Voided',
		icon: Clock,
		className: 'bg-zinc-50 text-zinc-500 border-zinc-200',
	},
}

interface InvoiceDetailsProps {
	invoice: Invoice
	onReconfigure: () => void
}

export function InvoiceDetails({
	invoice,
	onReconfigure,
}: InvoiceDetailsProps) {
	const [countdown, setCountdown] = useState(COOLDOWN_SECONDS)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const isOnCooldown = countdown < COOLDOWN_SECONDS && countdown > 0

	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [])

	const handleNotify = useCallback(() => {
		// TODO: call API to notify tenant to make payment
		setCountdown(COOLDOWN_SECONDS - 1)
		intervalRef.current = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					if (intervalRef.current) clearInterval(intervalRef.current)
					return COOLDOWN_SECONDS
				}
				return prev - 1
			})
		}, 1000)
	}, [])

	const statusConfig = STATUS_CONFIG[invoice.status]
	const StatusIcon = statusConfig.icon

	return (
		<Card className="shadow-none">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<CardTitle>Initial Payment Invoice</CardTitle>
						<CardDescription>
							Invoice has been generated for the tenant.
						</CardDescription>
					</div>
					<Badge variant="outline" className={statusConfig.className}>
						<StatusIcon className="mr-1 size-3" />
						{statusConfig.label}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="space-y-3 rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<Receipt className="size-4 text-zinc-500" />
						<h3 className="text-sm font-medium">Invoice Details</h3>
					</div>

					<div className="space-y-2">
						{invoice.line_items.map((item) => (
							<div
								key={item.id}
								className="flex items-center justify-between text-sm"
							>
								<span className="text-zinc-500">
									{item.label} x {item.quantity}
								</span>
								<span>{formatAmount(item.total_amount)}</span>
							</div>
						))}

						<Separator />

						<div className="flex items-center justify-between text-sm font-semibold">
							<span>Total</span>
							<span>{formatAmount(invoice.total_amount)}</span>
						</div>
					</div>
				</div>

				{invoice.status === 'ISSUED' && (
					<div className="flex items-center gap-3">
						<Button
							size="sm"
							variant="outline"
							disabled={isOnCooldown}
							onClick={handleNotify}
						>
							<Send className="size-4" />
							{isOnCooldown
								? `Resend in ${countdown}s`
								: 'Notify Tenant to Pay'}
						</Button>
						{isOnCooldown && (
							<p className="text-xs text-zinc-400">
								A payment notification has been sent to the tenant.
							</p>
						)}
					</div>
				)}
			</CardContent>

			<CardFooter className="flex justify-end">
				<Button variant="outline" onClick={onReconfigure}>
					Reconfigure
				</Button>
			</CardFooter>
		</Card>
	)
}
