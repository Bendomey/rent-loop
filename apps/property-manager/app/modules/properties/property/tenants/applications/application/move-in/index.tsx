import { useForm } from 'react-hook-form'
// import { useParams } from 'react-router'
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
// import { useProperty } from '~/providers/property-provider'

export function PropertyTenantApplicationMoveIn() {
	// const { applicationId } = useParams()
	// const { clientUserProperty } = useProperty()
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
				<CardTitle>Move In Setup</CardTitle>
				<CardDescription>
					Setup move-in details for the tenant.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-3">
				<Form {...rhfMethods}>
					<form>
						<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
							<div className="col-span-2">
								<FormField
									name="desired_move_in_date"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Desired Move In Date
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
							<div>
								<FormField
									name="stay_duration_frequency"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Stay Duration Frequency
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
														<SelectItem value="HOURS">Hours</SelectItem>
														<SelectItem value="DAYS">Days</SelectItem>
														<SelectItem value="MONTHS">Months</SelectItem>
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
									name="other_names"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Stay Duration Number
											</FormLabel>
											<FormControl>
												<Input type="number" {...field} />
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
