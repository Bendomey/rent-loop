import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router'
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
	propertyId: string
	propertyName: string
	opened: boolean
	setOpened: (v: boolean) => void
}

export function RestoreDoneModal({
	propertyId,
	propertyName,
	opened,
	setOpened,
}: Props) {
	const navigate = useNavigate()

	const openProperty = () => {
		setOpened(false)
		void navigate(`/properties/${propertyId}`)
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="sm:max-w-md">
				<div className="flex flex-col items-center py-4 text-center">
					<div className="flex size-[74px] items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
						<CheckCircle2 className="size-9 text-emerald-600 dark:text-emerald-400" />
					</div>
					<AlertDialogHeader className="mt-5 items-center">
						<AlertDialogTitle className="font-serif text-2xl font-normal">
							Property restored
						</AlertDialogTitle>
						<AlertDialogDescription className="text-center">
							<span className="text-foreground font-medium">
								{propertyName}
							</span>{' '}
							is back in your active portfolio. It's inactive until you add
							leases or bookings.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-6 flex-row justify-center gap-2">
						<AlertDialogCancel onClick={() => setOpened(false)}>
							Back to archive
						</AlertDialogCancel>
						<AlertDialogAction onClick={openProperty}>
							Open property
						</AlertDialogAction>
					</AlertDialogFooter>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	)
}
