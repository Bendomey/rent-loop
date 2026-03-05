import {
	CircleCheck,
	CircleDollarSign,
	CircleX,
	Pencil,
	Send,
} from 'lucide-react'
import { useLoaderData } from 'react-router'
import { PropertyFinancialsPaymentLineItemsModule } from './line-items'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { TypographyH3, TypographyMuted } from '~/components/ui/typography'
import { formatAmount } from '~/lib/format-amount'
import {
	getInvoiceAllowedRailsLabel,
	getInvoicePayerTypeLabel,
	getInvoiceStatusLabel,
} from '~/lib/invoice'
import type { loader } from '~/routes/_auth.properties.$propertyId.financials.payments.$paymentId'



export function PropertyFinancialsPaymentModule() {
		const { payment: data } = useLoaderData<typeof loader>()
	return (
		<div className="m-6 grid grid-cols-12 gap-10">
			<div className="col-span-3">
				<Card className="shadow-sm">
					<CardHeader >
						<Badge
							variant="outline"
							className="w-fit gap-1 px-2 py-1 text-xs font-medium"
						>
							{data?.status === 'DRAFT' ? (
								<Pencil className="text-slate-600" size={14} />
							) : data?.status === 'ISSUED' ? (
								<Send className="text-blue-600" size={14} />
							) : data?.status === 'PAID' ? (
								<CircleCheck className="fill-green-600 text-white" size={14} />
							) : data?.status === 'PARTIALLY_PAID' ? (
								<CircleDollarSign className="text-yellow-600" size={14} />
							) : (
								<CircleX className="fill-red-500 text-white" size={14} />
							)}
							{getInvoiceStatusLabel(data?.status || 'DRAFT')}
						</Badge>
						<div className="pt-2">
							<h2 className="text-xl font-semibold tracking-tight">
								Invoice {data?.code}
							</h2>
							<p className="text-muted-foreground text-sm">
								{data?.context_type?.replace('_', ' ')}
							</p>
						</div>
					</CardHeader>

					<CardContent className="space-y-8 text-sm">
						{/* totals */}
						<div>
							<div className="space-y-1 pt-4 pb-2">
								<TypographyMuted className="text-muted-foreground text-xs font-semibold tracking-wide">
									Payment Summary
								</TypographyMuted>
								<Separator />
							</div>
							<div className="bg-muted/40 space-y-2 rounded-lg p-4">
								<div className="text-muted-foreground flex justify-between">
									<span>Tax</span>
									<span>{formatAmount(data?.taxes || 0)}</span>
								</div>
								<div className="text-muted-foreground flex justify-between">
									<span>Sub total</span>
									<span>{formatAmount(data?.sub_total || 0)}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Total</span>
									<span className="font-semibold">
										{formatAmount(data?.total_amount || 0)}
									</span>
								</div>
							</div>
						</div>

						{/* metadata */}
						<div className="grid grid-cols-1 gap-4 text-sm">
							<div className="space-y-1 pt-2">
								<TypographyMuted className="text-muted-foreground text-xs font-semibold tracking-wide">
									Payment Details
								</TypographyMuted>
								<Separator />
							</div>
							<div className="grid grid-cols-2 gap-6">
							<div>
								<TypographyMuted>Rails</TypographyMuted>
								<p className="font-medium text-zinc-600">
									{data?.allowed_payment_rails
  ?.map((rail: Invoice["allowed_payment_rails"][number]) => getInvoiceAllowedRailsLabel(rail))
  .join(', ')}
								</p>
							</div>

								<div>
									<TypographyMuted>Payer Type</TypographyMuted>
									<p className="font-medium text-zinc-600">
										{getInvoicePayerTypeLabel(data?.payer_type || 'TENANT')}
									</p>
								</div>
							</div>

							<div className="space-y-1 pt-4">
								<TypographyMuted className="text-muted-foreground text-xs font-semibold tracking-wide">
									Dates
								</TypographyMuted>
								<Separator />
							</div>
							<div className="flex justify-between">
								<TypographyMuted>Issued</TypographyMuted>
								<p className="font-medium">
									{data?.issued_at ?
										new Date(data?.issued_at).toLocaleDateString() : 'N/A'}
								</p>
							</div>
							<div className="flex justify-between">
								<TypographyMuted>Due</TypographyMuted>
								<p className="font-medium">
									{data?.due_date ?
										new Date(data?.due_date).toLocaleDateString() : 'N/A'}
								</p>
							</div>
								<div className="flex justify-between">
									<TypographyMuted>Paid</TypographyMuted>
									<p className="font-medium">
										{data?.paid_at ? new Date(data?.paid_at).toLocaleDateString() : 'Not paid'}
									</p>
								</div>
								<div className="flex justify-between">
									<TypographyMuted>Voided</TypographyMuted>
									<p className="font-medium">
										{data?.voided_at ? new Date(data?.voided_at).toLocaleDateString() : 'N/A'}
									</p>
								</div>
						</div>
					</CardContent>
				</Card>
			</div>
			<div className="col-span-9">
				<Tabs defaultValue="payments" className="w-full">
					<TabsList>
						<TabsTrigger value="payments">Invioce Items</TabsTrigger>
						<TabsTrigger value="payer">Payer</TabsTrigger>
					</TabsList>
					<TabsContent value="payments">
						{data && (
							<PropertyFinancialsPaymentLineItemsModule
								data={data}
							/>
						)}
					</TabsContent>
					<TabsContent value="payer">
						<TypographyH3 className="pt-4">Payer Details</TypographyH3>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
