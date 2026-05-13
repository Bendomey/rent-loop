import { zodResolver } from '@hookform/resolvers/zod'
import {
	CircleUserRound,
	DoorClosed,
	HelpCircle,
	Home,
	Mail,
	Phone,
} from 'lucide-react'
import { lazy, Suspense, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useFetcher, useLoaderData } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { AddressSchema } from '~/components/address-input'

const AddressInput = lazy(() =>
	import('~/components/address-input').then((m) => ({
		default: m.AddressInput,
	})),
)
import { BlockNavigationDialog } from '~/components/block-navigation-dialog'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '~/components/ui/field'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
// import { ImageUpload } from '~/components/ui/image-upload'
import { Input } from '~/components/ui/input'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '~/components/ui/input-group'
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemHeader,
	ItemTitle,
} from '~/components/ui/item'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import {
	TypographyH1,
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'
import { useNavigationBlocker } from '~/hooks/use-navigation-blocker'
// import { useUploadObject } from '~/hooks/use-upload-object'
import { APP_NAME } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
// import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import type { loader } from '~/routes/apply._index'

const maxBirthDate = localizedDayjs().subtract(18, 'year').toDate()

const models = [
	{
		type: 'INDIVIDUAL' as const,
		name: 'Individual',
		description: 'Owns and rents out their own properties.',
		icon: CircleUserRound,
	},
	{
		type: 'COMPANY' as const,
		name: 'Company',
		description: 'Manages properties on behalf of owners.',
		icon: DoorClosed,
	},
]

const subTypes: Array<{ label: string; value: ClientApplication['sub_type'] }> =
	[
		{ label: 'Property Manager', value: 'PROPERTY_MANAGER' },
		{ label: 'Developer', value: 'DEVELOPER' },
		{ label: 'Agency', value: 'AGENCY' },
	]

const ValidationSchema = z
	.object({
		type: z.enum(['INDIVIDUAL', 'COMPANY'], {
			error: 'Please select a type',
		}),
		sub_type: z
			.enum(['LANDLORD', 'PROPERTY_MANAGER', 'DEVELOPER', 'AGENCY'], {
				error: 'Please select a sub type',
			})
			.optional()
			.nullable(),
		name: z
			.string({ error: 'Name is required' })
			.min(2, 'Please enter a valid name'),
		description: z
			.string()
			.max(500, 'Description must be less than 500 characters')
			.optional(),
		logo_url: z.url('Please upload a logo').optional(),
		contact_name: z.string().min(2, 'Please enter a valid name').optional(),
		date_of_birth: z
			.date()
			.refine((date) => {
				const today = new Date()
				const age = today.getFullYear() - date.getFullYear()
				return age >= 18
			}, 'You must be at least 18 years old')
			.optional(),
		contact_email: z.email('Please enter a valid email address'),
		contact_phone_number: z
			.string({ error: 'Contact phone number is required' })
			.min(9, 'Please enter a valid phone number'),
	})
	.merge(AddressSchema)
	.superRefine((data, ctx) => {
		if (data.type === 'COMPANY') {
			if (!data.sub_type || data.sub_type === 'LANDLORD') {
				ctx.addIssue({
					code: 'custom',
					message: 'Please select a sub type',
					path: ['sub_type'],
				})
			}
			if (!data.contact_name) {
				ctx.addIssue({
					code: 'custom',
					message: 'Please enter a valid name',
					path: ['contact_name'],
				})
			}
		}
		if (data.type === 'INDIVIDUAL') {
			if (!data.date_of_birth) {
				ctx.addIssue({
					code: 'custom',
					message: 'Please enter your date of birth',
					path: ['date_of_birth'],
				})
			}
		}
	})

type FormSchema = z.infer<typeof ValidationSchema>

export function ApplyModule() {
	const { rentLoopWebsiteUrl } = useLoaderData<typeof loader>()
	const applyFetcher = useFetcher<{ error: string }>()
	const isSubmitting = applyFetcher.state !== 'idle'

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			type: 'INDIVIDUAL',
		},
	})

	const { watch, setValue, formState, handleSubmit, control } = rhfMethods
	const isIndividual = watch('type') === 'INDIVIDUAL'

	// const {
	// 	upload,
	// 	objectUrl,
	// 	isLoading: isUploading,
	// } = useUploadObject('property-owners/logos')

	const blocker = useNavigationBlocker(isSubmitting ? false : formState.isDirty)

	// useEffect(() => {
	// 	if (objectUrl) {
	// 		setValue('logo_url', objectUrl, { shouldDirty: true, shouldValidate: true })
	// 	}
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [objectUrl])

	useEffect(() => {
		if (applyFetcher?.data?.error) {
			toast.error('Failed to apply. Please try again.')
		}
	}, [applyFetcher?.data])

	const onSubmit = async (data: FormSchema) => {
		const sub_type = data.type === 'INDIVIDUAL' ? 'LANDLORD' : data.sub_type
		const contact_name =
			data.type === 'INDIVIDUAL' ? data.name : data.contact_name
		const contact_phone_number = `+233${data.contact_phone_number.slice(-9)}`

		const fd = new FormData()
		fd.set('type', data.type)
		if (sub_type) fd.set('sub_type', sub_type)
		fd.set('name', data.name)
		if (data.description) fd.set('description', data.description)
		if (data.logo_url) fd.set('logo_url', data.logo_url)
		if (contact_name) fd.set('contact_name', contact_name)
		if (data.date_of_birth) {
			fd.set(
				'date_of_birth',
				localizedDayjs(data.date_of_birth).format('YYYY-MM-DD'),
			)
		}
		fd.set('contact_email', data.contact_email)
		fd.set('contact_phone_number', contact_phone_number)
		fd.set('address', data.address)
		fd.set('city', data.city)
		fd.set('region', data.region)
		fd.set('country', data.country)
		fd.set('latitude', String(data.latitude))
		fd.set('longitude', String(data.longitude))

		await applyFetcher.submit(fd, {
			method: 'POST',
			action: '/apply',
		})
	}

	const isAddressInvalid =
		!!formState.errors.addressSearch ||
		!!formState.errors.address ||
		!!formState.errors.city ||
		!!formState.errors.region ||
		!!formState.errors.country ||
		!!formState.errors.latitude ||
		!!formState.errors.longitude

	return (
		<main className="w-full">
			<div className="border-b py-4 md:py-6">
				<Link to="/login">
					<TypographyH1 className="text-center">
						<span className="font-extrabold text-rose-700">
							{APP_NAME.slice(0, 4)}
						</span>
						<span className="font-extrabold">{APP_NAME.slice(4)}</span>
					</TypographyH1>
				</Link>
			</div>

			<div className="mx-4 mt-10 max-w-3xl md:mx-auto md:mt-14">
				<Form {...rhfMethods}>
					<form onSubmit={handleSubmit(onSubmit)} className="mb-5 space-y-10">
						{/* Account Type */}
						<div className="space-y-2">
							<TypographyH2>What type of Property Owner are you?</TypographyH2>
							<TypographyMuted>
								This will help us setup your account to handle your properties
								more effectively.
							</TypographyMuted>
						</div>

						<div>
							<ItemGroup className="grid grid-cols-2 gap-4">
								{models.map((model) => {
									const isSelected = watch('type') === model.type
									return (
										<Item
											key={model.name}
											variant="outline"
											className={cn(
												'cursor-pointer hover:bg-zinc-100',
												isSelected ? 'border-1 border-rose-600' : '',
											)}
											onClick={() =>
												setValue('type', model.type, {
													shouldDirty: true,
													shouldValidate: true,
												})
											}
										>
											<ItemHeader className="flex items-center justify-center">
												<model.icon className="size-20" />
											</ItemHeader>
											<ItemContent className="flex items-center justify-center">
												<ItemTitle>{model.name}</ItemTitle>
												<ItemDescription className="text-center">
													{model.description}
												</ItemDescription>
											</ItemContent>
										</Item>
									)
								})}
							</ItemGroup>
							{formState.errors?.type ? (
								<TypographySmall className="text-destructive">
									{formState.errors.type.message}
								</TypographySmall>
							) : null}

							{watch('type') === 'COMPANY' ? (
								<div className="mt-5">
									<TypographyMuted>Sub Type</TypographyMuted>
									<div className="mt-3 flex gap-x-3">
										{subTypes.map((subType) => {
											const isSelected = watch('sub_type') === subType.value
											return (
												<Button
													type="button"
													onClick={() =>
														setValue('sub_type', subType.value, {
															shouldDirty: true,
															shouldValidate: true,
														})
													}
													key={subType.value}
													variant={isSelected ? 'default' : 'outline'}
													className={cn(
														isSelected
															? 'bg-zinc-900 text-white hover:bg-zinc-800'
															: '',
													)}
												>
													{subType.label}
												</Button>
											)
										})}
									</div>
									{formState.errors?.sub_type ? (
										<TypographySmall className="text-destructive mt-3">
											{formState.errors.sub_type.message}
										</TypographySmall>
									) : null}
								</div>
							) : null}
						</div>

						<hr />

						{/* Basic Information */}
						<div className="space-y-2">
							<TypographyH2>
								{isIndividual ? 'Basic' : 'Company'} Information
							</TypographyH2>
							<TypographyMuted>
								{isIndividual
									? 'Please provide your personal information as an individual property owner.'
									: "Please provide your company's information to proceed with the application."}
							</TypographyMuted>
						</div>

						<FieldGroup>
							<FormField
								name="name"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input type="text" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{isIndividual ? (
								<FormField
									name="date_of_birth"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Date of birth</FormLabel>
											<FormControl>
												<DatePickerInput
													value={field.value}
													onChange={field.onChange}
													disabled={(date) => date > maxBirthDate}
													endMonth={maxBirthDate}
												/>
											</FormControl>
											<FormDescription>
												You must be at least 18 years old to apply as an
												individual property owner.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							) : (
								<>
									<FormField
										name="description"
										control={control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>About</FormLabel>
												<FormControl>
													<Textarea
														placeholder="About the company..."
														rows={5}
														{...field}
													/>
												</FormControl>
												<FormDescription>
													Any details you want to share about the company?
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* <ImageUpload
										shape="circle"
										hint="Optional"
										acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
										error={formState.errors?.logo_url?.message}
										fileCallback={upload}
										isUploading={isUploading}
										dismissCallback={() => {
											setValue('logo_url', undefined, {
												shouldDirty: true,
												shouldValidate: true,
											})
										}}
										imageSrc={safeString(watch('logo_url'))}
										label="Logo"
										name="logo"
										validation={{
											maxByteSize: 2048000,
										}}
									/> */}
								</>
							)}
						</FieldGroup>

						<hr />

						{/* Address */}
						<div className="space-y-2">
							<TypographyH2>Address Information</TypographyH2>
							<TypographyMuted>
								{isIndividual
									? 'Where are you located?'
									: "Where is the company's headquarters location?"}
							</TypographyMuted>
						</div>

						<FieldGroup>
							<Field data-invalid={isAddressInvalid}>
								<FieldLabel htmlFor="address">Address</FieldLabel>
								<Suspense>
									<AddressInput />
								</Suspense>
								{isAddressInvalid ? (
									<FieldError
										errors={[
											{ message: 'Kindly select a location from the list' },
										]}
									/>
								) : null}
							</Field>
						</FieldGroup>

						<hr />

						{/* Contact Details */}
						<div className="space-y-2">
							<TypographyH2>Contact Person Information</TypographyH2>
							<TypographyMuted>
								Almost done!{' '}
								{isIndividual
									? 'Kindly enter your account details to complete the application.'
									: "Kindly enter your company's contact person"}
							</TypographyMuted>
						</div>

						<FieldGroup>
							{isIndividual ? null : (
								<FormField
									name="contact_name"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Full Name</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter your full name"
													type="text"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<FormField
								name="contact_email"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<InputGroup>
												<InputGroupInput
													type="email"
													{...field}
													placeholder="m@example.com"
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
															<p>
																We&apos;ll use this to send you notifications
															</p>
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
								name="contact_phone_number"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Phone Number</FormLabel>
										<FormControl>
											<InputGroup>
												<InputGroupInput
													{...field}
													type="tel"
													placeholder="201234567"
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
															<p>
																We&apos;ll use this to send you notifications
															</p>
														</TooltipContent>
													</Tooltip>
												</InputGroupAddon>
											</InputGroup>
										</FormControl>
										<FormMessage />
										<FormDescription>
											By clicking submit, you agree to our{' '}
											<a
												className="underline hover:text-rose-700"
												href={`${rentLoopWebsiteUrl}/terms`}
											>
												Terms of Service
											</a>{' '}
											and{' '}
											<a
												className="underline hover:text-rose-700"
												href={`${rentLoopWebsiteUrl}/privacy-policy`}
											>
												Privacy Policy
											</a>
											.
										</FormDescription>
									</FormItem>
								)}
							/>
						</FieldGroup>

						<div className="flex items-center justify-end gap-x-5">
							<Link to="/login">
								<Button type="button" size="sm" variant="ghost">
									<Home />
									Go Home
								</Button>
							</Link>
							<Button
								size="lg"
								disabled={isSubmitting}
								variant="default"
								className="bg-rose-600 hover:bg-rose-700"
							>
								{isSubmitting ? <Spinner /> : null}
								Submit
							</Button>
						</div>
					</form>
				</Form>

				<BlockNavigationDialog blocker={blocker} />
			</div>
		</main>
	)
}
