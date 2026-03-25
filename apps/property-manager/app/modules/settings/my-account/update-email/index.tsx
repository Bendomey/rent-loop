import type { Dispatch, SetStateAction } from 'react'
import {
	UpdateClientEmailProvider,
	useUpdateClientEmailContext,
} from './context'
import { Step0 } from './steps/step0'
import { Step1 } from './steps/step1'
import { Step2 } from './steps/step2'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { TypographyMuted } from '~/components/ui/typography'
import { useAuth } from '~/providers/auth-provider'

interface Props {
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

export function UpdateClientEmail({ opened, setOpened }: Props) {
	const { currentUser } = useAuth()

	return (
		<UpdateClientEmailProvider
			initialEmail={currentUser?.email}
			setOpened={setOpened}
		>
			<AlertDialog open={opened} onOpenChange={setOpened}>
				<AlertDialogContent className="rounded-xl border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-zinc-900 dark:text-zinc-50">
							Update Email
						</AlertDialogTitle>
						<AlertDialogDescription>
							<TypographyMuted className="text-center dark:text-zinc-400">
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
	const { stepCount } = useUpdateClientEmailContext()
	const steps = ['Verify current email', 'Verify new email', 'Completed']
	const progress = Math.min(100, ((stepCount + 1) / steps.length) * 100)

	return (
		<>
			<div className="mb-4 rounded-md border border-zinc-200 bg-slate-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
				<div className="font-semibold text-zinc-900 dark:text-zinc-50">
					Step {Math.min(stepCount + 1, steps.length)} of {steps.length}
				</div>
				<div className="text-xs text-slate-500 dark:text-zinc-400">
					{steps[Math.min(stepCount, steps.length - 1)]}
				</div>
				<div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-700">
					<div
						className="h-full rounded-full bg-rose-600 transition-all"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>

			{stepCount === 0 && <Step0 />}
			{stepCount === 1 && <Step1 />}
			{stepCount >= 2 && <Step2 />}
		</>
	)
}
