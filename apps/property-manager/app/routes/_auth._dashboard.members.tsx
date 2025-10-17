import { Outlet } from 'react-router'

export const handle = {
	breadcrumb: 'Members',
}

export default function UsersDashboard() {
	return (
		<main className="px-2 py-5 md:px-7">
			<Outlet />
		</main>
	)
}
