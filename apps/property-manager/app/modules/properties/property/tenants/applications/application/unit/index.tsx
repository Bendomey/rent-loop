// import { useParams } from 'react-router'
import { ExternalLink } from '~/components/external-link'
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card"
import { formatAmount } from '~/lib/format-amount'
import { useProperty } from '~/providers/property-provider'

export function PropertyTenantApplicationUnitSetup() {
	// const { applicationId } = useParams()
	const { clientUserProperty } = useProperty()

	return (
		<div className=''>
			<Card className="relative mx-auto w-full max-w-sm pt-0 shadow-none mt-20">
				<img
					src='https://placehold.co/600x400'
					alt="Unit 3B"
					className="relative z-20 aspect-video w-full rounded-t-lg object-cover"
				/>
				<CardHeader>
					<CardAction>
						<Badge variant="default" className='bg-green-700'>Active</Badge>
					</CardAction>
					<CardTitle>Unit 3B</CardTitle>
					<CardDescription>
						<p>2 Bed • 1 Bath • 850 sqft</p>
						<p>Market Rent: <b>{formatAmount(1000)}</b>/monthly</p>
					</CardDescription>
				</CardHeader>
				<CardFooter className='w-full justify-between space-x-2'>
					<ExternalLink className='w-2/4' to={`/properties/${clientUserProperty?.property_id}/assets/units/unit-id`}>
						<Button className='w-full'>View Unit</Button>
					</ExternalLink>
					<Button className='w-2/4' variant='secondary'>Change</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
