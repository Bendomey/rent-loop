import { useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { CURRENT_USER_QUERY_KEY, useUpdateUserMe } from '~/api/auth'
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { getErrorMessage } from '~/lib/error-messages'

interface Props {
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	initials: string
}

export default function RemovePhotoModal({
	opened,
	setOpened,
	initials,
}: Props) {
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const { mutate, isPending } = useUpdateUserMe()

	const handleRemove = () => {
		mutate(
			{ profile_photo_url: null },
			{
				onError: (e: unknown) => {
					if (e instanceof Error) {
						toast.error(
							getErrorMessage(
								e.message,
								'Failed to remove profile photo. Try again later.',
							),
						)
					}
				},
				onSuccess: () => {
					toast.success('Profile photo removed')
					void queryClient.invalidateQueries({
						queryKey: CURRENT_USER_QUERY_KEY,
					})
					setOpened(false)
					void revalidator.revalidate()
				},
			},
		)
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="sm:max-w-md">
				<AlertDialogHeader>
					<div className="bg-primary/10 text-primary mb-2 flex size-12 items-center justify-center rounded-xl">
						<Trash2 className="size-5" />
					</div>
					<AlertDialogTitle>Remove your photo?</AlertDialogTitle>
					<AlertDialogDescription>
						We&rsquo;ll show your initials{' '}
						<span className="text-foreground font-semibold">{initials}</span>{' '}
						instead. You can upload a new photo at any time.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					{/*
						A plain Button, not AlertDialogAction: Radix's AlertDialogAction
						always closes the dialog synchronously on click, which would race
						ahead of the async remove call.
					*/}
					<Button
						type="button"
						disabled={isPending}
						onClick={handleRemove}
						className="bg-primary hover:bg-primary/90 text-white"
					>
						{isPending ? <Spinner /> : null}
						Remove photo
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
