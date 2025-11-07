import { createContext, useContext, type PropsWithChildren } from 'react'

interface Props {
	data?: ClientUser
	clientUserProperties?: FetchMultipleDataResponse<ClientUserProperty>
}

interface IAuthContext {
	currentUser?: ClientUser
	clientUserProperties?: FetchMultipleDataResponse<ClientUserProperty>
}

const AuthContext = createContext<IAuthContext | null>(null)

export function AuthProvider({
	data,
	clientUserProperties,
	children,
}: PropsWithChildren<Props>) {
	return (
		<AuthContext.Provider
			value={{ currentUser: data ?? undefined, clientUserProperties }}
		>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)

	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}

	return context
}
