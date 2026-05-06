interface Props {
	propertyName: string
}

export function PropertyMap({ propertyName }: Props) {
	const query = encodeURIComponent(propertyName)

	return (
		<div>
			<div className="overflow-hidden rounded-xl border border-zinc-100">
				<iframe
					title={`Map of ${propertyName}`}
					src={`https://maps.google.com/maps?q=${query}&output=embed&z=15`}
					className="h-72 w-full border-0 lg:h-80"
					loading="lazy"
					referrerPolicy="no-referrer-when-downgrade"
				/>
			</div>
			<p className="mt-2 text-xs text-zinc-400">
				Exact address shared after booking confirmation.
			</p>
		</div>
	)
}
