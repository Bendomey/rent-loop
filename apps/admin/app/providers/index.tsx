import { ThemeProvider } from 'next-themes'
import { type PropsWithChildren } from 'react'
import { ReactQueryProvider } from './react-query/index.tsx'

export const Providers = ({ children }: PropsWithChildren) => {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<ReactQueryProvider>{children}</ReactQueryProvider>
		</ThemeProvider>
	)
}
