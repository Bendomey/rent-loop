import { NewPMProvider, useNewPMContext } from './context'
import { Step0 } from './step0'
import { Step1 } from './step1'
import { Step2 } from './step2'
import { Step3 } from './step3'

const STEPS = 4

function NewPropertyManager() {
	const { stepCount } = useNewPMContext()

	return (
		<main className="w-full">
			<div
				className="bg-rose-600 transition-all duration-300"
				style={{ height: '3px', width: `${(stepCount / STEPS) * 100}%` }}
			/>

			<div className="mx-4 mt-10 max-w-3xl md:mx-auto md:mt-14">
				{stepCount === 0 ? <Step0 /> : null}
				{stepCount === 1 ? <Step1 /> : null}
				{stepCount === 2 ? <Step2 /> : null}
				{stepCount === 3 ? <Step3 /> : null}
			</div>
		</main>
	)
}

export function NewPropertyManagerModule() {
	return (
		<NewPMProvider>
			<NewPropertyManager />
		</NewPMProvider>
	)
}
