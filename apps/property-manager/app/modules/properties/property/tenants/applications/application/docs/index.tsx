import { useParams } from 'react-router'
import { useProperty } from '~/providers/property-provider'

export function PropertyTenantApplicationDocs() {
	const { applicationId } = useParams()
	const { clientUserProperty } = useProperty()

	return <div>Docs detail</div>
}
