import { useForm } from 'react-hook-form'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { ImageUpload } from '~/components/ui/image-upload'
import { Input } from '~/components/ui/input'
import {
	Select,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SelectContent,
} from '~/components/ui/select'

export function PropertyTenantApplicationBasic() {
	const rhfMethods = useForm({
		// resolver: zodResolver(ValidationSchema),
		// defaultValues: {
		// 	marital_status: formData.marital_status || 'SINGLE',
		// 	gender: formData.gender || 'MALE',
		// },
	})
	const { control } = rhfMethods

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>Basic Information</CardTitle>
				<CardDescription>
					Review and update tenant's basic information of tenant.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3">
				<Form {...rhfMethods}>
					<form>
						<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
							<div className="col-span-2">
								<ImageUpload
									hero
									shape="square"
									hint="Optional"
									acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
									// error={rhfMethods.formState.errors?.profile_photo_url?.message}
									// fileCallback={upload}
									// isUploading={isUploading}
									dismissCallback={() => {
										rhfMethods.setValue('profile_photo_url', undefined, {
											shouldDirty: true,
											shouldValidate: true,
										})
									}}
									// imageSrc={safeString(rhfMethods.watch('profile_photo_url'))}
									label="Profile Picture"
									name="image_url"
									validation={{
										maxByteSize: 5242880, // 5MB
									}}
								/>
							</div>
							<div>
								<FormField
									name="first_name"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												First Name <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div>
								<FormField
									name="last_name"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Last Name <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="col-span-2">
								<FormField
									name="other_names"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Other Names</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
											<FormDescription>Optional</FormDescription>
										</FormItem>
									)}
								/>
							</div>
							<div>
								<FormField
									name="gender"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Gender <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Please select" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="MALE">Male</SelectItem>
														<SelectItem value="FEMALE">Female</SelectItem>
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div>
								<FormField
									name="marital_status"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Marital Status <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Select
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Please select" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="SINGLE">Single</SelectItem>
														<SelectItem value="MARRIED">Married</SelectItem>
														<SelectItem value="DIVORCED">Divorced</SelectItem>
														<SelectItem value="WIDOWED">Widowed</SelectItem>
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div>
								<FormField
									name="email"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input {...field} type="text" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div>
								<FormField
									name="phone"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Phone <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input {...field} type="text" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="col-span-2">
								<FormField
									name="date_of_birth"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Date of birth <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<DatePickerInput
													value={field.value}
													onChange={field.onChange}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
					</form>
				</Form>
			</CardContent>

			<CardFooter className="flex justify-end">
				<div className="flex flex-row items-center space-x-2">
					<Button disabled>Save</Button>
				</div>
			</CardFooter>
		</Card>
	)
}
