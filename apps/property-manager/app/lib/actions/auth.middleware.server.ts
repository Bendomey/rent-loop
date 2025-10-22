import { redirect, type MiddlewareFunction } from 'react-router'
import { userContext } from './auth.context.server'
import { getAuthSession } from './auth.session.server'

export const authMiddleware: MiddlewareFunction = async ({
	request,
	context,
}) => {
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	if (!authSession.has('authToken')) {
		throw redirect('/login')
	}

	// TODO: get current USER from api.

	// TODO: save in context for use in loaders/actions.
	context.set(userContext, {
		id: 'user-123',
		name: 'John Doe',
		email: 'john.doe@example.com',
		created_at: new Date(),
		updated_at: new Date(),
		properties: [
			{
				id: 'property-123',
				name: 'Sample Property',
				description: '',
				address: '123 Main St, Anytown, USA',
				gps_address: 'GH-000-0000',
				city: 'Anytown',
				state: 'CA',
				zip_code: '12345',
				type: 'SINGLE',
				tags: [],
				status: 'Property.Status.Active',
				created_at: new Date(),
				updated_at: new Date(),
			},
		],
	})
}
