import { useMemo } from 'react'
import { PermissionState } from '~/lib/constants'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

interface PermissionCheckParams {
	roles?: Array<ClientUser['role']>
}

export const useHasPermissions = ({ roles }: PermissionCheckParams) => {
	const { clientUser } = useClient()

	const hasPermissions = useMemo(() => {
		if (!clientUser) return PermissionState.UNAUTHORIZED

		if (roles && roles.length > 0) {
			if (roles.includes(clientUser.role)) {
				return PermissionState.AUTHORIZED
			} else {
				return PermissionState.UNAUTHORIZED
			}
		}

		return PermissionState.AUTHORIZED
	}, [clientUser, roles])

	return { hasPermissions }
}

interface PropertyPermissionCheckParams {
	roles?: Array<ClientUserProperty['role']>
}

export const useHasPropertyPermissions = ({
	roles,
}: PropertyPermissionCheckParams) => {
	const { clientUserProperty } = useProperty()

	const hasPermissions = useMemo(() => {
		if (!clientUserProperty) return PermissionState.UNAUTHORIZED

		if (roles && roles.length > 0) {
			if (roles.includes(clientUserProperty.role)) {
				return PermissionState.AUTHORIZED
			} else {
				return PermissionState.UNAUTHORIZED
			}
		}

		return PermissionState.AUTHORIZED
	}, [clientUserProperty, roles])

	return { hasPermissions }
}
