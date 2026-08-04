import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { InfoRow } from './info-row'
import { useUpdateTenant } from '~/api/tenants'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import { Card, CardAction, CardContent, CardHeader } from '~/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { DocumentUpload } from '~/components/ui/document-upload'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH4 } from '~/components/ui/typography'
import { useUploadObject } from '~/hooks/use-upload-object'
import { safeString } from '~/lib/strings'

const ValidationSchema = z.object({
	employer: z.string().trim().min(1, 'This field is required'),
	occupation: z.string().optional(),
	occupation_address: z.string().trim().min(1, 'Address is required'),
	proof_of_income_url: z.string().nullable().optional(),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function TenantProfileEmploymentCard({ tenant }: { tenant: Tenant }) {
	const revalidator = useRevalidator()
	const [isOpen, setIsOpen] = useState(false)
	const isStudent = tenant.employer_type === 'STUDENT'

	const {
		upload,
		objectUrl,
		isLoading: isUploading,
	} = useUploadObject('tenants/proof-of-income')

	const defaultValues: FormSchema = {
		employer: safeString(tenant.employer),
		occupation: safeString(tenant.occupation),
		occupation_address: safeString(tenant.occupation_address),
		proof_of_income_url: tenant.proof_of_income_url ?? null,
	}

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues,
	})

	useEffect(() => {
		if (objectUrl) {
			rhfMethods.setValue('proof_of_income_url', objectUrl, {
				shouldDirty: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [objectUrl])

	const { handleSubmit, reset } = rhfMethods
	const { isPending, mutate } = useUpdateTenant()

	const handleOpenChange = (open: boolean) => {
		if (open) {
			reset(defaultValues)
		}
		setIsOpen(open)
	}

	const onSubmit = (data: FormSchema) => {
		mutate(
			{ tenant_id: tenant.id, data },
			{
				onError: () => {
					toast.error('Failed to update employment details. Try again later.')
				},
				onSuccess: () => {
					toast.success('Employment details updated successfully.')
					void revalidator.revalidate()
					setIsOpen(false)
				},
			},
		)
	}

	return (
		<Card>
			<CardHeader>
				<TypographyH4>Employment</TypographyH4>
				<CardAction>
					<PropertyPermissionGuard roles={['MANAGER']}>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleOpenChange(true)}
						>
							<Pencil className="h-4 w-4" />
						</Button>
					</PropertyPermissionGuard>
				</CardAction>
			</CardHeader>
			<CardContent className="space-y-4">
				<Separator />
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<InfoRow label="Employer" value={tenant?.employer} />
					<InfoRow label="Occupation" value={tenant?.occupation} />
					<InfoRow label="Work Address" value={tenant?.occupation_address} />
					<InfoRow
						label="Proof of Income"
						value={
							tenant?.proof_of_income_url ? (
								<a
									href={tenant.proof_of_income_url}
									target="_blank"
									rel="noreferrer"
									className="text-primary underline"
								>
									View
								</a>
							) : (
								'N/A'
							)
						}
					/>
				</div>
			</CardContent>

			<Dialog open={isOpen} onOpenChange={handleOpenChange}>
				<DialogContent className="flex max-h-[85vh] flex-col overflow-hidden">
					<DialogHeader>
						<DialogTitle>Edit Employment</DialogTitle>
						<DialogDescription>
							Update the tenant&apos;s employment details.
						</DialogDescription>
					</DialogHeader>

					<div className="min-h-0 flex-1 overflow-y-auto px-1">
						<Form {...rhfMethods}>
							<form
								id="tenant-employment-form"
								className="space-y-4"
								onSubmit={handleSubmit(onSubmit)}
							>
								{!isStudent && (
									<FormField
										name="occupation"
										control={rhfMethods.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Occupation</FormLabel>
												<FormControl>
													<Input type="text" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
								<FormField
									name="employer"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{isStudent ? 'Institution/School' : 'Employer'}{' '}
												<span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									name="occupation_address"
									control={rhfMethods.control}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Address <span className="text-red-500">*</span>
											</FormLabel>
											<FormControl>
												<Input type="text" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<DocumentUpload
									hint="Optional"
									documentName={
										rhfMethods.watch('proof_of_income_url')
											? `Proof of ${isStudent ? 'Admission' : 'Income'}`
											: undefined
									}
									fileCallback={upload}
									isUploading={isUploading}
									dismissCallback={() =>
										rhfMethods.setValue('proof_of_income_url', null, {
											shouldDirty: true,
										})
									}
									label={`Proof of ${isStudent ? 'Admission' : 'Income'}`}
									name="proof_of_income_url"
									maxByteSize={5242880}
								/>
							</form>
						</Form>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							form="tenant-employment-form"
							disabled={isPending || !rhfMethods.formState.isDirty}
						>
							{isPending ? <Spinner /> : null} Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	)
}
