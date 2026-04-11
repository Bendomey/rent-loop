import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Check, HelpCircle, Phone } from 'lucide-react'
import { useRef } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useLoaderData, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	linkClientUserToProperties,
	unlinkClientUserFromProperties,
} from '~/api/client-user-properties'
import { useUpdateClientUser } from '~/api/client-users'
import { useGetMyProperties } from '~/api/properties'
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
	SelectItem,
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
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth._dashboard.settings.members.$memberId._index'

const ValidationSchema = z.object({
	name: z
		.string({ error: 'Name is required' })
		.min(2, 'Please enter a valid name'),
	phone: z
		.string({ error: 'Phone number is required' })
		.min(9, 'Please enter a valid phone number'),
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

type FormSchema = z.infer<typeof ValidationSchema>

export function EditMemberModule() {
	const { member, memberProperties } = useLoaderData<typeof loader>()
	const { memberId } = useParams()
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { mutateAsync: updateMember, isPending: isUpdating } =
		useUpdateClientUser()
	const { clientUser } = useClient()

	const initialAssignments = useRef(
		memberProperties.map((mp) => ({
			property_id: mp.property_id,
			role: mp.role,
		})),
	)

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
			name: member.user?.name,
			phone: safeString(member.user?.phone_number).slice(-9),
			property_assignments: memberProperties.map((mp) => ({
				property_id: mp.property_id,
				name: safeString(mp.property?.name),
				role: mp.role,
			})),
		},
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control, getValues } = rhfMethods

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'property_assignments',
	})

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
		try {
			// Update name + phone
			await updateMember({
				clientId: safeString(clientUser?.client_id),
				id: safeString(memberId),
				name: data.name,
				phoneNumber: `+233${getValues('phone').slice(-9)}`,
			})

			// Diff property assignments
			const initial = initialAssignments.current
			const next = data.property_assignments

			const toUnlink = initial
				.filter((i) => {
					const match = next.find((n) => n.property_id === i.property_id)
					return !match || match.role !== i.role
				})
				.map((i) => i.property_id)

			const toLink = next.filter((n) => {
				const match = initial.find((i) => i.property_id === n.property_id)
				return !match || match.role !== n.role
			})

			if (toUnlink.length > 0) {
				await unlinkClientUserFromProperties({
					clientId: safeString(clientUser?.client_id),
					client_user_id: safeString(memberId),
					property_ids: toUnlink,
				})
			}

			if (toLink.length > 0) {
				// Group by role — each link call accepts one role for all properties
				const byRole = toLink.reduce<Record<string, string[]>>((acc, item) => {
					acc[item.role] = [...(acc[item.role] ?? []), item.property_id]
					return acc
				}, {})

				await Promise.all(
					Object.entries(byRole).map(([role, property_ids]) =>
						linkClientUserToProperties({
							clientId: safeString(clientUser?.client_id),
							client_user_id: safeString(memberId),
							property_ids,
							role: role as 'MANAGER' | 'STAFF',
						}),
					),
				)
			}

			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.CLIENT_USERS],
			})
			toast.success('Member updated successfully')
			void navigate('/settings/members')
		} catch {
			toast.error('Failed to update member. Please try again.')
		}
	}

	const properties = myProperties?.rows ?? []
	const isPending = isUpdating

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-2 max-w-lg md:mx-auto"
			>
				<div className="space-y-1">
					<TypographyH2>Edit Member</TypographyH2>
					<TypographyMuted>
						Update {member.user?.name}&apos;s details below.
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

						<FormItem>
							<FormLabel>Email</FormLabel>
							<Input
								value={member.user?.email}
								disabled
								className="opacity-60"
							/>
							<p className="text-muted-foreground text-xs">
								Email cannot be changed as it's the primary identifier for the
								member.
							</p>
						</FormItem>

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
														<p>Ghana phone number</p>
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

				<Separator className="my-10" />

				<FormField
					name="property_assignments"
					control={control}
					render={() => (
						<FormItem>
							<TypographyH4>Assigned Properties</TypographyH4>
							<TypographyMuted>
								Select the properties this member should have access to.
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
							disabled={isPending}
							type="submit"
							className="bg-rose-600 hover:bg-rose-700"
						>
							{isPending ? <Spinner /> : null} Save Changes
						</Button>
					</div>
				</div>
			</form>
		</Form>
	)
}
