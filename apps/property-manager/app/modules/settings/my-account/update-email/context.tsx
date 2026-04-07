import { createContext, useContext, useEffect, useState } from 'react'
import { useFetcher, useSubmit } from 'react-router'
import { toast } from 'sonner'
import { useUpdateUserMe, type UpdateUserMeInput } from '~/api/auth'

interface UpdateClientEmailContextType {
	stepCount: number
	goToPage: (page: number) => void
	goBack: () => void
	goNext: () => void
	closeModal: () => void
	updateFormData: (
		data: Partial<
			UpdateUserMeInput & {
				newEmail?: string
				currentEmailVerified?: boolean
				newEmailVerified?: boolean
			}
		>,
	) => void
	formData: Partial<
		UpdateUserMeInput & {
			newEmail?: string
			currentEmailVerified?: boolean
			newEmailVerified?: boolean
		}
	>
	isSubmitting: boolean
	onSubmit: (
		data: Partial<
			UpdateUserMeInput & {
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
			UpdateUserMeInput & {
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
			UpdateUserMeInput & {
				newEmail?: string
				currentEmailVerified?: boolean
				newEmailVerified?: boolean
			}
		>,
	) => {
		setFormData((prev: typeof formData) => ({
			...prev,
			...data,
		}))
	}
	const { mutate } = useUpdateUserMe()

	const onSubmit = async (data: Partial<UpdateUserMeInput>) => {
		const updatedData = { ...data }

		if (formData.phone_number) {
			updatedData.phone_number = `+233${formData.phone_number.slice(-9)}`
		}

		return new Promise<void>((resolve, reject) => {
			mutate(
				{
					name: updatedData.name,
					phone_number: updatedData.phone_number,
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
