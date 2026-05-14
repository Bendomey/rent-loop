import { createContext, use, useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { toast } from 'sonner'
import type { CreateClientApplicationInput } from '~/api/client-applications/server'

type PMFormData = Partial<CreateClientApplicationInput>

interface NewPMContextType {
	stepCount: number
	goBack: () => void
	goNext: () => void
	updateFormData: (data: PMFormData) => void
	formData: PMFormData
	isSubmitting: boolean
	onSubmit: (data: PMFormData) => void
}

export const NewPMContext = createContext<NewPMContextType | undefined>(
	undefined,
)

export function NewPMProvider({ children }: { children: React.ReactNode }) {
	const fetcher = useFetcher<{ error?: string }>()
	const [stepCount, setStepCount] = useState(0)
	const [formData, setFormData] = useState<PMFormData>({})

	useEffect(() => {
		if (fetcher?.data?.error) {
			toast.error(fetcher.data.error)
		}
	}, [fetcher?.data])

	const goBack = () => setStepCount((prev) => (prev > 0 ? prev - 1 : prev))
	const goNext = () => setStepCount((prev) => prev + 1)

	const updateFormData = (data: PMFormData) => {
		setFormData((prev) => ({ ...prev, ...data }))
	}

	const onSubmit = (data: PMFormData) => {
		const merged = { ...formData, ...data }
		const payload = Object.fromEntries(
			Object.entries(merged).flatMap(([k, v]) =>
				v !== undefined && v !== null && v !== '' ? [[k, String(v)]] : [],
			),
		)
		void fetcher.submit(
			{
				...payload,
				latitude: payload.latitude ?? '0',
				longitude: payload.longitude ?? '0',
			},
			{ method: 'POST' },
		)
	}

	return (
		<NewPMContext.Provider
			value={{
				stepCount,
				goBack,
				goNext,
				updateFormData,
				formData,
				isSubmitting: fetcher.state !== 'idle',
				onSubmit,
			}}
		>
			{children}
		</NewPMContext.Provider>
	)
}

export function useNewPMContext() {
	const ctx = use(NewPMContext)
	if (!ctx) throw new Error('useNewPMContext must be used within NewPMProvider')
	return ctx
}
