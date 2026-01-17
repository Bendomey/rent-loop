import { CheckCircle, Shield } from 'lucide-react'
import Confetti from 'react-confetti'
import { APP_NAME } from '~/lib/constants'

export function TenantApplySuccessModule() {
	return (
		<>
			<Confetti className="h-full w-full" numberOfPieces={50} />
			<div className="flex h-lvh flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
				<div className="mx-auto w-full max-w-md space-y-6 text-center">
					{/* Success Icon */}
					<div className="flex justify-center">
						<CheckCircle className="h-20 w-20 animate-bounce text-green-500" />
					</div>

					{/* Heading */}
					<div className="space-y-3">
						<h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
							Application Submitted!
						</h1>
						<p className="text-lg text-slate-600">
							Welcome to{' '}
							<span className="text-center capitalize">
								<span className="font-extrabold text-rose-700">
									{APP_NAME.slice(0, 4)}{' '}
								</span>
								<span className="font-extrabold">{APP_NAME.slice(4)}</span>
							</span>{' '}
							community! We're excited to have you on board.
						</p>
					</div>

					{/* Message */}
					<div className="rounded-lg border border-green-200 bg-white p-5">
						<p className="font-semibold text-slate-700">
							Application Confirmed
						</p>
						<p className="mt-2 text-sm text-slate-600">
							Your application details have been securely submitted
						</p>
					</div>

					{/* Next Steps */}
					<div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
						<h3 className="mb-2 font-semibold text-slate-900">What's Next?</h3>
						<ul className="space-y-2 text-left text-sm text-slate-600">
							<li className="flex items-start">
								<span className="mr-2 font-bold text-blue-600">1.</span>
								<span>Verification of submitted documents</span>
							</li>
							<li className="flex items-start">
								<span className="mr-2 font-bold text-blue-600">2.</span>
								<span>Background check review</span>
							</li>
							<li className="flex items-start">
								<span className="mr-2 font-bold text-blue-600">3.</span>
								<span>Final approval notification</span>
							</li>
						</ul>
					</div>

					{/* Security Note */}
					<div className="flex space-x-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
						<Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
						<p className="text-sm text-amber-800">
							Your information is encrypted and secure.
						</p>
					</div>

				</div>
			</div>
		</>
	)
}
