import { useHasPermissions, useHasPropertyPermissions } from './use-has-role'
import { PermissionState } from '~/lib/constants'

type Props = Parameters<typeof useHasPermissions>[0] & {
	children: React.ReactNode
}

export function PermissionGuard({ children, roles }: Props) {
	const { hasPermissions } = useHasPermissions({ roles })

	return <>{hasPermissions === PermissionState.AUTHORIZED ? children : null}</>
}

type PropertyPermissionProps = Parameters<
	typeof useHasPropertyPermissions
>[0] & {
	children: React.ReactNode
}

export function PropertyPermissionGuard({
	children,
	roles,
}: PropertyPermissionProps) {
	const { hasPermissions } = useHasPropertyPermissions({ roles })

	return <>{hasPermissions === PermissionState.AUTHORIZED ? children : null}</>
}
