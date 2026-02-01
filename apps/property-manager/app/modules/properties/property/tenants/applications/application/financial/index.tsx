// import { useParams } from 'react-router'
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
// import { useProperty } from '~/providers/property-provider'

export function PropertyTenantApplicationFinancial() {
	// const { applicationId } = useParams()
	// const { clientUserProperty } = useProperty()

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>Financial Setup</CardTitle>
				<CardDescription>
					Setup financial details for the tenant.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3">
				<RentSetup />
				<SecurityDeposit />

			</CardContent>
			<CardFooter className="flex justify-end">
				<div className="flex flex-row items-center space-x-2">
					<Button disabled>Save</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
