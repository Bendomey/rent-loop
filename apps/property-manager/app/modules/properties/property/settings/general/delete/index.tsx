import { useQueryClient } from '@tanstack/react-query'
import { AlertCircleIcon } from 'lucide-react'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { toast } from 'sonner'
import { useDeleteProperty } from '~/api/properties'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, AlertTitle } from '~/components/ui/alert'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from '~/components/ui/alert-dialog'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { convertToSlug } from '~/lib/misc'

interface Props {
	data?: Property
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

export default function ConfirmDeletePropertyModule({
	data,
	opened,
	setOpened,
}: Props) {
	const [openDeleteModal, setOpenDeleteModal] = useState(false)

	return (
		<>
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{data ? `Delete ${data.name}` : 'Delete this Property'}
					</AlertDialogTitle>

					<AlertDialogDescription>
   You’re about to permanently delete{" "}
      <strong>{data?.name ?? "this property"}</strong>. This action cannot be undone.

      <Alert variant="destructive" className="mt-4">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle>Unexpected bad things will happen if you don’t read this!</AlertTitle>

        
      </Alert>

	  <div className="mt-4 rounded-md bg-red-50 p-4">
          <p>
            Deleting <strong>{data?.name ?? "this property"}</strong> will permanently
            remove all associated data, including:
          </p>

          <ul className="mt-2 list-inside list-disc text-sm space-y-1">
            <li>Tenants</li>
            <li>Assets (Blocks, Apartments/Units, Facilities)</li>
            <li>Activities</li>
            <li>Financial data (including full transaction history)</li>
          </ul>
        </div>
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter className='sm:justify-between justify-between'>
					<AlertDialogCancel
						onClick={() => setOpenDeleteModal(false)}
					>
						Cancel
					</AlertDialogCancel>

					<AlertDialogAction
						onClick={() => setOpenDeleteModal(true)}
						className="bg-primary hover:bg-primary/90 text-white"
					>
						I have read and understand these effects
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
<DeletePropertyModule 
	data={data}
	opened={openDeleteModal}
	setOpened={setOpenDeleteModal}
	/>
	</>
	)
}



const ValidationSchema = z.object({
	confirm: z
		.string()
		.trim()
})

export type FormSchema = z.infer<typeof ValidationSchema>

export function DeletePropertyModule({
	data,
	opened,
	setOpened,
}: Props) {
	const queryClient = useQueryClient()

	const { mutate, isPending } = useDeleteProperty()
	
	const rhfMethods = useForm<FormSchema>({
		defaultValues: {
			confirm: '',
		},
		resolver: zodResolver(ValidationSchema),
	})
		
	const confirmInput = rhfMethods.watch('confirm') ?? ''
	const confirmed = convertToSlug(confirmInput) === convertToSlug(data?.name ?? '')
			
	const handleSubmit = () => {
		if (data && confirmed) {
			mutate(data?.id,
				{
					onError: () => {
						toast.error(`Failed to delete property. Try again later.`)
					},
					onSuccess: () => {
						toast.success(`Property has been successfully deleted`)

						void queryClient.invalidateQueries({
							queryKey: [QUERY_KEYS.CLIENT_USER_PROPERTIES],
						})
						setOpened(false)
					},
				},
			)
		}
	}

	const disabled = isPending || !confirmed

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className='mb-2'>
						{data ? `Delete ${data.name}` : 'Delete this Property'}
					</AlertDialogTitle>
<Form {...rhfMethods}>

					<AlertDialogDescription>
						<FormField
							name="confirm"
							control={rhfMethods.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>To confirm, type "{convertToSlug(data?.name ?? '')}" in the box below</FormLabel>
									<FormControl>
										<Input type="text" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
							/>
					</AlertDialogDescription>
							</Form>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel
						disabled={isPending}
						onClick={() => setOpened(false)}
					>
						Cancel
					</AlertDialogCancel>

					<AlertDialogAction
						disabled={disabled}
						onClick={() => handleSubmit()}
						className="bg-primary hover:bg-primary/90 text-white"
					>
						{isPending ? <Spinner /> : null} Yes, Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
