import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useLoaderData, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
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
	role: z.enum(['ADMIN', 'STAFF']),
	property_assignments: z.array(
		z.object({
			property_id: z.string(),
			name: z.string(),
			role: z.enum(['MANAGER', 'STAFF']),
		}),
	),
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
	const isOwner = member.role === 'OWNER'

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
			role: isOwner ? undefined : (member.role as FormSchema['role']),
			property_assignments: memberProperties.map((mp) => ({
				property_id: mp.property_id,
				name: safeString(mp.property?.name),
				role: mp.role,
			})),
		},
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control } = rhfMethods

	const { fields, append, remove, update } = useFieldArray({
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
		role: FormSchema['property_assignments'][number]['role'],
	) => {
		const index = fields.findIndex((f) => f.property_id === propertyId)
		const field = fields[index]
		if (index !== -1 && field) {
			update(index, {
				property_id: field.property_id,
				name: field.name,
				role,
			})
		}
	}

	const onSubmit = async (data: FormSchema) => {
		try {
			await updateMember({
				clientId: safeString(clientUser?.client_id),
				id: safeString(memberId),
				role: isOwner ? undefined : data.role,
				property_assignments: data.property_assignments.map((a) => ({
					property_id: a.property_id,
					role: a.role,
				})),
			})

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
						<FormItem>
							<FormLabel>Full Name</FormLabel>
							<Input
								value={member.user?.name}
								disabled
								className="opacity-60"
							/>
						</FormItem>

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

						<FormItem>
							<FormLabel>Phone Number</FormLabel>
							<Input
								value={member.user?.phone_number}
								disabled
								className="opacity-60"
							/>
						</FormItem>

						<p className="text-muted-foreground text-xs">
							Editing name, email, and phone number isn't supported yet.
						</p>

						{isOwner ? (
							<FormItem>
								<FormLabel>Role</FormLabel>
								<Input value="Owner" disabled className="opacity-60" />
								<p className="text-muted-foreground text-xs">
									The workspace owner's role can't be changed.
								</p>
							</FormItem>
						) : (
							<FormField
								name="role"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Role</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select a role" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="ADMIN">Admin</SelectItem>
												<SelectItem value="STAFF">Staff</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
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
																value as FormSchema['property_assignments'][number]['role'],
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
