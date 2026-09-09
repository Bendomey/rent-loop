import { useLoaderData, useParams } from 'react-router'
import { InvoiceAnswer } from './answer'
import { InvoicePayerSection } from './payer-section'
import { InvoicePaymentsSection } from './payments-section'
import { InvoiceSheet } from './sheet'
import { deriveInvoiceState, payerNameOf } from './state'
import {
	getInvoiceContextTypeLabel,
	getInvoicePayerTypeLabel,
} from '~/lib/invoice'
import type { loader } from '~/routes/_auth.properties.$propertyId.financials.invoices.$invoiceId'

export function PropertyFinancialsPaymentModule() {
	const { invoice, clientUserProperty } = useLoaderData<typeof loader>()
	const params = useParams()

	if (!invoice) {
		return (
			<div className="text-muted-foreground m-6 text-sm">
				Invoice not found.
			</div>
		)
	}

	const payerName = payerNameOf(invoice)
	const state = deriveInvoiceState(invoice, payerName?.split(' ')[0])
	const unit = invoice.payer_lease?.unit
	const unitLabel = unit
		? [
				unit.property_block?.name && `${unit.property_block.name} block`,
				unit.name,
			]
				.filter(Boolean)
				.join(' · ')
		: undefined
	const propertyId =
		params.propertyId ??
		clientUserProperty?.property_id ??
		invoice.property_id ??
		undefined

	return (
		<div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
			<InvoiceAnswer invoice={invoice} state={state} propertyId={propertyId} />
			<InvoiceSheet
				invoice={invoice}
				state={state}
				kind={getInvoiceContextTypeLabel(invoice.context_type)}
				propertyName={
					invoice.property?.name ?? clientUserProperty?.property?.name
				}
				unitLabel={unitLabel}
				payerName={payerName}
				payerMeta={[getInvoicePayerTypeLabel(invoice.payer_type), unit?.name]
					.filter(Boolean)
					.join(' · ')}
				payerPhone={invoice.payer_lease?.tenant?.phone ?? undefined}
				leaseCode={invoice.payer_lease?.code}
			/>
			<InvoicePaymentsSection invoice={invoice} propertyId={propertyId} />
			<InvoicePayerSection invoice={invoice} propertyId={propertyId} />
		</div>
	)
}
