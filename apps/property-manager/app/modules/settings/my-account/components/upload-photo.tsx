import { useQueryClient } from '@tanstack/react-query'
import { Camera } from 'lucide-react'
import { type Dispatch, type SetStateAction } from 'react'
import { useRevalidator } from 'react-router'
import { toast } from 'sonner'
import { CURRENT_USER_QUERY_KEY, useUpdateUserMe } from '~/api/auth'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { ImageUpload } from '~/components/ui/image-upload'
import { Spinner } from '~/components/ui/spinner'
import { useUploadObject } from '~/hooks/use-upload-object'
import { getErrorMessage } from '~/lib/error-messages'
import { safeString } from '~/lib/strings'

interface Props {
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	currentPhotoUrl?: Maybe<string>
}

export default function UploadPhotoModal({
	opened,
	setOpened,
	currentPhotoUrl,
}: Props) {
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()

	const { upload, objectUrl, isLoading: isUploading } = useUploadObject(
		'users/profile-photos',
	)
	const { mutate, isPending } = useUpdateUserMe()

	const handleSave = () => {
		if (!objectUrl) {
			setOpened(false)
			return
		}
		mutate(
			{ profile_photo_url: objectUrl },
			{
				onError: (e: unknown) => {
					if (e instanceof Error) {
						toast.error(
							getErrorMessage(
								e.message,
								'Failed to update profile photo. Try again later.',
							),
						)
					}
				},
				onSuccess: () => {
					toast.success('Profile photo updated')
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
		<Dialog open={opened} onOpenChange={setOpened}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<div className="bg-muted mb-2 flex size-12 items-center justify-center rounded-xl">
						<Camera className="size-5" />
					</div>
					<DialogTitle>Upload a profile photo</DialogTitle>
					<DialogDescription>
						A square image works best — it&rsquo;s cropped to a circle
						everywhere it appears.
					</DialogDescription>
				</DialogHeader>

				<ImageUpload
					shape="circle"
					hint="JPG or PNG, up to 5MB"
					acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
					fileCallback={upload}
					isUploading={isUploading}
					imageSrc={safeString(objectUrl ?? currentPhotoUrl)}
					label="Profile Photo"
					name="profile_photo_url"
					validation={{
						maxByteSize: 5120000, // 5MB
					}}
				/>

				<DialogFooter>
					<Button
						variant="outline"
						disabled={isPending}
						onClick={() => setOpened(false)}
					>
						Cancel
					</Button>
					<Button
						disabled={isPending || isUploading || !objectUrl}
						onClick={handleSave}
					>
						{isPending ? <Spinner /> : null}
						Save photo
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
