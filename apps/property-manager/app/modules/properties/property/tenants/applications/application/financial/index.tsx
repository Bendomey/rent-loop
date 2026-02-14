import { useState } from 'react'
import { InitialPaymentSetup } from './initial-payment-setup'
import { RentSetup } from './rent-setup'
import { SecurityDeposit } from './security-deposit'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'

// TODO: replace with real unit data from tenant application
const mockUnit = {
	rent_fee: 5000,
	rent_fee_currency: 'GHS',
	payment_frequency: 'MONTHLY',
}

// TODO: replace with real stay duration from move-in setup
const mockStayDuration: number | null = 12
const mockStayDurationFrequency: string | null = 'MONTHS'

export function PropertyTenantApplicationFinancial() {
	const [rentAmount, setRentAmount] = useState(mockUnit.rent_fee)
	const [paymentFrequency, setPaymentFrequency] = useState(
		mockUnit.payment_frequency,
	)
	const [depositEnabled, setDepositEnabled] = useState(false)
	const [depositAmount, setDepositAmount] = useState(0)

	const hasFinancialChanges =
		rentAmount !== mockUnit.rent_fee ||
		paymentFrequency !== mockUnit.payment_frequency ||
		depositEnabled ||
		depositAmount !== 0

	const handleReset = () => {
		setRentAmount(mockUnit.rent_fee)
		setPaymentFrequency(mockUnit.payment_frequency)
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
						defaultRentAmount={mockUnit.rent_fee}
						defaultPaymentFrequency={mockUnit.payment_frequency}
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
						<Button disabled>Save</Button>
					</div>
				</CardFooter>
			</Card>

			<InitialPaymentSetup
				hasFinancialChanges={hasFinancialChanges}
				stayDuration={mockStayDuration}
				stayDurationFrequency={mockStayDurationFrequency}
				rentAmount={rentAmount}
				paymentFrequency={paymentFrequency}
				securityDepositEnabled={depositEnabled}
				securityDepositAmount={depositAmount}
			/>
		</div>
	)
}
