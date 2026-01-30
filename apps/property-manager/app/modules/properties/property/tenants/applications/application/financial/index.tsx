import { useParams } from 'react-router'
import { useProperty } from '~/providers/property-provider'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

export function PropertyTenantApplicationFinancial() {
	const { applicationId } = useParams()
	const { clientUserProperty } = useProperty()

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>Financial Setup</CardTitle>
				<CardDescription>
					Setup financial details for the tenant.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3">
				{/* rent collection setup */}
				{/* security deposit */}

			</CardContent>
			<CardFooter className="flex justify-end">
				<div className="flex flex-row items-center space-x-2">
					<Button disabled>Save</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
