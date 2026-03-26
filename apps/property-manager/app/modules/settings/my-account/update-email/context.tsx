import { createContext, useContext, useEffect, useState } from 'react'
import { useFetcher, useSubmit } from 'react-router'
import { toast } from 'sonner'
import { useUpdateClientUserMe, type UpdateClientUserMeInput } from '~/api/auth'

interface UpdateClientEmailContextType {
	stepCount: number
	goToPage: (page: number) => void
	goBack: () => void
	goNext: () => void
	closeModal: () => void
	updateFormData: (
		data: Partial<
			UpdateClientUserMeInput & {
				newEmail?: string
				currentEmailVerified?: boolean
				newEmailVerified?: boolean
			}
		>,
	) => void
	formData: Partial<
		UpdateClientUserMeInput & {
			newEmail?: string
			currentEmailVerified?: boolean
			newEmailVerified?: boolean
		}
	>
	isSubmitting: boolean
	onSubmit: (
		data: Partial<
			UpdateClientUserMeInput & {
				newEmail?: string
				currentEmailVerified?: boolean
				newEmailVerified?: boolean
			}
		>,
	) => Promise<void>
}

export const UpdateClientEmailContext = createContext<
	UpdateClientEmailContextType | undefined
>(undefined)

export function UpdateClientEmailProvider({
	children,
	initialEmail,
	setOpened,
}: {
	children: React.ReactNode
	initialEmail?: string
	setOpened: (opened: boolean) => void
}) {
	const createFetcher = useFetcher<{ error: string }>()
	const [stepCount, setStepCount] = useState(0)
	const [formData, setFormData] = useState<
		Partial<
			UpdateClientUserMeInput & {
				newEmail?: string
				currentEmailVerified?: boolean
				newEmailVerified?: boolean
			}
		>
	>({ email: initialEmail ?? '' })
	const logOutSubmit = useSubmit()

	const goBack = () => setStepCount((prev) => (prev > 0 ? prev - 1 : prev))
	const goNext = () => setStepCount((prev) => prev + 1)
	const goToPage = (page: number) => setStepCount(page)
	const closeModal = () => setOpened(false)

	// where there is an error in the action data, show an error toast
	useEffect(() => {
		if (createFetcher?.data?.error) {
			toast.error('Failed to submit data. Please try again.')
		}
	}, [createFetcher?.data])

	const isSubmitting = createFetcher.state !== 'idle'

	const updateFormData = (
		data: Partial<
			UpdateClientUserMeInput & {
				newEmail?: string
				currentEmailVerified?: boolean
				newEmailVerified?: boolean
			}
		>,
	) => {
		setFormData((prev) => ({
			...prev,
			...data,
		}))
	}
	const { mutate, isPending } = useUpdateClientUserMe()

	const onSubmit = async (data: Partial<UpdateClientUserMeInput>) => {
		const updatedData = { ...data }

		if (formData.phoneNumber) {
			updatedData.phoneNumber = `+233${formData.phoneNumber.slice(-9)}`
		}

		return new Promise<void>((resolve, reject) => {
			mutate(
				{
					name: updatedData.name,
					phoneNumber: updatedData.phoneNumber,
					email: updatedData.email,
				},
				{
					onError: (e: unknown) => {
						if (e instanceof Error) {
							toast.error(
								'Failed to update client user details. Try again later.',
							)
						}
						reject(e)
					},
					onSuccess: () => {
						toast.success('Client user details updated successfully')
						setTimeout(() => {
							void logOutSubmit(null, { method: 'post', action: '/logout' })
						}, 0)
						void resolve()
					},
				},
			)
		})
	}

	const contextValue: UpdateClientEmailContextType = {
		stepCount,
		goBack,
		goToPage,
		goNext,
		closeModal,
		updateFormData,
		formData,
		onSubmit,
		isSubmitting,
	}

	return (
		<UpdateClientEmailContext.Provider value={contextValue}>
			{children}
		</UpdateClientEmailContext.Provider>
	)
}

export function useUpdateClientEmailContext() {
	const context = useContext(UpdateClientEmailContext)

	if (!context) {
		throw new Error(
			'useUpdateClientEmailContext must be used within an UpdateClientEmailContextProvider',
		)
	}

	return context
}
