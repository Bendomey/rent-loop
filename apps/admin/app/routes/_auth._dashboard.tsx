import { Outlet } from 'react-router'

export default function AuthDashboard() {
	return (
		<div className="h-full w-full">
			<Outlet />
		</div>
	)
}
