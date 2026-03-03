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
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import {
	convertCedisToPesewas,
	convertPesewasToCedis,
} from '~/lib/format-amount'

export function PropertyTenantApplicationFinancial() {
	const { tenantApplication } = useTenantApplicationContext()
	const revalidator = useRevalidator()

	const unit = tenantApplication.desired_unit

	// These are the persisted values on the application (may differ from unit defaults)
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

	const [rentAmount, setRentAmount] = useState(savedRentFee)
	const [paymentFrequency, setPaymentFrequency] = useState(
		savedPaymentFrequency,
	)
	const [depositEnabled, setDepositEnabled] = useState(
		savedSecurityDepositEnabled,
	)
	const [depositAmount, setDepositAmount] = useState(savedSecurityDepositFee)

	const { isPending, mutate } = useAdminUpdateTenantApplication()

	// True when form values differ from what's persisted on the application
	const hasFinancialChanges =
		rentAmount !== savedRentFee ||
		depositEnabled !== savedSecurityDepositEnabled ||
		(depositEnabled && depositAmount !== savedSecurityDepositFee)

	const handleReset = () => {
		setRentAmount(convertPesewasToCedis(unit.rent_fee))
		setPaymentFrequency(unit.payment_frequency)
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
					void revalidator.revalidate()
				},
			},
		)
	}

	return (
		<div className="space-y-4">
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle>Financial Setup</CardTitle>
					<CardDescription>
						Setup financial details for the tenant.
					</CardDescription>
				</CardHeader>

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
					<div className="flex flex-row items-center space-x-2">
						<Button
							disabled={!hasFinancialChanges || isPending}
							onClick={handleSave}
						>
							{isPending ? <Spinner /> : null}
							Save
						</Button>
					</div>
				</CardFooter>
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
