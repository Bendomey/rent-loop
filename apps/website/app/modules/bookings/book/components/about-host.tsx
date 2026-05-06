import { ShieldCheck } from 'lucide-react'

interface Props {
	property: { name: string; contact_email: string | null } | null
}

function Avatar({ name }: { name: string }) {
	const initials = name
		.split(' ')
		.slice(0, 2)
		.map((n) => n[0])
		.join('')
		.toUpperCase()
	return (
		<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xl font-bold text-rose-700">
			{initials}
		</div>
	)
}

export function AboutHost({ property }: Props) {
	const hostName = property?.name ?? 'Your Host'

	return (
		<div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
			<div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
				<Avatar name={hostName} />
				<div>
					<p className="text-base font-semibold text-zinc-900">{hostName}</p>
					<p className="text-xs text-zinc-400">Host since 2022</p>
				</div>
			</div>

			<div className="flex-1 space-y-4">
				<div className="flex flex-wrap gap-4 text-sm text-zinc-600">
					<span>
						<span className="font-semibold text-zinc-900">98%</span> response
						rate
					</span>
					<span>
						Responds within{' '}
						<span className="font-semibold text-zinc-900">1 hour</span>
					</span>
				</div>

				<p className="text-sm leading-relaxed text-zinc-600">
					We manage properties across Accra and its surrounding areas, providing
					comfortable and well-maintained spaces for short and long-term stays.
					Our team is available 24/7 to ensure a smooth experience from booking
					to check-out.
				</p>

				<div className="flex items-center gap-1.5 text-xs text-zinc-500">
					<ShieldCheck className="h-4 w-4 text-rose-500" />
					Identity verified
				</div>

				{property?.contact_email && (
					<a
						href={`mailto:${property.contact_email}`}
						className="inline-block rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
					>
						Contact host
					</a>
				)}
			</div>
		</div>
	)
}
