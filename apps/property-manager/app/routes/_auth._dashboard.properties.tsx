import { Outlet } from 'react-router'
import type { Route } from './+types/_auth._dashboard.properties'

export const handle = {
	breadcrumb: 'My Properties',
}

export default function PropertiesDashboard({}: Route.ComponentProps) {
	return (
		<main className="px-2 py-5 md:px-7">
			<Outlet />
		</main>
	)
}
