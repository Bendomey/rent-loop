import { Link } from 'react-router'
import {
	CreateNewPropertyTenantApplicationProvider,
	useTenantApplicationContext,
} from './context'
import { Step0 } from './steps/step0'
import { Step1 } from './steps/step1'
import { Step2 } from './steps/step2'
import { Step3 } from './steps/step3'
import { TypographyH3, TypographyMuted } from '~/components/ui/typography'
import { APP_NAME } from '~/lib/constants'

const STEP = 4

export function TenantApply() {
	const { stepCount } = useTenantApplicationContext()

	return (
		<main className="w-full">
				<div className="border-b py-4 md:py-6">
				<Link to="/login">
					<TypographyH3 className="text-center capitalize">
						Welcome to{' '}
						<span className="font-extrabold text-rose-700">
							{APP_NAME.slice(0, 4)}{' '}
						</span>
						<span className="font-extrabold">{APP_NAME.slice(4)}</span>
					</TypographyH3>
				</Link>
				<TypographyMuted className='text-center'>Once you've completed all steps, you will be registered as a tenant.</TypographyMuted>
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
					</div>
				</div>
		</main>
	)
}

export function TenantApplyModule() {
	return (
		<CreateNewPropertyTenantApplicationProvider>
			<TenantApply />
		</CreateNewPropertyTenantApplicationProvider>
	)
}
