import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, MapPin } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useTenantApplicationContext } from '../context'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'

const ValidationSchema = z.object({
	current_address: z
		.string({ error: 'Current Address is required' })
		.min(5, 'Please enter a valid address'),
})

export type FormSchema = z.infer<typeof ValidationSchema>

export function CurrentAddress() {
	const { formData, updateFormData, setOpenAddress, isOpenAddress } =
		useTenantApplicationContext()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control, setValue } = rhfMethods

	useEffect(() => {
		if (formData.current_address) {
			setValue('current_address', formData.current_address, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formData])

	const onAddressSubmit = async (data: FormSchema) => {
		updateFormData({
			current_address: data.current_address,
		})
		setOpenAddress(false)
	}

	return (
		<AlertDialog open={isOpenAddress} onOpenChange={setOpenAddress}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-3 text-left">
						<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 sm:h-9 sm:w-9">
							<MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
						</span>
						<div>
							<h2 className="text-lg leading-tight font-semibold text-zinc-900">
								Current address
							</h2>
							<p className="mt-0.5 text-sm text-zinc-500">
								Please provide your current address
							</p>
						</div>
					</AlertDialogTitle>

					<AlertDialogDescription className="w-full">
						<Form {...rhfMethods}>
							<form
								onSubmit={handleSubmit(onAddressSubmit)}
								className="mt-4 w-full space-y-4 rounded-lg border border-zinc-100 bg-zinc-50 p-5 text-left md:p-8"
							>
								<FormField
									name="current_address"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-sm font-medium text-zinc-700">
												Address{' '}
												<span className="text-red-500" aria-hidden>
													*
												</span>
											</FormLabel>
											<FormControl>
												<Input
													type="text"
													placeholder="e.g., East Legon, Accra"
													className="mt-1.5 h-10 placeholder:text-sm placeholder:text-zinc-400 focus-visible:ring-rose-500"
													{...field}
												/>
											</FormControl>
											<FormMessage className="mt-1.5 text-xs" />
										</FormItem>
									)}
								/>

								<div className="mt-10 flex flex-col-reverse gap-3 border-t pt-6 md:flex-row md:justify-between">
									<Button
										type="button"
										size="default"
										variant="outline"
										className="w-full md:w-auto"
										onClick={() => setOpenAddress(false)}
									>
										Cancel
									</Button>
									<Button
										size="default"
										variant="default"
										className="w-full bg-rose-600 hover:bg-rose-700 md:w-auto"
									>
										Continue
										<ArrowRight className="h-4 w-4" />
									</Button>
								</div>
							</form>
						</Form>
					</AlertDialogDescription>
				</AlertDialogHeader>
			</AlertDialogContent>
		</AlertDialog>
	)
}
