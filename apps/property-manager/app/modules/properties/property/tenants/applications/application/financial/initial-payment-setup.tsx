import { AlertCircle, CalendarIcon, FileText } from 'lucide-react'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { InvoiceDetails } from './invoice-details'
import { InvoiceSummary } from './invoice-summary'
import { PaymentModeSelector } from './payment-mode-selector'
import type { PaymentMode } from './payment-mode-selector'
import {
	useAdminUpdateTenantApplication,
	useGenerateApplicationPaymentInvoice,
} from '~/api/tenant-applications'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover'
import { Spinner } from '~/components/ui/spinner'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
} from '~/lib/format-amount'
import { cn } from '~/lib/utils'

interface InitialPaymentSetupProps {
	applicationId: string
	existingInvoice: Invoice | null
	hasFinancialChanges: boolean
	stayDuration: number | null
	stayDurationFrequency: string | null
	rentAmount: number
	paymentFrequency: string
	securityDepositEnabled: boolean
	securityDepositAmount: number
	initialDepositFee: number | null
}

function derivePaymentMode(
	initialDepositFeePesewas: number | null,
	rentAmountCedis: number,
	stayDuration: number,
): { paymentMode: PaymentMode; customPeriods: number } {
	if (!initialDepositFeePesewas || !rentAmountCedis) {
		return { paymentMode: 'ONE_TIME_PAYMENT', customPeriods: 1 }
	}
	const periods = Math.round(
		convertPesewasToCedis(initialDepositFeePesewas) / rentAmountCedis,
	)
	if (!periods || periods >= stayDuration) {
		return { paymentMode: 'ONE_TIME_PAYMENT', customPeriods: 1 }
	}
	return { paymentMode: 'CUSTOM', customPeriods: periods }
}

export function InitialPaymentSetup({
	applicationId,
	existingInvoice,
	hasFinancialChanges,
	stayDuration,
	stayDurationFrequency,
	rentAmount,
	paymentFrequency,
	securityDepositEnabled,
	securityDepositAmount,
	initialDepositFee,
}: InitialPaymentSetupProps) {
	const revalidator = useRevalidator()

	const derived = stayDuration
		? derivePaymentMode(initialDepositFee, rentAmount, stayDuration)
		: { paymentMode: 'ONE_TIME_PAYMENT' as PaymentMode, customPeriods: 1 }

	const [paymentMode, setPaymentMode] = useState<PaymentMode>(
		derived.paymentMode,
	)
	const [customPeriods, setCustomPeriods] = useState(derived.customPeriods)
	const [showGenerateDialog, setShowGenerateDialog] = useState(false)
	const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

	const { isPending: isUpdating, mutateAsync: updateApplication } =
		useAdminUpdateTenantApplication()
	const { isPending: isGenerating, mutateAsync: generateInvoice } =
		useGenerateApplicationPaymentInvoice()

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

	if (existingInvoice) {
		return (
			<InvoiceDetails invoice={existingInvoice} applicationId={applicationId} />
		)
	}

	const periods =
		paymentMode === 'ONE_TIME_PAYMENT' ? stayDuration : customPeriods

	const depositTotal = securityDepositEnabled ? securityDepositAmount : 0
	const totalAmount = rentAmount * periods + depositTotal

	const handleConfirmGenerate = async () => {
		try {
			await updateApplication({
				id: applicationId,
				data: {
					initial_deposit_fee: convertCedisToPesewas(rentAmount * periods),
					initial_deposit_fee_currency: 'GHS',
				},
			})
			await generateInvoice({
				id: applicationId,
				due_date: dueDate ? dueDate.toISOString() : undefined,
			})

			toast.success('Invoice generated successfully.')
			setShowGenerateDialog(false)
			void revalidator.revalidate()
		} catch {
			toast.error('Failed to generate invoice.')
		}
	}

	return (
		<>
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
					<Button
						disabled={totalAmount <= 0}
						onClick={() => setShowGenerateDialog(true)}
					>
						<FileText className="size-4" />
						Generate Invoice
					</Button>
				</CardFooter>
			</Card>

			<Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Generate Invoice</DialogTitle>
						<DialogDescription>
							An invoice will be generated for the tenant. Optionally set a due
							date for payment.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-1.5 py-2">
						<Label className="text-xs">Due Date (optional)</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										'w-full justify-start text-left font-normal',
										!dueDate && 'text-muted-foreground',
									)}
								>
									<CalendarIcon className="mr-2 size-4" />
									{dueDate
										? dueDate.toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
												year: 'numeric',
											})
										: 'Pick a date'}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={dueDate}
									onSelect={setDueDate}
									disabled={(date) => date < new Date()}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowGenerateDialog(false)}
							disabled={isUpdating || isGenerating}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmGenerate}
							disabled={isUpdating || isGenerating}
						>
							{isUpdating || isGenerating ? <Spinner /> : null}
							Generate Invoice
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
