import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useClientMutation } from './use-client-mutation'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
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

const ValidationSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
})

type FormSchema = z.infer<typeof ValidationSchema>

interface Props {
	client: Client
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
}

export function EditNameDialog({
	client,
	open,
	onOpenChange,
	onSuccess,
}: Props) {
	const isCompany = client.type === 'COMPANY'
	const { submit, isPending } = useClientMutation(
		'Account name updated',
		onSuccess,
	)

	const rhf = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: { name: client.name },
	})

	const onSubmit = (data: FormSchema) => {
		submit({ clientId: client.id, name: data.name })
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm rounded-xl">
				<DialogHeader>
					<DialogTitle>Change account name</DialogTitle>
					<DialogDescription>
						Appears on invoices, lease documents and tenant-facing pages.
					</DialogDescription>
				</DialogHeader>

				<Form {...rhf}>
					<form onSubmit={rhf.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							name="name"
							control={rhf.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{isCompany ? 'Company name' : 'Full name'}
									</FormLabel>
									<FormControl>
										<Input
											placeholder={
												isCompany
													? 'Your company or trading name'
													: 'Your full name'
											}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-3 pt-1">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isPending} className="min-w-20">
								{isPending ? <Spinner /> : null}
								Save name
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
