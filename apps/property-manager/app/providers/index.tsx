import { type PropsWithChildren } from 'react'
import { ReactQueryProvider } from './react-query/index.tsx'

interface Props {}

export const Providers = ({ children }: PropsWithChildren<Props>) => {
	return <ReactQueryProvider>{children}</ReactQueryProvider>
}
