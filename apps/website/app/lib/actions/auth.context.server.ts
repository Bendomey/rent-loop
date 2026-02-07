import { createContext } from 'react-router'

export const userContext = createContext<{
	clientUser: ClientUser
} | null>(null)
