import {
	CircleCheck,
	CircleDollarSign,
	CircleX,
	Pencil,
	Send,
} from 'lucide-react'
import { Link, useLoaderData } from 'react-router'
import { PropertyFinancialsPaymentLineItemsModule } from './line-items'
import { PropertyFinancialsPaymentPayerModule } from './payer'
import { PropertyFinancialsPaymentItemsModule } from './payments'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { TypographyMuted } from '~/components/ui/typography'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import {
	getInvoiceAllowedRailsLabel,
	getInvoicePayerTypeLabel,
	getInvoiceStatusLabel,
} from '~/lib/invoice'
import type { loader } from '~/routes/_auth.properties.$propertyId.financials.invoices.$invoiceId'

export function PropertyFinancialsPaymentModule() {
	const { invoice: data, clientUserProperty } = useLoaderData<typeof loader>()

	return (
		<div className="m-6 grid grid-cols-1 gap-10 lg:grid-cols-12">
			<div className="lg:col-span-5 xl:col-span-4">
				<Card className="shadow-sm">
					<CardHeader>
						<Badge
							variant="outline"
							className="w-fit gap-1 px-2 py-1 text-xs font-medium"
						>
							{data?.status === 'DRAFT' ? (
								<Pencil className="text-zinc-600" size={14} />
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

							{data?.context_type === 'TENANT_APPLICATION' ? (
								<Link
									to={`/properties/${clientUserProperty?.property_id}/tenants/applications/${data?.context_tenant_application_id}`}
									className="text-sm text-blue-600 capitalize hover:underline dark:text-blue-500"
								>
									{data?.context_type?.replace('_', ' ').toLowerCase()}
								</Link>
							) : data?.context_type === 'MAINTENANCE' ? (
								<Link
									to={`/properties/${clientUserProperty?.property_id}/activities/maintenance-requests/${data?.context_maintenance_request_id}`}
									className="text-sm text-blue-600 hover:underline"
								>
									{data?.context_type?.replace('_', ' ')}
								</Link>
							) : (
								<p className="text-muted-foreground text-sm">
									{data?.context_type?.replace('_', ' ')}
								</p>
							)}
						</div>
					</CardHeader>

					<CardContent className="space-y-8 text-sm">
						{/* totals */}
						<div>
							<div className="space-y-1 pt-4 pb-2">
								<TypographyMuted className="text-muted-foreground text-xs font-semibold tracking-wide dark:text-white">
									Payment Summary
								</TypographyMuted>
								<Separator />
							</div>
							<div className="bg-muted/40 space-y-2 rounded-lg p-4">
								<div className="text-muted-foreground flex justify-between">
									<span>Tax</span>
									<span>
										{formatAmount(convertPesewasToCedis(data?.taxes || 0))}
									</span>
								</div>
								<div className="text-muted-foreground flex justify-between">
									<span>Sub total</span>
									<span>
										{formatAmount(convertPesewasToCedis(data?.sub_total || 0))}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Total</span>
									<span className="font-semibold">
										{formatAmount(
											convertPesewasToCedis(data?.total_amount || 0),
										)}
									</span>
								</div>
							</div>
						</div>

						{/* metadata */}
						<div className="grid grid-cols-1 gap-4 text-sm">
							<div className="space-y-1 pt-2">
								<TypographyMuted className="text-muted-foreground text-xs font-semibold tracking-wide dark:text-white">
									Payment Details
								</TypographyMuted>
								<Separator />
							</div>
							<div className="grid grid-cols-2 gap-6">
								<div>
									<TypographyMuted>Allowed Modes</TypographyMuted>
									<p className="font-medium text-zinc-600">
										{data?.allowed_payment_rails
											?.map((rail: Invoice['allowed_payment_rails'][number]) =>
												getInvoiceAllowedRailsLabel(rail),
											)
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
							{data?.issued_at ? (
								<div className="flex justify-between">
									<TypographyMuted>Issued</TypographyMuted>
									<p className="font-medium">
										{new Date(data?.issued_at).toLocaleDateString()}
									</p>
								</div>
							) : null}

							{data?.due_date ? (
								<div className="flex justify-between">
									<TypographyMuted>Due</TypographyMuted>
									<p className="font-medium">
										{new Date(data?.due_date).toLocaleDateString()}
									</p>
								</div>
							) : null}

							{data?.paid_at ? (
								<div className="flex justify-between">
									<TypographyMuted>Paid</TypographyMuted>
									<p className="font-medium">
										{new Date(data?.paid_at).toLocaleDateString()}
									</p>
								</div>
							) : null}

							{data?.voided_at ? (
								<div className="flex justify-between">
									<TypographyMuted>Voided</TypographyMuted>
									<p className="font-medium">
										{new Date(data?.voided_at).toLocaleDateString()}
									</p>
								</div>
							) : null}
						</div>
					</CardContent>
				</Card>
			</div>
			<div className="lg:col-span-7 xl:col-span-8">
				<Tabs defaultValue="line-items" className="w-full">
					<TabsList>
						<TabsTrigger value="line-items">Invoice Items</TabsTrigger>
						<TabsTrigger value="payments">Payments</TabsTrigger>
						{data?.payer_type === 'TENANT' ||
						data?.payer_type === 'TENANT_APPLICATION' ? (
							<TabsTrigger value="payer">Payer Details</TabsTrigger>
						) : null}
					</TabsList>
					<TabsContent value="line-items">
						{data && <PropertyFinancialsPaymentLineItemsModule data={data} />}
					</TabsContent>
					<TabsContent value="payments">
						{data && <PropertyFinancialsPaymentItemsModule data={data} />}
					</TabsContent>
					<TabsContent value="payer">
						{data && <PropertyFinancialsPaymentPayerModule data={data} />}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
