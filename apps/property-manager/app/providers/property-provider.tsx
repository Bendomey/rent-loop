import { createContext, useContext, type PropsWithChildren } from 'react'

interface Props {
	data: ClientUserProperty | null
}

interface IPropertyContext {
	clientUserProperty?: ClientUserProperty
}

const PropertyContext = createContext<IPropertyContext | null>(null)

export function PropertyProvider({ data, children }: PropsWithChildren<Props>) {
	return (
		<PropertyContext.Provider value={{ clientUserProperty: data ?? undefined }}>
			{children}
		</PropertyContext.Provider>
	)
}

export function useProperty() {
	const context = useContext(PropertyContext)

	if (!context) {
		throw new Error('useProperty must be used within a PropertyProvider')
	}

	return context
}
