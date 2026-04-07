import { createContext, useContext, type PropsWithChildren } from 'react'

interface Props {
	data?: ClientUser
}

interface IClientContext {
	clientUser?: ClientUser
}

const ClientContext = createContext<IClientContext | null>(null)

export function ClientProvider({ data, children }: PropsWithChildren<Props>) {
	return (
		<ClientContext.Provider value={{ clientUser: data ?? undefined }}>
			{children}
		</ClientContext.Provider>
	)
}

export function useClient() {
	const context = useContext(ClientContext)
	if (!context) {
		throw new Error('useClient must be used within a ClientProvider')
	}
	return context
}
