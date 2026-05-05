import {
	CreateNewPropertyTenantApplicationProvider,
	useCreatePropertyTenantApplicationContext,
} from './context'
import { Step0 } from './steps/step0'
import { Step1 } from './steps/step1'
import { Step2 } from './steps/step2'
import { Step3 } from './steps/step3'
import { Step4 } from './steps/step4'

const STEP = 5

export function NewPropertyTenantApplication() {
	const { stepCount } = useCreatePropertyTenantApplicationContext()

	return (
		<main className="w-full">
			<div className="-mx-2 w-full md:-mx-7">
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
					</div>
				</div>
			</div>
		</main>
	)
}

export function NewPropertyTenantApplicationModule() {
	return (
		<CreateNewPropertyTenantApplicationProvider>
			<NewPropertyTenantApplication />
		</CreateNewPropertyTenantApplicationProvider>
	)
}
