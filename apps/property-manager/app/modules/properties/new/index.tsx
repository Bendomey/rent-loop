import { useState } from 'react'
import { Step0 } from './steps/step0'
import { Step1 } from './steps/step1'
import { Step2 } from './steps/step2'
import { Step3 } from './steps/step3'

const STEP = 3

const Steps = [Step0, Step1, Step2, Step3]

export function NewPropertyModule() {
	const [stepCount, setStepCount] = useState(0)
	const CurrentStep = Steps[stepCount]

	const goBack = () => setStepCount((prev) => (prev > 0 ? prev - 1 : prev))
	const goNext = () => setStepCount((prev) => prev + 1)

	return (
		<main className="w-full">
			<div className="-mx-2 -my-5 md:-mx-7">
				<div
					className="bg-rose-600"
					style={{ height: '3px', width: `${(stepCount / STEP) * 100}%` }}
				/>
				<div className="flex min-h-[88vh] items-center justify-center">
					<div className="w-full max-w-3xl px-4 md:px-0">
						{CurrentStep && <CurrentStep onGoBack={goBack} onGoNext={goNext} />}
					</div>
				</div>
			</div>
		</main>
	)
}
