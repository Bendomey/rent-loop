import { useOutletContext } from 'react-router'

interface TenantApplicationOutletContext {
	tenantApplication: TenantApplication
}

export function useTenantApplicationContext() {
	return useOutletContext<TenantApplicationOutletContext>()
}
