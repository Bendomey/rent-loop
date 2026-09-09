import { Check, Mail, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { RecordPaymentButton } from './record-payment-button'
import type { InvoiceState } from './state'
import { Button } from '~/components/ui/button'

interface Props {
	invoice: Invoice
	state: InvoiceState
	propertyId?: string
}

export function InvoiceAnswer({ invoice, state, propertyId }: Props) {
	const unsettled = state.key !== 'paid' && state.key !== 'void'

	return (
		<div className="flex flex-wrap items-end justify-between gap-6 print:hidden">
			<div className="max-w-2xl">
				<h1 className="text-foreground text-2xl font-semibold tracking-tight text-pretty sm:text-[28px]">
					{state.headline}
				</h1>
				<p className="text-muted-foreground mt-2 leading-relaxed text-pretty">
					{state.detail}
				</p>
			</div>
			<div className="flex flex-wrap gap-2">
				{propertyId && unsettled && (
					<RecordPaymentButton invoice={invoice} propertyId={propertyId}>
						<Check />
						They paid — record it
					</RecordPaymentButton>
				)}
				{unsettled && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => toast('Sending it again is coming soon')}
					>
						<Mail />
						Send it again
					</Button>
				)}
				<Button variant="outline" size="sm" onClick={() => window.print()}>
					<Printer />
					Print
				</Button>
			</div>
		</div>
	)
}
