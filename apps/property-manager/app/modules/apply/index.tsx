import { Link } from 'react-router'
import { ApplyProvider, useApplyContext } from './context'
import { Step0 } from './step0'
import { Step1 } from './step1'
import { Step2 } from './step2'
import { Step3 } from './step3'
import { TypographyH3 } from '~/components/ui/typography'
import { APP_NAME } from '~/lib/constants'

const Steps = [Step0, Step1, Step2, Step3]
const STEPS = Steps.length

function Apply() {
	const { stepCount } = useApplyContext()

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
			</div>
			<div
				className="bg-rose-600"
				style={{ height: '3px', width: `${(stepCount / STEPS) * 100}%` }}
			/>

			<div className="mx-4 mt-10 max-w-3xl md:mx-auto md:mt-14">
				{Steps[stepCount]?.()}
			</div>
		</main>
	)
}

export function ApplyModule() {
	return (
		<ApplyProvider>
			<Apply />
		</ApplyProvider>
	)
}
