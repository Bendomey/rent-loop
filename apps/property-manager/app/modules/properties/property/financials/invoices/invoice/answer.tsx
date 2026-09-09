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
		<div className="flex flex-wrap items-end justify-between print:hidden">
			<div className="max-w-2xl">
				<h1 className="text-foreground text-2xl font-semibold tracking-tight text-pretty sm:text-[28px]">
					{state.headline}
				</h1>
			</div>
			<div className="flex w-full flex-col items-start justify-between gap-2 lg:flex-row lg:flex-wrap lg:items-center">
				<p className="text-muted-foreground mt-2 leading-relaxed text-pretty lg:max-w-2xl lg:grow lg:basis-[max-content]">
					{state.detail}
				</p>
				<div className="flex shrink-0 flex-wrap gap-2">
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
		</div>
	)
}
