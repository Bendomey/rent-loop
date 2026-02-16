import { AlertCircle, FileText } from 'lucide-react'
import { useState } from 'react'
import { InvoiceDetails } from './invoice-details'
import { InvoiceSummary } from './invoice-summary'
import { PaymentModeSelector } from './payment-mode-selector'
import type { PaymentMode } from './payment-mode-selector'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'

interface InitialPaymentSetupProps {
	hasFinancialChanges: boolean
	stayDuration: number | null
	stayDurationFrequency: string | null
	rentAmount: number
	paymentFrequency: string
	securityDepositEnabled: boolean
	securityDepositAmount: number
}

export function InitialPaymentSetup({
	hasFinancialChanges,
	stayDuration,
	stayDurationFrequency,
	rentAmount,
	paymentFrequency,
	securityDepositEnabled,
	securityDepositAmount,
}: InitialPaymentSetupProps) {
	const [paymentMode, setPaymentMode] =
		useState<PaymentMode>('ONE_TIME_PAYMENT')
	const [customPeriods, setCustomPeriods] = useState(1)
	const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null)

	if (hasFinancialChanges) {
		return (
			<Alert variant="default" className="border-yellow-600 bg-yellow-50">
				<AlertCircle className="size-4" />
				<AlertTitle>Unsaved financial changes</AlertTitle>
				<AlertDescription>
					Please save your financial setup changes before configuring the
					initial payment.
				</AlertDescription>
			</Alert>
		)
	}

	if (!stayDuration || !stayDurationFrequency) {
		return (
			<Alert variant="default" className="border-yellow-600 bg-yellow-50">
				<AlertCircle className="size-4" />
				<AlertTitle>Stay duration required</AlertTitle>
				<AlertDescription>
					Please set the stay duration in the Move In Setup tab before
					configuring the initial payment.
				</AlertDescription>
			</Alert>
		)
	}

	if (generatedInvoice) {
		return (
			<InvoiceDetails
				invoice={generatedInvoice}
				onReconfigure={() => setGeneratedInvoice(null)}
			/>
		)
	}

	const periods =
		paymentMode === 'ONE_TIME_PAYMENT' ? stayDuration : customPeriods

	const depositTotal = securityDepositEnabled ? securityDepositAmount : 0
	const totalAmount = rentAmount * periods + depositTotal

	const hasChanges = paymentMode !== 'ONE_TIME_PAYMENT' || customPeriods !== 1

	const handleGenerateInvoice = () => {
		const lineItems: Array<InvoiceLineItem> = [
			{
				id: crypto.randomUUID(),
				invoice_id: null,
				label: `Rent (${paymentFrequency.toLowerCase()})`,
				category: 'RENT',
				quantity: periods,
				unit_amount: rentAmount,
				total_amount: rentAmount * periods,
				currency: 'GHS',
				metadata: null,
				created_at: new Date(),
				updated_at: new Date(),
			},
		]

		if (securityDepositEnabled && securityDepositAmount > 0) {
			lineItems.push({
				id: crypto.randomUUID(),
				invoice_id: null,
				label: 'Security deposit',
				category: 'SECURITY_DEPOSIT',
				quantity: 1,
				unit_amount: securityDepositAmount,
				total_amount: securityDepositAmount,
				currency: 'GHS',
				metadata: null,
				created_at: new Date(),
				updated_at: new Date(),
			})
		}

		// TODO: replace with actual API call to generate invoice
		setGeneratedInvoice({
			id: crypto.randomUUID(),
			code: 'INV-DRAFT',
			payer_type: 'TENANT_APPLICATION',
			payer_client_id: null,
			payer_client: null,
			payer_property_id: null,
			payer_property: null,
			payer_tenant_id: null,
			payer_tenant: null,
			payee_type: 'PROPERTY_OWNER',
			payee_client_id: null,
			payee_client: null,
			context_type: 'TENANT_APPLICATION',
			context_tenant_application_id: null,
			context_tenant_application: null,
			context_lease: null,
			context_lease_id: null,
			context_maintenance_request_id: null,
			total_amount: totalAmount,
			taxes: 0,
			sub_total: totalAmount,
			currency: 'GHS',
			status: 'ISSUED',
			due_date: null,
			issued_at: new Date(),
			paid_at: null,
			voided_at: null,
			allowed_payment_rails: ['MOMO', 'BANK_TRANSFER'],
			line_items: lineItems,
			created_at: new Date(),
			updated_at: new Date(),
		})
	}

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>Initial Payment Setup</CardTitle>
				<CardDescription>
					Configure the initial payment the tenant needs to make.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-4">
				<PaymentModeSelector
					paymentMode={paymentMode}
					customPeriods={customPeriods}
					stayDuration={stayDuration}
					stayDurationFrequency={stayDurationFrequency}
					onPaymentModeChange={setPaymentMode}
					onCustomPeriodsChange={setCustomPeriods}
				/>

				<InvoiceSummary
					rentAmount={rentAmount}
					paymentFrequency={paymentFrequency}
					periods={periods}
					securityDepositEnabled={securityDepositEnabled}
					securityDepositAmount={securityDepositAmount}
					totalAmount={totalAmount}
				/>
			</CardContent>

			<CardFooter className="flex justify-end">
				<div className="flex flex-row items-center space-x-2">
					{hasChanges ? (
						<Button disabled>Save</Button>
					) : (
						<Button disabled={totalAmount <= 0} onClick={handleGenerateInvoice}>
							<FileText className="size-4" />
							Generate Invoice
						</Button>
					)}
				</div>
			</CardFooter>
		</Card>
	)
}
