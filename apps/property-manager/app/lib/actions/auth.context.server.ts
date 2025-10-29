import { createContext } from 'react-router'

export const userContext = createContext<ClientUser | null>(null)
