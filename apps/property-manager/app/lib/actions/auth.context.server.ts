import { createContext } from 'react-router'

export const userContext = createContext<{
	clientUser: ClientUser
	clientUserProperties: FetchMultipleDataResponse<ClientUserProperty>
} | null>(null)
