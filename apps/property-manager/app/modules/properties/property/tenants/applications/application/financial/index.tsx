import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { useTenantApplicationContext } from '../context'
import { InitialPaymentSetup } from './initial-payment-setup'
import { RentSetup } from './rent-setup'
import { SecurityDeposit } from './security-deposit'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
	formatAmount,
} from '~/lib/format-amount'
import { getPaymentFrequencyLabel } from '~/lib/properties.utils'

interface FieldDisplayProps {
	label: string
	value: string | null | undefined
}

function FieldDisplay({ label, value }: FieldDisplayProps) {
	return (
		<div>
			<p className="text-muted-foreground text-sm">{label}</p>
			<p className="text-sm font-medium">{value || '-'}</p>
		</div>
	)
}

export function PropertyTenantApplicationFinancial() {
	const { tenantApplication } = useTenantApplicationContext()
	const revalidator = useRevalidator()

	const unit = tenantApplication.desired_unit

	// API stores fees in pesewas — convert to cedis for display/form state
	const savedRentFee = convertPesewasToCedis(
		tenantApplication.rent_fee || unit.rent_fee,
	)
	const savedPaymentFrequency =
		tenantApplication.payment_frequency || unit.payment_frequency
	const savedSecurityDepositFee = convertPesewasToCedis(
		tenantApplication.security_deposit_fee ?? 0,
	)
	const savedSecurityDepositEnabled = Boolean(
		tenantApplication.security_deposit_fee,
	)

	const [isEditing, setIsEditing] = useState(false)
	const [rentAmount, setRentAmount] = useState(savedRentFee)
	const [paymentFrequency, setPaymentFrequency] = useState(
		savedPaymentFrequency,
	)
	const [depositEnabled, setDepositEnabled] = useState(
		savedSecurityDepositEnabled,
	)
	const [depositAmount, setDepositAmount] = useState(savedSecurityDepositFee)

	const { isPending, mutate } = useAdminUpdateTenantApplication()

	const hasFinancialChanges =
		rentAmount !== savedRentFee ||
		depositEnabled !== savedSecurityDepositEnabled ||
		(depositEnabled && depositAmount !== savedSecurityDepositFee)

	const hasInvoice = Boolean(tenantApplication.application_payment_invoice)

	const handleReset = () => {
		setRentAmount(convertPesewasToCedis(unit.rent_fee))
		setPaymentFrequency(unit.payment_frequency)
	}

	const handleCancel = () => {
		setRentAmount(savedRentFee)
		setPaymentFrequency(savedPaymentFrequency)
		setDepositEnabled(savedSecurityDepositEnabled)
		setDepositAmount(savedSecurityDepositFee)
		setIsEditing(false)
	}

	const handleSave = () => {
		mutate(
			{
				id: tenantApplication.id,
				data: {
					rent_fee: convertCedisToPesewas(rentAmount),
					payment_frequency: paymentFrequency,
					security_deposit_fee: depositEnabled
						? convertCedisToPesewas(depositAmount)
						: null,
					security_deposit_fee_currency: depositEnabled ? 'GHS' : null,
					initial_deposit_fee_currency: null,
					initial_deposit_fee: null,
				},
			},
			{
				onError: () => {
					toast.error('Failed to save financial setup. Please try again.')
				},
				onSuccess: () => {
					toast.success('Financial setup saved.')
					setIsEditing(false)
					void revalidator.revalidate()
				},
			},
		)
	}

	return (
		<div className="space-y-4">
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						Financial Setup
						{!isEditing && !hasInvoice && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsEditing(true)}
							>
								<Pencil className="size-4" />
								Edit
							</Button>
						)}
						{isEditing && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleCancel}
								disabled={isPending}
							>
								Cancel
							</Button>
						)}
					</CardTitle>
				</CardHeader>

				{!isEditing ? (
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<FieldDisplay
								label="Agreed Rent Fee"
								value={`${formatAmount(savedRentFee)} / ${getPaymentFrequencyLabel(savedPaymentFrequency)}`}
							/>
							<FieldDisplay
								label="Security Deposit"
								value={
									savedSecurityDepositEnabled
										? formatAmount(savedSecurityDepositFee)
										: 'Not required'
								}
							/>
						</div>
					</CardContent>
				) : (
					<>
						<CardContent className="space-y-3">
							<RentSetup
								rentAmount={rentAmount}
								paymentFrequency={paymentFrequency}
								defaultRentAmount={convertPesewasToCedis(unit.rent_fee)}
								defaultPaymentFrequency={unit.payment_frequency}
								onRentAmountChange={setRentAmount}
								onPaymentFrequencyChange={setPaymentFrequency}
								onReset={handleReset}
							/>

							<SecurityDeposit
								enabled={depositEnabled}
								amount={depositAmount}
								onEnabledChange={setDepositEnabled}
								onAmountChange={setDepositAmount}
							/>
						</CardContent>

						<CardFooter className="flex justify-end">
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									onClick={handleCancel}
									disabled={isPending}
								>
									Cancel
								</Button>
								<Button
									disabled={!hasFinancialChanges || isPending}
									onClick={handleSave}
								>
									{isPending ? <Spinner /> : null}
									Save
								</Button>
							</div>
						</CardFooter>
					</>
				)}
			</Card>

			<InitialPaymentSetup
				applicationId={tenantApplication.id}
				existingInvoice={tenantApplication.application_payment_invoice ?? null}
				hasFinancialChanges={hasFinancialChanges}
				stayDuration={tenantApplication.stay_duration}
				stayDurationFrequency={tenantApplication.stay_duration_frequency}
				rentAmount={rentAmount}
				paymentFrequency={paymentFrequency}
				securityDepositEnabled={depositEnabled}
				securityDepositAmount={depositAmount}
				initialDepositFee={tenantApplication.initial_deposit_fee}
			/>
		</div>
	)
}
