import { createContext } from 'react-router'

export const userContext = createContext<{
	user: Admin
} | null>(null)
