import { Outlet } from 'react-router'
import type { Route } from './+types/_auth._dashboard'


export default function AuthDashboard({
	matches,
	loaderData,
}: Route.ComponentProps) {


	return (
		
				<div className="h-full w-full">
					<Outlet />
				</div>
	)
}
