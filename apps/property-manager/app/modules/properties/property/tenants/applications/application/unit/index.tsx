import { useParams } from 'react-router'
import { useProperty } from '~/providers/property-provider'

export function PropertyTenantApplicationUnitSetup() {
	const { applicationId } = useParams()
	const { clientUserProperty } = useProperty()

	return <div>unit setup</div>
}
