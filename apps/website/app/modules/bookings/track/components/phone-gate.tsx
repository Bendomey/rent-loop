import { useState } from 'react'
import { APP_NAME } from '~/lib/constants'

interface Props {
	onVerify: (phone: string) => void
	error: string | null
	loading: boolean
}

export function PhoneGate({ onVerify, error, loading }: Props) {
	const [phone, setPhone] = useState('')

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (phone.trim().length >= 7) {
			onVerify(phone.trim())
		}
	}

	return (
		<div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
			<div className="w-full max-w-sm">
				<div className="mb-6 text-center">
					<span className="text-3xl font-extrabold text-rose-700">
						{APP_NAME.slice(0, 4)}
					</span>
					<span className="text-3xl font-extrabold">{APP_NAME.slice(4)}</span>
					<p className="mt-2 text-sm text-zinc-500">Booking Tracker</p>
				</div>

				<div className="rounded-xl border bg-white p-6 shadow-sm">
					<h1 className="text-base font-semibold text-zinc-900">
						Find your booking
					</h1>
					<p className="mt-1 text-sm text-zinc-500">
						Enter the phone number you used when making the booking.
					</p>

					<form onSubmit={handleSubmit} className="mt-5 space-y-4">
						<div>
							<label className="mb-1 block text-sm font-medium text-zinc-700">
								Phone number
							</label>
							<input
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+233 XX XXX XXXX"
								className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
							/>
						</div>

						{error ? (
							<p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
								{error}
							</p>
						) : null}

						<button
							type="submit"
							disabled={phone.trim().length < 7 || loading}
							className="w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading ? 'Finding...' : 'Find my booking'}
						</button>
					</form>
				</div>
			</div>
		</div>
	)
}
