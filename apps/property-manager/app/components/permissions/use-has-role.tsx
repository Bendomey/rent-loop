import { useMemo } from 'react'
import { PermissionState } from '~/lib/constants'
import { useAuth } from '~/providers/auth-provider'

interface PermissionCheckParams {
	roles?: Array<ClientUser['role']>
}

export const useHasPermissions = ({ roles }: PermissionCheckParams) => {
	const { currentUser } = useAuth()

	const hasPermissions = useMemo(() => {
		if (!currentUser) return PermissionState.UNAUTHORIZED

		if (roles && roles.length > 0) {
			if (roles.includes(currentUser.role)) {
				return PermissionState.AUTHORIZED
			} else {
				return PermissionState.UNAUTHORIZED
			}
		}

		return PermissionState.AUTHORIZED
	}, [currentUser, roles])

	return { hasPermissions }
}
