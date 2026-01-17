import { useParams } from 'react-router'
import { useProperty } from '~/providers/property-provider'

export function PropertyTenantApplicationMoveIn() {
	const { applicationId } = useParams()
	const { clientUserProperty } = useProperty()

	return <div>move in detail</div>
}
