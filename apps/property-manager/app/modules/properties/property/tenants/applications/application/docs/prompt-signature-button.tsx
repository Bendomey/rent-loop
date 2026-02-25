import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Clipboard, Send } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
	useGenerateSigningToken,
	useResendSigningToken,
	useUpdateSigningToken,
} from '~/api/signing'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'

const COOLDOWN_SECONDS = 60

const SigningRequestSchema = z.object({
	signer_name: z.string().optional(),
	signer_email: z
		.string()
		.email({ message: 'Invalid email' })
		.or(z.literal('')),
	signer_phone: z.string(),
})

type SigningRequestFormValues = z.infer<typeof SigningRequestSchema>

interface PromptSignatureButtonProps {
	existingToken?: AdminSigningToken | null
	documentId: string
	role: 'TENANT' | 'PM_WITNESS' | 'TENANT_WITNESS'
	tenantApplicationId?: string
}

export function PromptSignatureButton({
	existingToken,
	documentId,
	role,
	tenantApplicationId,
}: PromptSignatureButtonProps) {
	const queryClient = useQueryClient()
	const { mutateAsync: generateToken, isPending: isGenerating } =
		useGenerateSigningToken()
	const { mutateAsync: updateToken, isPending: isUpdating } =
		useUpdateSigningToken()
	const { mutateAsync: resendToken, isPending: isResending } =
		useResendSigningToken()

	const isPending = isGenerating || isUpdating || isResending

	const [countdown, setCountdown] = useState(COOLDOWN_SECONDS)
	const [copied, setCopied] = useState(false)
	const [modalOpen, setModalOpen] = useState(false)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const rhfMethods = useForm<SigningRequestFormValues>({
		resolver: zodResolver(SigningRequestSchema),
		defaultValues: { signer_name: '', signer_email: '', signer_phone: '' },
	})

	const isOnCooldown = countdown < COOLDOWN_SECONDS && countdown > 0

	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [])

	const startCooldown = useCallback(() => {
		setCountdown(COOLDOWN_SECONDS - 1)
		intervalRef.current = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					if (intervalRef.current) clearInterval(intervalRef.current)
					return COOLDOWN_SECONDS
				}
				return prev - 1
			})
		}, 1000)
	}, [])

	const handleCloseModal = useCallback(() => {
		setModalOpen(false)
		rhfMethods.reset()
	}, [rhfMethods])

	const handleOpenModal = useCallback(
		(
			prefill?: Pick<
				AdminSigningToken,
				'signer_name' | 'signer_email' | 'signer_phone'
			>,
		) => {
			rhfMethods.reset({
				signer_name: prefill?.signer_name ?? '',
				signer_email: prefill?.signer_email ?? '',
				signer_phone: prefill?.signer_phone ?? '',
			})
			setModalOpen(true)
		},
		[rhfMethods],
	)

	const onSubmit = useCallback(
		async (values: SigningRequestFormValues) => {
			const normalizedPhone = values.signer_phone
				? `233${values.signer_phone.replace(/\D/g, '').slice(-9)}`
				: undefined

			try {
				if (existingToken) {
					const dirtyFields = rhfMethods.formState.dirtyFields
					const hasChanges =
						dirtyFields.signer_name ||
						dirtyFields.signer_email ||
						dirtyFields.signer_phone

					if (hasChanges) {
						await updateToken({
							signing_token_id: existingToken.id,
							signer_name: values.signer_name,
							signer_email: values.signer_email || undefined,
							signer_phone: normalizedPhone,
						})
					}

					await resendToken(existingToken.id)
				} else {
					await generateToken({
						document_id: documentId,
						role,
						tenant_application_id: tenantApplicationId,
						signer_name: values.signer_name,
						signer_email: values.signer_email || undefined,
						signer_phone: normalizedPhone,
					})
				}

				await queryClient.invalidateQueries({
					queryKey: [QUERY_KEYS.SIGNING_TOKENS],
				})
				handleCloseModal()
				startCooldown()
			} catch (err) {
				rhfMethods.setError('root', {
					message: err instanceof Error ? err.message : 'Something went wrong',
				})
			}
		},
		[
			existingToken,
			generateToken,
			updateToken,
			resendToken,
			documentId,
			role,
			tenantApplicationId,
			queryClient,
			handleCloseModal,
			startCooldown,
			rhfMethods,
		],
	)

	const handleCopyLink = useCallback(() => {
		if (!existingToken) return
		const url = `${window.location.origin}/sign/${existingToken.token}`
		void navigator.clipboard.writeText(url).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		})
	}, [existingToken])

	return (
		<>
			{existingToken ? (
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant="outline"
						disabled={isOnCooldown}
						onClick={() => handleOpenModal(existingToken)}
					>
						<Send className="size-4" />
						{isOnCooldown ? `Resent (${countdown}s)` : 'Update/Resend'}
					</Button>
					<Button size="sm" variant="secondary" onClick={handleCopyLink}>
						{copied ? (
							<Check className="size-4 text-emerald-600" />
						) : (
							<Clipboard className="size-4" />
						)}
						{copied ? 'Copied!' : 'Copy Link to Sign'}
					</Button>
				</div>
			) : (
				<div className="flex items-center gap-3">
					<Button
						size="sm"
						variant="outline"
						disabled={isOnCooldown}
						onClick={() => handleOpenModal()}
					>
						<Send className="size-4" />
						{isOnCooldown ? `Resend in ${countdown}s` : 'Prompt to Sign'}
					</Button>
					{isOnCooldown && (
						<p className="text-xs text-zinc-400">
							A signing request has been sent.
						</p>
					)}
				</div>
			)}

			<Dialog
				open={modalOpen}
				onOpenChange={(open) => !open && handleCloseModal()}
			>
				<DialogContent>
					<Form {...rhfMethods}>
						<form onSubmit={rhfMethods.handleSubmit(onSubmit)}>
							<DialogHeader>
								<DialogTitle>
									{existingToken ? 'Resend' : 'Send Signing Request'}
								</DialogTitle>
								<DialogDescription>
									Optionally provide the recipient&apos;s contact details to
									notify them of the signing request.
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4 py-4">
								<FormField
									name="signer_name"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name (optional)</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="signer_email"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email (optional)</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="recipient@example.com"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="signer_phone"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone (optional)</FormLabel>
											<FormControl>
												<Input type="tel" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{rhfMethods.formState.errors.root && (
									<p className="text-xs text-red-500">
										{rhfMethods.formState.errors.root.message}
									</p>
								)}
							</div>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={handleCloseModal}
									disabled={isPending}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isPending}>
									{isPending ? <Spinner /> : <Send className="size-4" />}
									{existingToken ? 'Resend' : 'Send Request'}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	)
}
