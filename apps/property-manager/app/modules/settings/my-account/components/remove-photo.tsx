import { Trash2 } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'

interface Props {
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	initials: string
}

/**
 * UI only — removing the profile photo is not wired to the API yet.
 */
export default function RemovePhotoModal({
	opened,
	setOpened,
	initials,
}: Props) {
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
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction className="bg-primary hover:bg-primary/90 text-white">
						Remove photo
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
