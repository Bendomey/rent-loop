import { UpdateClientEmailProvider, useUpdateClientEmailContext } from './context'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Step0 } from './steps/step0'
import { Step1 } from './steps/step1'
import { TypographyH3, TypographyMuted } from '~/components/ui/typography'
import type { Dispatch, SetStateAction } from 'react'
import { useAuth } from '~/providers/auth-provider'

interface Props {
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

export function UpdateClientEmail({ opened, setOpened }: Props) {
	const { currentUser } = useAuth()

	return (
		<UpdateClientEmailProvider initialEmail={currentUser?.email} setOpened={setOpened}>
			<AlertDialog open={opened} onOpenChange={setOpened}>
				<AlertDialogContent className="rounded-xl">
					<AlertDialogHeader>
						<AlertDialogTitle>Update Email</AlertDialogTitle>
						<AlertDialogDescription>
							<TypographyMuted className="text-center">
								Change your email address securely through OTP verification.
							</TypographyMuted>
						</AlertDialogDescription>
					</AlertDialogHeader>

					<div className="w-full max-w-4xl px-4 md:px-0">
						<StepRouter />
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</UpdateClientEmailProvider>
	)
}

function StepRouter() {
	const { stepCount, closeModal } = useUpdateClientEmailContext()
	const steps = ['Verify current email', 'Verify new email', 'Completed']
	const progress = Math.min(100, ((stepCount + 1) / steps.length) * 100)

	return (
		<>
			<div className="mb-4 rounded-md border bg-slate-50 p-3 text-sm">
				<div className="font-semibold">Step {Math.min(stepCount + 1, steps.length)} of {steps.length}</div>
				<div className="text-xs text-slate-500">{steps[Math.min(stepCount, steps.length - 1)]}</div>
				<div className="mt-2 h-2 w-full rounded-full bg-slate-200">
					<div className="h-full rounded-full bg-rose-600" style={{ width: `${progress}%` }} />
				</div>
			</div>

			{stepCount === 0 && <Step0 />}
			{stepCount === 1 && <Step1 />}
			{stepCount >= 2 && (
				<div className="p-8 text-center">
					<TypographyH3 className="text-lg font-semibold">Success</TypographyH3>
					<TypographyMuted>Your email has been updated successfully.</TypographyMuted>
					<div className="mt-6">
						<Button onClick={closeModal} size="lg">
							Close
						</Button>
					</div>
				</div>
			)}
		</>
	)
}
