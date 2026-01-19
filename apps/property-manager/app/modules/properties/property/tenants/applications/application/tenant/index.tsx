import { useParams } from 'react-router'

import { PropertyTenantApplicationBasic } from './basic'
import { PropertyTenantApplicationEmergencyContact } from './emergency-contact'
import { PropertyTenantApplicationIdentity } from './identity'
import { useProperty } from '~/providers/property-provider'

export function PropertyTenantApplicationTenant() {
	const { applicationId } = useParams()
	const { clientUserProperty } = useProperty()

	return (
		<div className='space-y-3'>
			<PropertyTenantApplicationBasic />
			<PropertyTenantApplicationIdentity />
			<PropertyTenantApplicationEmergencyContact />
		</div>
	)
}
