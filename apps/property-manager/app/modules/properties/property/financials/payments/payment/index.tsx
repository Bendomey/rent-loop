import {
	CircleCheck,
	CircleDollarSign,
	CircleX,
	Pencil,
	Send,
} from 'lucide-react'
import { useLocation, useParams } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useProperty } from '~/providers/property-provider'
import { formatAmount } from '~/lib/format-amount'
import { PropertyFinancialsPaymentLineItemsModule } from './line-items'
import { TypographyH3, TypographyMuted } from '~/components/ui/typography'
import {
	getInvoicePayeeTypeLabel,
	getInvoicePayerTypeLabel,
	getInvoiceStatusLabel,
} from '~/lib/invoice'

// TODO: fetch real payment data from API
const payment: any = {
	allowed_payment_rails: ['MOMO', 'BANK'],
	code: 'INV-2024-0001',
	context_type: 'LEASE_RENT',
	created_at: '2024-06-01T09:00:00Z',
	currency: 'GHS',
	due_date: '2024-07-01T00:00:00Z',
	id: '4fce5dc8-8114-4ab2-a94b-b4536c27f43b',
	issued_at: '2024-06-15T00:00:00Z',
	line_items: [
		{
			category: 'RENT',
			id: '4fce5dc8-8114-4ab2-a94b-b4536c27f43b',
			label: 'January Rent',
			quantity: 1,
			total_amount: 100000,
			created_at: '2024-06-01T09:00:00Z',
			unit_amount: 100000,
			updated_at: '2024-06-01T09:00:00Z',
			currency: 'GHS',
			invoice_id: '4fce5dc8-8114-4ab2-a94b-b4536c27f43b',
		},
	],
	paid_at: '2024-06-20T00:00:00Z',
	payee_type: 'PROPERTY_OWNER',
	payer_type: 'TENANT',
	status: 'DRAFT',
	sub_total: 100000,
	taxes: 0,
	total_amount: 100000,
	voided_at: '2024-06-25T00:00:00Z',
}

export function PropertyFinancialsPaymentModule() {
	return (
		<div className="m-6 grid grid-cols-12 gap-10">
			<div className="col-span-3">
				<Card className="shadow-sm">
					<CardHeader>
						<Badge
							variant="outline"
							className="w-fit gap-1 px-2 py-1 text-xs font-medium"
						>
							{payment.status === 'DRAFT' ? (
								<Pencil className="text-slate-600" size={14} />
							) : payment.status === 'ISSUED' ? (
								<Send className="text-blue-600" size={14} />
							) : payment.status === 'PAID' ? (
								<CircleCheck className="fill-green-600 text-white" size={14} />
							) : payment.status === 'PARTIALLY_PAID' ? (
								<CircleDollarSign className="text-yellow-600" size={14} />
							) : (
								<CircleX className="fill-red-500 text-white" size={14} />
							)}
							{getInvoiceStatusLabel(payment.status)}
						</Badge>
						<div className="pt-2">
							<h2 className="text-xl font-semibold tracking-tight">
								Invoice {payment.code}
							</h2>
							<p className="text-muted-foreground text-sm">
								{payment.context_type?.replace('_', ' ')}
							</p>
						</div>
					</CardHeader>

					<CardContent className="space-y-8 text-sm">
						{/* totals */}
						<div>
							<div className="space-y-1 pt-4 pb-2">
								<TypographyMuted className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
									Payment Summary
								</TypographyMuted>
								<Separator />
							</div>
							<div className="bg-muted/40 space-y-2 rounded-lg p-4">
								<div className="text-muted-foreground flex justify-between">
									<span>Tax</span>
									<span>{formatAmount(payment.taxes || 0)}</span>
								</div>
								<div className="text-muted-foreground flex justify-between">
									<span>Sub total</span>
									<span>{formatAmount(payment.sub_total || 0)}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Total</span>
									<span className="font-semibold">
										{formatAmount(payment.total_amount || 0)}
									</span>
								</div>
							</div>
						</div>

						{/* metadata */}
						<div className="grid grid-cols-1 gap-4 text-sm">
							<div className="space-y-1 pt-4">
								<TypographyMuted className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
									Payment Details
								</TypographyMuted>
								<Separator />
							</div>
							<div>
								<TypographyMuted>Rails</TypographyMuted>
								<p className="font-medium text-zinc-600">
									{payment.allowed_payment_rails?.join(', ')}
								</p>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<TypographyMuted>Payer Type</TypographyMuted>
									<p className="font-medium text-zinc-600">
										{getInvoicePayerTypeLabel(payment.payer_type)}
									</p>
								</div>
								<div>
									<TypographyMuted>Payee Type</TypographyMuted>
									<p className="font-medium text-zinc-600">
										{getInvoicePayeeTypeLabel(payment.payee_type)}
									</p>
								</div>
							</div>

							<div className="space-y-1 pt-4">
								<TypographyMuted className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
									Dates
								</TypographyMuted>
								<Separator />
							</div>
							<div className="flex justify-between">
								<TypographyMuted>Issued</TypographyMuted>
								<p className="font-medium">
									{payment.issued_at &&
										new Date(payment.issued_at).toLocaleDateString()}
								</p>
							</div>
							<div className="flex justify-between">
								<TypographyMuted>Due</TypographyMuted>
								<p className="font-medium">
									{payment.due_date &&
										new Date(payment.due_date).toLocaleDateString()}
								</p>
							</div>
							{payment.paid_at && (
								<div className="flex justify-between">
									<TypographyMuted>Paid</TypographyMuted>
									<p className="font-medium">
										{new Date(payment.paid_at).toLocaleDateString()}
									</p>
								</div>
							)}
							{payment.voided_at && (
								<div className="flex justify-between">
									<TypographyMuted>Voided</TypographyMuted>
									<p className="font-medium">
										{new Date(payment.voided_at).toLocaleDateString()}
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
			<div className="col-span-9">
				<Tabs defaultValue="payments" className="w-full">
					<TabsList>
						<TabsTrigger value="payments">Payments</TabsTrigger>
						<TabsTrigger value="payer">Payer</TabsTrigger>
						<TabsTrigger value="payee">Payee</TabsTrigger>
					</TabsList>
					<TabsContent value="payments">
						<PropertyFinancialsPaymentLineItemsModule
							data={payment.line_items}
						/>
					</TabsContent>
					<TabsContent value="payer">
						<TypographyH3 className="pt-4">Payer Details</TypographyH3>
					</TabsContent>
					<TabsContent value="payee">
						<TypographyH3 className="pt-4">Payee Details</TypographyH3>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
