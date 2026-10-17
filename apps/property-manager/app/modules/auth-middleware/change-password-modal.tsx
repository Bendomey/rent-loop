import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, type Control, type FieldPath } from 'react-hook-form'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUpdatePassword } from '~/api/auth'
import { Alert, AlertDescription } from '~/components/ui/alert'
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

const ValidationSchema = z
	.object({
		old_password: z
			.string({ error: 'Temporary password is required' })
			.min(1, 'Temporary password is required'),
		password: z
			.string({ error: 'Password is required' })
			.min(6, 'Password must be at least 6 characters long'),
		confirmPassword: z.string({ error: 'Confirm Password is required' }),
	})
	.superRefine(({ old_password, password, confirmPassword }, ctx) => {
		if (password && password === old_password) {
			ctx.addIssue({
				code: 'custom',
				message: 'Choose a password different from the temporary one',
				path: ['password'],
			})
		}
		if (confirmPassword !== password) {
			ctx.addIssue({
				code: 'custom',
				message: 'Passwords do not match',
				path: ['confirmPassword'],
			})
		}
	})

type FormSchema = z.infer<typeof ValidationSchema>

const ERROR_MESSAGES: Record<string, string> = {
	PasswordIncorrect: 'The temporary password is incorrect.',
	PasswordRepeated:
		'Your new password must be different from the temporary password.',
}

const dismissedKey = (userId: string) =>
	`rentloop.change-password-prompt-dismissed.${userId}`

function isDismissed(userId: string) {
	try {
		return localStorage.getItem(dismissedKey(userId)) === 'true'
	} catch {
		return false
	}
}

function markDismissed(userId: string) {
	try {
		localStorage.setItem(dismissedKey(userId), 'true')
	} catch {
		// Storage can be unavailable (private mode); the prompt just returns next load.
	}
}

export function ChangePasswordModal({ user }: { user?: User }) {
	const [open, setOpen] = useState(false)
	const revalidator = useRevalidator()
	const { mutate, isPending, error, reset } = useUpdatePassword()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		mode: 'onChange',
	})

	const userId = user?.id
	const needsPrompt = Boolean(user && !user.password_changed_at)

	useEffect(() => {
		if (userId && needsPrompt && !isDismissed(userId)) setOpen(true)
	}, [userId, needsPrompt])

	const dismiss = () => {
		if (userId) markDismissed(userId)
		setOpen(false)
	}

	const onSubmit = rhfMethods.handleSubmit(({ old_password, password }) =>
		mutate(
			{ old_password, new_password: password },
			{
				onSuccess: () => {
					toast.success('Your password has been updated.')
					setOpen(false)
					void revalidator.revalidate()
				},
			},
		),
	)

	const errorMessage = error
		? (ERROR_MESSAGES[error.message] ??
			'Failed to update your password. Please try again.')
		: undefined

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) dismiss()
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Set your own password</DialogTitle>
					<DialogDescription>
						You signed in with a temporary password. Replace it with one only
						you know to keep your account secure.
					</DialogDescription>
				</DialogHeader>

				<Form {...rhfMethods}>
					<form
						onSubmit={onSubmit}
						onChange={() => error && reset()}
						className="flex flex-col gap-4"
					>
						{errorMessage ? (
							<Alert variant="destructive">
								<AlertCircleIcon />
								<AlertDescription>{errorMessage}</AlertDescription>
							</Alert>
						) : null}

						<PasswordField
							control={rhfMethods.control}
							name="old_password"
							label="Temporary Password"
						/>
						<PasswordField
							control={rhfMethods.control}
							name="password"
							label="New Password"
						/>
						<PasswordField
							control={rhfMethods.control}
							name="confirmPassword"
							label="Confirm New Password"
						/>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={dismiss}>
								Not now
							</Button>
							<Button
								type="submit"
								disabled={isPending}
								className="bg-rose-600 text-white hover:bg-rose-700"
							>
								{isPending ? <Spinner /> : null}
								Save Password
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

function PasswordField({
	control,
	name,
	label,
}: {
	control: Control<FormSchema>
	name: FieldPath<FormSchema>
	label: string
}) {
	const [visible, setVisible] = useState(false)

	return (
		<FormField
			name={name}
			control={control}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<div className="relative">
							<Input
								type={visible ? 'text' : 'password'}
								{...field}
								value={field.value ?? ''}
								placeholder="* * * * * * * *"
								className="pr-9"
							/>
							<button
								type="button"
								onClick={() => setVisible((prev) => !prev)}
								className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
								tabIndex={-1}
							>
								{visible ? (
									<EyeOffIcon className="size-4" />
								) : (
									<EyeIcon className="size-4" />
								)}
								<span className="sr-only">
									{visible ? 'Hide password' : 'Show password'}
								</span>
							</button>
						</div>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}
