import { createContext } from 'react-router'

export const clientContext = createContext<{
	clientUser: ClientUser
} | null>(null)
