import type { ComponentProps, ReactNode } from 'react'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { useIssueInvoice } from '~/api/invoices'
import { RecordPaymentDialog } from '~/components/blocks/record-payment-dialog'
import { Button } from '~/components/ui/button'
import { remainingOn } from '~/lib/invoice'
import { useClient } from '~/providers/client-provider'

interface Props {
	invoice: Invoice
	propertyId: string
	children: ReactNode
	variant?: ComponentProps<typeof Button>['variant']
	size?: ComponentProps<typeof Button>['size']
}

export function RecordPaymentButton({
	invoice,
	propertyId,
	children,
	variant = 'default',
	size = 'sm',
}: Props) {
	const [open, setOpen] = useState(false)
	const { clientUser } = useClient()
	const clientId = clientUser?.client_id ?? ''
	const { mutateAsync: issueInvoice } = useIssueInvoice()
	const { revalidate } = useRevalidator()

	if (!clientId) return null

	return (
		<>
			<Button variant={variant} size={size} onClick={() => setOpen(true)}>
				{children}
			</Button>
			<RecordPaymentDialog
				open={open}
				onOpenChange={setOpen}
				invoice={invoice}
				amount={remainingOn(invoice)}
				clientId={clientId}
				propertyId={propertyId}
				beforeConfirm={
					invoice.status === 'DRAFT'
						? async () => {
								await issueInvoice({
									client_id: clientId,
									property_id: propertyId,
									id: invoice.id,
								})
							}
						: undefined
				}
				onSuccess={() => void revalidate()}
			/>
		</>
	)
}
