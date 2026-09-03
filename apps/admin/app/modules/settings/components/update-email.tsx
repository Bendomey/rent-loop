import { zodResolver } from '@hookform/resolvers/zod'
import { type Dispatch, type SetStateAction } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { FieldGroup } from '~/components/ui/field'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { safeString } from '~/lib/strings'

interface Props {
	email?: string
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

const ValidationSchema = z.object({
	email: z.email('Enter a valid email address'),
})

type FormSchema = z.infer<typeof ValidationSchema>

export default function UpdateEmailModal({ email, opened, setOpened }: Props) {
	const rhfMethods = useForm<FormSchema>({
		defaultValues: { email: safeString(email) },
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control } = rhfMethods

	const onSubmit = () => {
		toast.info('Email updates are coming soon.')
		setOpened(false)
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="max-w-sm rounded-xl">
				<AlertDialogHeader>
					<AlertDialogTitle>Change Email</AlertDialogTitle>
					<AlertDialogDescription>
						We&rsquo;ll send a verification link to the new address before it
						takes effect.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<Form {...rhfMethods}>
					<form>
						<FieldGroup className="max-sm:gap-3">
							<FormField
								name="email"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email address</FormLabel>
										<FormControl>
											<Input type="email" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</FieldGroup>
					</form>
				</Form>
				<AlertDialogFooter className="max-sm: flex flex-row justify-between">
					<AlertDialogCancel onClick={() => setOpened(false)}>
						Cancel
					</AlertDialogCancel>

					<AlertDialogAction
						onClick={handleSubmit(onSubmit)}
						className="bg-primary hover:bg-primary/90 text-white"
					>
						Save
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
