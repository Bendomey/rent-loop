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
	name?: string
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

const ValidationSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
})

type FormSchema = z.infer<typeof ValidationSchema>

export default function UpdateNameModal({ name, opened, setOpened }: Props) {
	const rhfMethods = useForm<FormSchema>({
		defaultValues: { name: safeString(name) },
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control } = rhfMethods

	const onSubmit = () => {
		toast.info('Name updates are coming soon.')
		setOpened(false)
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="max-w-sm rounded-xl">
				<AlertDialogHeader>
					<AlertDialogTitle>Edit Name</AlertDialogTitle>
					<AlertDialogDescription>
						Update your name for your account.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<Form {...rhfMethods}>
					<form>
						<FieldGroup className="max-sm:gap-3">
							<FormField
								name="name"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Full Name</FormLabel>
										<FormControl>
											<Input {...field} />
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
