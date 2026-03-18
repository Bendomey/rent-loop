import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createWaitlistEntry } from '~/api/waitlist'
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
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'

const ValidationSchema = z.object({
	full_name: z.string({ error: 'Required' }).min(1, 'Required'),
	phone_number: z.string({ error: 'Required' }).min(1, 'Required'),
	email: z
		.email('Please enter a valid email address')
		.optional()
		.or(z.literal('')),
})

type FormSchema = z.infer<typeof ValidationSchema>

interface WaitlistModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function WaitlistModal({ open, onOpenChange }: WaitlistModalProps) {
	const [submitted, setSubmitted] = useState(false)
	const [serverError, setServerError] = useState<string | null>(null)

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: { full_name: '', phone_number: '', email: '' },
	})

	const {
		handleSubmit,
		control,
		formState: { isSubmitting },
	} = rhfMethods

	const onSubmit = async (data: FormSchema) => {
		setServerError(null)
		try {
			await createWaitlistEntry({
				fullName: data.full_name,
				phoneNumber: `233${data.phone_number.slice(-9)}`,
				email: data.email,
			})
			setSubmitted(true)
		} catch {
			setServerError(
				'Failed to join the waitlist. Please check your details and try again.',
			)
		}
	}

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			rhfMethods.reset()
			setServerError(null)
			setSubmitted(false)
		}
		onOpenChange(nextOpen)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				{submitted ? (
					<div className="flex flex-col items-center gap-4 py-4 text-center">
						<div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
							<CheckCircleIcon className="size-9 text-green-600 dark:text-green-400" />
						</div>

						<div className="space-y-1">
							<h2 className="text-foreground text-xl font-semibold">
								You&apos;re on the list!
							</h2>
							<p className="text-muted-foreground text-sm">
								Thanks for joining the Rentloop waitlist. We&apos;ll keep you
								posted.
							</p>
						</div>

						<div className="bg-muted/40 w-full rounded-lg border px-4 py-3 text-left">
							<p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
								What happens next
							</p>
							<ul className="text-foreground space-y-2 text-sm">
								<li className="flex items-start gap-2">
									<span className="mt-0.5 text-rose-500">•</span>
									We&apos;ll notify you the moment Rentloop is ready.
								</li>
								<li className="flex items-start gap-2">
									<span className="mt-0.5 text-rose-500">•</span>
									Early access members get exclusive onboarding support.
								</li>
								<li className="flex items-start gap-2">
									<span className="mt-0.5 text-rose-500">•</span>
									Check your phone (and email if provided) for a confirmation.
								</li>
							</ul>
						</div>

						<Button
							className="w-full bg-rose-600 text-white hover:bg-rose-500"
							onClick={() => handleOpenChange(false)}
						>
							Done
						</Button>
					</div>
				) : (
					<Form {...rhfMethods}>
						<form onSubmit={handleSubmit(onSubmit)} noValidate>
							<DialogHeader>
								<DialogTitle>Join the Rentloop waitlist</DialogTitle>
								<DialogDescription>
									Be the first to know when we launch. We&apos;ll reach out with
									early access details.
								</DialogDescription>
							</DialogHeader>

							<div className="mt-4 flex flex-col gap-4">
								<FormField
									name="full_name"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Full name <span className="text-destructive">*</span>
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="text"
													placeholder="John Doe"
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									name="phone_number"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Phone number <span className="text-destructive">*</span>
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="tel"
													placeholder="+233201234567"
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									name="email"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email address</FormLabel>
											<FormControl>
												<Input
													{...field}
													type="email"
													placeholder="john@example.com"
													disabled={isSubmitting}
												/>
											</FormControl>
											<FormDescription>Optional</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{serverError && (
									<p className="text-destructive text-sm">{serverError}</p>
								)}
							</div>

							<DialogFooter className="mt-6">
								<Button
									type="submit"
									className="w-full bg-rose-600 text-white hover:bg-rose-500"
									disabled={isSubmitting}
								>
									{isSubmitting ? 'Joining…' : 'Join waitlist'}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				)}
			</DialogContent>
		</Dialog>
	)
}
