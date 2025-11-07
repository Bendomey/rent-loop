import { Outlet, useLoaderData } from 'react-router'
import { PropertyProvider } from '~/providers/property-provider'
import type { loader } from '~/routes/_auth._property.properties.$propertySlug'

export function PropertyMiddlewareModule() {
	const loaderData = useLoaderData<typeof loader>()

	return (
		<PropertyProvider data={loaderData?.property ?? null}>
			<Outlet />
		</PropertyProvider>
	)
}
