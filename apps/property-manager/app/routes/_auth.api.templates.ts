import type { Route } from './+types/_auth.api.templates'
import { BASIC, EMPTY } from '~/lib/actions/document-templates.server'
import {} from 'react-router'

export async function loader({}: Route.LoaderArgs) {
	return {
		templates: [
			{
				id: 'empty',
				name: 'Empty Template',
				description: 'Start from a blank template.',
				document: EMPTY,
			},
			{
				id: 'basic-lease-agreement',
				name: 'Basic Lease Agreement',
				description: 'A simple lease agreement template.',
				document: BASIC,
			},
		],
	}
}
