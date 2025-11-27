import { createContext, useContext, type PropsWithChildren } from 'react'

interface Props {
	data?: ClientUser
}

interface IAuthContext {
	currentUser?: ClientUser
}

const AuthContext = createContext<IAuthContext | null>(null)

export function AuthProvider({
	data,
	children,
}: PropsWithChildren<Props>) {
	return (
		<AuthContext.Provider
			value={{ currentUser: data ?? undefined }}
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
