import { AlertCircle } from 'lucide-react'
import { Link } from 'react-router'
import {
	CreateNewPropertyTenantApplicationProvider,
	useTenantApplicationContext,
} from './context'
import { Step0 } from './steps/step0'
import { Step1 } from './steps/step1'
import { Step2 } from './steps/step2'
import { Step3 } from './steps/step3'
import { Step4 } from './steps/step4'
import { Step5 } from './steps/step5'
import { Step6 } from './steps/step6'
import { TypographyH3, TypographyMuted } from '~/components/ui/typography'
import { APP_NAME } from '~/lib/constants'

const STEP = 6
export function TenantApply({ isValidUrl }: { isValidUrl: boolean }) {
	const { stepCount } = useTenantApplicationContext()

	if (!isValidUrl) {
		return (
			<main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
				<div className="w-full max-w-md">
					<div className="space-y-4 rounded-lg bg-white p-8 text-center shadow-lg">
						<div className="flex justify-center">
							<AlertCircle className="h-16 w-16 text-red-500" />
						</div>
						<h1 className="text-2xl font-bold text-slate-900">Invalid URL</h1>
						<p className="leading-relaxed text-slate-600">
							This tenant application link is missing required parameters.
							Please ensure you have a valid invitation link with the correct
							URL parameters.
						</p>
						<div className="pt-4">
							<Link
								to="/login"
								className="inline-block rounded-lg bg-rose-600 px-6 py-2 font-medium text-white transition-colors hover:bg-rose-700"
							>
								Back to Home
							</Link>
						</div>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="w-full">
			<div className="border-b p-4 md:px-0 md:py-6">
				<Link to="/login">
					<TypographyH3 className="text-center capitalize">
						Welcome to{' '}
						<span className="font-extrabold text-rose-700">
							{APP_NAME.slice(0, 4)}{' '}
						</span>
						<span className="font-extrabold">{APP_NAME.slice(4)}</span>
					</TypographyH3>
				</Link>
				<TypographyMuted className="text-center">
					Once you've completed all steps, we'll review your application and
					reach out with the next steps.
				</TypographyMuted>
			</div>
			<div
				className="bg-rose-600"
				style={{ height: '3px', width: `${(stepCount / STEP) * 100}%` }}
			/>
			<div className="flex min-h-[88vh] items-center justify-center">
				<div className="w-full max-w-4xl px-4 md:px-0">
					{stepCount === 0 ? <Step0 /> : null}
					{stepCount === 1 ? <Step1 /> : null}
					{stepCount === 2 ? <Step2 /> : null}
					{stepCount === 3 ? <Step3 /> : null}
					{stepCount === 4 ? <Step4 /> : null}
					{stepCount === 5 ? <Step5 /> : null}
					{stepCount === 6 ? <Step6 /> : null}
				</div>
			</div>
		</main>
	)
}

export function TenantApplyModule({
	loaderData,
}: {
	loaderData: {
		isValidUrl: boolean
		origin: string
		referredBy: string | null
		unitId: string | null
	}
}) {
	return (
		<CreateNewPropertyTenantApplicationProvider>
			<TenantApply isValidUrl={loaderData.isValidUrl} />
		</CreateNewPropertyTenantApplicationProvider>
	)
}
