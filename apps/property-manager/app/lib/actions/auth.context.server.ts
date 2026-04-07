import { createContext } from 'react-router'

export const userContext = createContext<{
	user: User
} | null>(null)
