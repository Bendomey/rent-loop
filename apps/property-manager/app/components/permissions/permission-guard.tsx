import { useHasPermissions } from './use-has-role'
import { PermissionState } from '~/lib/constants'

type Props = Parameters<typeof useHasPermissions>[0] & {
	children: React.ReactNode
}

export default function PermissionGuard({ children, roles }: Props) {
	const { hasPermissions } = useHasPermissions({ roles })

	return <>{hasPermissions === PermissionState.AUTHORIZED ? children : null}</>
}
