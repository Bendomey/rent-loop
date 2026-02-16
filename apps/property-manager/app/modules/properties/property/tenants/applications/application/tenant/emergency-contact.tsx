import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { ImageUpload } from '~/components/ui/image-upload'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'

const employer_type: Array<{
	label: string
	value: TenantApplication['employer_type']
}> = [
	{ label: 'Student', value: 'STUDENT' },
	{ label: 'Worker', value: 'WORKER' },
]

const ValidationSchema = z.object({
	emergency_contact_name: z
		.string({ error: 'Emergency Contact Name is required' })
		.min(2, 'Please enter a valid name'),
	relationship_to_emergency_contact: z
		.string({ error: 'Relationship to Emergency Contact is required' })
		.min(2, 'Please enter a valid relationship'),
	emergency_contact_phone: z
		.string({ error: 'Phone Number is required' })
		.min(9, 'Please enter a valid phone number'),
	employer_type: z.enum(['STUDENT', 'WORKER'], {
		error: 'Please select an employment type',
	}),
	occupation: z.string().optional(),
	employer: z.string().optional(),
	occupation_address: z.string().optional(),
	proof_of_income_url: z.url('Please upload proof of income').optional(),
})

export function PropertyTenantApplicationEmergencyContact() {
	const rhfMethods = useForm({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			// 	marital_status: formData.marital_status || 'SINGLE',
			// 	gender: formData.gender || 'MALE',
			employer_type: 'STUDENT',
		},
	})
	const { control, watch, setValue } = rhfMethods

	const isStudent = watch('employer_type') === 'STUDENT'

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>Emergency Contact & Background Information</CardTitle>
				<CardDescription>
					Review and update tenant's emergency contact information and
					background details.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3">
				<Form {...rhfMethods}>
					<form>
						<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
							<div className="col-span-2 mt-2">
								<Label>Emergency Contact</Label>
							</div>
							<div>
								<FormField
									name="emergency_contact_name"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Full Name <span className="text-red-500">*</span>
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
									name="relationship_to_emergency_contact"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Relationship <span className="text-red-500">*</span>
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
									name="emergency_contact_phone"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Phone Number <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input
													type="tel"
													placeholder="e.g., +233 54-123-4567"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="col-span-2 mt-2">
								<Label>Employment Type</Label>
								<small className="text-gray-500">
									Your current employment status
								</small>
							</div>
							<div className="col-span-2">
								<div className="flex space-x-3">
									{employer_type.map((employer_type) => {
										const isSelected =
											watch('employer_type') === employer_type.value
										return (
											<Button
												type="button"
												onClick={() =>
													setValue('employer_type', employer_type.value, {
														shouldDirty: true,
														shouldValidate: true,
													})
												}
												key={employer_type.value}
												variant={isSelected ? 'default' : 'outline'}
												className={cn('w-1/2', {
													'bg-rose-600 text-white': isSelected,
												})}
											>
												{employer_type.label}
											</Button>
										)
									})}
								</div>
							</div>

							<div className="col-span-2 mt-2">
								<Label>
									{isStudent ? 'Student Information' : 'Employment Information'}
								</Label>
							</div>
							<div className={`${isStudent ? 'col-span-2' : 'col-span-1'}`}>
								{!isStudent && (
									<FormField
										name="occupation"
										control={control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Occupation <span className="text-red-500">*</span>
												</FormLabel>
												<FormControl>
													<Input
														type="text"
														placeholder="e.g., Software Engineer"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							</div>
							<div>
								<FormField
									name="employer"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{isStudent ? 'Institution/School' : 'Employer'}{' '}
												<span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input
													type="text"
													placeholder={`e.g., ${isStudent ? 'Institution/School' : 'Company Name'}`}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className={`${isStudent ? 'col-span-1' : 'col-span-2'}`}>
								<FormField
									name="occupation_address"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Address <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input
													type="text"
													placeholder="e.g., 123 Business St, City, Country"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="col-span-2">
								<ImageUpload
									hero
									shape="square"
									hint="Optional"
									acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
									error={
										rhfMethods.formState.errors?.proof_of_income_url?.message
									}
									// fileCallback={upload}
									// isUploading={isUploading}
									dismissCallback={() => {
										rhfMethods.setValue('proof_of_income_url', undefined, {
											shouldDirty: true,
											shouldValidate: true,
										})
									}}
									imageSrc={safeString(rhfMethods.watch('proof_of_income_url'))}
									label={`Proof of ${isStudent ? 'Admission' : 'Income'}`}
									name="image_url"
									validation={{
										maxByteSize: 5242880, // 5MB
									}}
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
