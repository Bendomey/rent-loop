import { Link } from 'react-router'

interface Props {
	trackingCode: string
	onClose: () => void
}

const CONFETTI: Array<{
	color: string
	tx: string
	ty: string
	delay: string
}> = [
	{ color: '#e11d48', tx: '-60px', ty: '-80px', delay: '0ms' },
	{ color: '#f59e0b', tx: '60px', ty: '-80px', delay: '50ms' },
	{ color: '#22c55e', tx: '-80px', ty: '-40px', delay: '100ms' },
	{ color: '#0ea5e9', tx: '80px', ty: '-40px', delay: '150ms' },
	{ color: '#a855f7', tx: '-40px', ty: '-90px', delay: '200ms' },
	{ color: '#e11d48', tx: '40px', ty: '-90px', delay: '250ms' },
	{ color: '#f59e0b', tx: '-70px', ty: '-60px', delay: '80ms' },
	{ color: '#22c55e', tx: '70px', ty: '-60px', delay: '130ms' },
]

export function SuccessModal({ trackingCode, onClose }: Props) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="relative mx-4 w-full max-w-sm animate-[modal-in_200ms_ease-out_forwards] rounded-2xl bg-white p-8 shadow-xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Confetti burst */}
				<div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
					{CONFETTI.map((c, i) => (
						<span
							key={i}
							className="absolute top-1/2 left-1/2 h-2 w-2 animate-[confetti-burst_600ms_ease-out_forwards] rounded-full"
							style={
								{
									backgroundColor: c.color,
									'--tx': c.tx,
									'--ty': c.ty,
									animationDelay: c.delay,
								} as React.CSSProperties
							}
						/>
					))}
				</div>

				{/* Content */}
				<div className="text-center">
					<div className="text-4xl">🎉</div>
					<h2 className="mt-3 text-xl font-bold text-zinc-900">
						You're booked!
					</h2>
					<p className="mt-2 text-sm text-zinc-500">
						The property manager will review your request and confirm shortly.
					</p>

					<div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left">
						<p className="text-xs tracking-wider text-zinc-400 uppercase">
							Tracking code
						</p>
						<p className="mt-0.5 font-mono text-lg font-bold text-zinc-900">
							{trackingCode}
						</p>
					</div>

					<Link
						to={`/bookings/track/${trackingCode}`}
						className="mt-4 block w-full rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
					>
						Track booking status →
					</Link>

					<button
						onClick={onClose}
						className="mt-3 block w-full text-sm text-zinc-400 underline"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	)
}
