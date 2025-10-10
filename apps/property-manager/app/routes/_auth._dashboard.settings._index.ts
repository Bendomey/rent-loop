import { redirect } from 'react-router'
import type { Route } from './+types/_auth._dashboard.settings._index'

export async function loader({}: Route.LoaderArgs) {
	return redirect('/settings/general')
}
