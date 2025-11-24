import { zodResolver } from '@hookform/resolvers/zod'
import { HelpCircle, Mail, Phone } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useFetcher } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import type { CreateClientUserInput } from '~/api/client-users'
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
	phone: z
		.string({ error: 'Contact phone number is required' })
		.min(9, 'Please enter a valid support phone number'),
	email: z.email('Please enter a valid support email address'),
})

export type FormSchema = z.infer<typeof ValidationSchema>

export function NewMemberModule() {
	const createFetcher = useFetcher<{ error: string }>()

	const rhfMethods = useForm<FormSchema>({
		defaultValues: {
			name: '',
			phone: '',
			email: '',
			role: 'STAFF',
		},
		resolver: zodResolver(ValidationSchema),
	})

	useEffect(() => {
		if (createFetcher?.data?.error) {
			toast.error(createFetcher?.data?.error)
		}
	}, [createFetcher?.data])
	const { handleSubmit, control, getValues } = rhfMethods

	const onSubmit = async (data: Partial<CreateClientUserInput>) => {
		const updatedData = { ...data }
		if (getValues('phone')) {
			updatedData.phone = `+233${getValues('phone').slice(-9)}`
		}
		await createFetcher.submit(updatedData, {
			method: 'POST',
			action: '/settings/members/new',
		})
	}
	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-2 max-w-lg md:mx-auto"
			>
				<div className="space-y-1">
					<TypographyH2>Create New Member</TypographyH2>
					<TypographyMuted>
						We&apos;ll send the member an invitation to join via email/phone
						number
					</TypographyMuted>
				</div>

				<FieldGroup className="mt-10">
					<FieldGroup>
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
												<Mail {...field} />
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

						<FormField
							name="phone"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Phone Number</FormLabel>
									<FormControl>
										<InputGroup>
											<InputGroupInput
												placeholder="201234567"
												id="phone"
												type="tel"
												{...field}
											/>
											<InputGroupAddon>
												<Phone />
												+233
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

						<FormField
							name="role"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel htmlFor="role">Role</FormLabel>
									<FormControl>
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger className="w-[180px]" id="role">
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectItem value="__EMPTY__">
														Please select
													</SelectItem>
													<SelectLabel>All Roles</SelectLabel>
													<SelectItem value="ADMIN">Admin</SelectItem>
													<SelectItem value="STAFF">Staff</SelectItem>
												</SelectGroup>
											</SelectContent>
										</Select>
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
						<Button disabled={createFetcher.state !== 'idle'} type="submit" className="bg-rose-600 hover:bg-rose-700">
							{createFetcher.state !== 'idle' ?  <Spinner /> : null} Create Member
						</Button>
					</div>
				</div>
			</form>
		</Form>
	)
}
