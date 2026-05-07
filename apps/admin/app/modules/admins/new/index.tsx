import { zodResolver } from '@hookform/resolvers/zod'
import { HelpCircle, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useFetcher } from 'react-router'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
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
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '~/components/ui/input-group'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

const ValidationSchema = z.object({
	role: z.enum(['ADMIN', 'STAFF'], {
		error: 'Please select a role',
	}),
	name: z
		.string({ error: 'Name is required' })
		.min(2, 'Please enter a valid name'),
	email: z.email('Please enter a valid support email address'),
})

export type FormSchema = z.infer<typeof ValidationSchema>

export function NewAdminModule() {
	const createFetcher = useFetcher<{ error: string }>()

	const rhfMethods = useForm<FormSchema>({
		defaultValues: {
			name: '',
			email: '',
		},
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control } = rhfMethods

	const onSubmit = async (data: FormSchema) => {
		await createFetcher.submit(
			{
				data,
			},
			{
				method: 'POST',
				action: 'admin/new',
			},
		)
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-2 max-w-lg md:mx-auto"
			>
				<div className="space-y-1">
					<TypographyH2>Create New Admin</TypographyH2>
					<TypographyMuted>
						We&apos;ll send the admin an invitation to join via email/phone
						number
					</TypographyMuted>
				</div>

				<FieldGroup className="mt-10">
					<FieldGroup>
						<FormField
							name="role"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectGroup>
												<SelectLabel>Roles</SelectLabel>
												<SelectItem value="ADMIN">Admin</SelectItem>
												<SelectItem value="STAFF">Staff</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="name"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Full Name</FormLabel>
									<FormControl>
										<Input placeholder="John Doe" type="text" {...field} />
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
									<FormLabel htmlFor="email">Email</FormLabel>
									<FormControl>
										<InputGroup>
											<InputGroupInput
												placeholder="m@example.com"
												id="email"
												{...field}
											/>
											<InputGroupAddon>
												<Mail />
												<Separator
													orientation="vertical"
													className="data-[orientation=vertical]:h-4"
												/>
											</InputGroupAddon>
											<InputGroupAddon align="inline-end">
												<Tooltip>
													<TooltipTrigger asChild>
														<InputGroupButton
															variant="ghost"
															aria-label="Help"
															size="icon-xs"
														>
															<HelpCircle />
														</InputGroupButton>
													</TooltipTrigger>
													<TooltipContent>
														<p>We&apos;ll use this to send you notifications</p>
													</TooltipContent>
												</Tooltip>
											</InputGroupAddon>
										</InputGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</FieldGroup>
				</FieldGroup>

				<div className="mt-10 flex justify-end border-t pt-5">
					<div className="flex items-center gap-x-2">
						<Link to="/settings/members">
							<Button type="button" variant="outline">
								Cancel
							</Button>
						</Link>
						<Button
							disabled={createFetcher.state !== 'idle'}
							type="submit"
							className="bg-rose-600 hover:bg-rose-700"
						>
							{createFetcher.state !== 'idle' ? <Spinner /> : null} Create
							Admin
						</Button>
					</div>
				</div>
			</form>
		</Form>
	)
}
