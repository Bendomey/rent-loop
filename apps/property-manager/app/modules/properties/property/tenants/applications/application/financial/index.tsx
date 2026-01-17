import { useParams } from 'react-router'
import { useProperty } from '~/providers/property-provider'

export function PropertyTenantApplicationFinancial() {
	const { applicationId } = useParams()
	const { clientUserProperty } = useProperty()

	return <div>financial detail</div>
}
