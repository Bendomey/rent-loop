import { zodResolver } from '@hookform/resolvers/zod'
import { Check, HelpCircle, Mail, Phone } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useFetcher } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useGetMyProperties } from '~/api/properties'
import { Button } from '~/components/ui/button'
import { FieldGroup } from '~/components/ui/field'
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
import {
	TypographyH2,
	TypographyH4,
	TypographyMuted,
} from '~/components/ui/typography'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

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
	property_assignments: z
		.array(
			z.object({
				property_id: z.string(),
				name: z.string(),
				role: z.enum(['MANAGER', 'STAFF']),
			}),
		)
		.min(1, 'Please assign at least one property'),
})

export type FormSchema = z.infer<typeof ValidationSchema>

export function NewMemberModule() {
	const createFetcher = useFetcher<{ error: string }>()
	const { clientUser } = useClient()

	const { data: myProperties } = useGetMyProperties(
		safeString(clientUser?.client_id),
		{
			pagination: { page: 1, per: 100 },
			populate: ['Property'],
			sorter: { sort: 'asc', sort_by: 'created_at' },
		},
	)

	const rhfMethods = useForm<FormSchema>({
		defaultValues: {
			name: '',
			phone: '',
			email: '',
			role: 'ADMIN',
			property_assignments: [],
		},
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control, getValues } = rhfMethods

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'property_assignments',
	})

	useEffect(() => {
		if (createFetcher?.data?.error) {
			toast.error(createFetcher?.data?.error)
		}
	}, [createFetcher?.data])

	const toggleProperty = (propertyId: string, name: string) => {
		const index = fields.findIndex((f) => f.property_id === propertyId)
		if (index !== -1) {
			remove(index)
		} else {
			append({ property_id: propertyId, name, role: 'MANAGER' })
		}
	}

	const updatePropertyRole = (
		propertyId: string,
		role: 'MANAGER' | 'STAFF',
	) => {
		const index = fields.findIndex((f) => f.property_id === propertyId)
		if (index !== -1) {
			rhfMethods.setValue(`property_assignments.${index}.role`, role)
		}
	}

	const onSubmit = async (data: FormSchema) => {
		const updatedData = { ...data }
		if (getValues('phone')) {
			updatedData.phone = `+233${getValues('phone').slice(-9)}`
		}
		await createFetcher.submit(
			{
				...updatedData,
				property_assignments: JSON.stringify(
					data.property_assignments.map(({ property_id, role }) => ({
						property_id,
						role,
					})),
				),
			},
			{
				method: 'POST',
				action: '/settings/members/new',
			},
		)
	}

	const properties = myProperties?.rows ?? []

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
											<SelectTrigger className="w-full" id="role">
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
									<FormDescription className="text-xs">
										Admins have full access to all features and settings, while
										Staff have limited access based on permissions set by
										Admins. Choose the appropriate role for the member you are
										inviting. You can always change their role later if needed.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</FieldGroup>
				</FieldGroup>

				<Separator className="my-10" />

				<FormField
					name="property_assignments"
					control={control}
					render={() => (
						<FormItem>
							<TypographyH4>Assign Properties to Member</TypographyH4>
							<TypographyMuted>
								Member will have access to all properties you select here.
							</TypographyMuted>

							{properties.length > 0 && (
								<div className="mt-4 flex flex-wrap gap-2">
									{properties.map((item: ClientUserProperty) => {
										if (!item.property) return null
										const selected = fields.find(
											(f) => f.property_id === item.property_id,
										)
										const isSelected = Boolean(selected)

										if (isSelected && selected) {
											return (
												<div
													key={item.property_id}
													className="border-primary bg-primary text-primary-foreground flex items-center overflow-hidden rounded-full border text-sm shadow-xs"
												>
													<button
														type="button"
														onClick={() =>
															toggleProperty(
																item.property_id,
																item.property!.name,
															)
														}
														className="text-primary-foreground hover:bg-primary/80 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors dark:text-white"
													>
														<Check className="h-3 w-3" />
														{item.property.name}
													</button>
													<div className="bg-primary-foreground/30 h-5 w-px dark:bg-gray-300" />
													<Select
														value={selected.role}
														onValueChange={(value) =>
															updatePropertyRole(
																item.property_id,
																value as 'MANAGER' | 'STAFF',
															)
														}
													>
														<SelectTrigger className="text-primary-foreground dark:hover:bg-primary/80 [&_*]:text-primary-foreground [&_svg:not([class*='text-'])]:text-primary-foreground h-auto rounded-none border-0 bg-transparent px-2.5 py-1.5 text-xs shadow-none focus:ring-0 dark:bg-transparent dark:text-white dark:[&_*]:text-white">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="MANAGER">Manager</SelectItem>
															<SelectItem value="STAFF">Staff</SelectItem>
														</SelectContent>
													</Select>
												</div>
											)
										}

										return (
											<Button
												key={item.property_id}
												type="button"
												variant="outline"
												size="sm"
												className="rounded-full"
												onClick={() =>
													toggleProperty(item.property_id, item.property!.name)
												}
											>
												{item.property.name}
											</Button>
										)
									})}
								</div>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>

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
							Member
						</Button>
					</div>
				</div>
			</form>
		</Form>
	)
}
