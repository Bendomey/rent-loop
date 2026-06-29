import { createContext, useContext, useState } from 'react'

interface LeaseTerminateContextType {
	step: number
	setStep: (step: number) => void
	next: () => void
	back: () => void
}

const LeaseTerminateContext = createContext<
	LeaseTerminateContextType | undefined
>(undefined)

export function LeaseTerminateProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [step, setStep] = useState(0)
	const [terminationId, setTerminationId] = useState<string | null>(null)

	const next = () => setStep((s) => Math.min(s + 1, 4))
	const back = () => setStep((s) => Math.max(s - 1, 0))

	return (
		<LeaseTerminateContext.Provider value={{ step, setStep, next, back }}>
			{children}
		</LeaseTerminateContext.Provider>
	)
}

export function useLeaseTerminate() {
	const ctx = useContext(LeaseTerminateContext)
	if (!ctx)
		throw new Error(
			'useLeaseTerminate must be used within LeaseTerminateProvider',
		)
	return ctx
}
