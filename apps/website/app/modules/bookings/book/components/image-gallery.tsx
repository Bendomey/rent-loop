interface Props {
	images: string[]
	altPrefix: string
}

export function ImageGallery({ images, altPrefix }: Props) {
	if (images.length === 0) return null

	const hero = images[0]
	const thumbnails = images.slice(1, 5)
	const overflow = images.length - 5

	if (thumbnails.length === 0) {
		return (
			<div className="h-72 overflow-hidden rounded-xl lg:h-80">
				<img src={hero} alt={altPrefix} className="h-full w-full object-cover" />
			</div>
		)
	}

	return (
		<div className="flex h-72 gap-0.5 overflow-hidden rounded-xl lg:h-80">
			<div className="flex-[2] overflow-hidden">
				<img
					src={hero}
					alt={`${altPrefix} 1`}
					className="h-full w-full object-cover"
				/>
			</div>
			<div className="flex flex-1 flex-col gap-0.5">
				{thumbnails.map((src, i) => {
					const isLast = i === thumbnails.length - 1
					const showOverflow = isLast && overflow > 0
					return (
						<div key={i} className="relative flex-1 overflow-hidden">
							<img
								src={src}
								alt={`${altPrefix} ${i + 2}`}
								className="h-full w-full object-cover"
							/>
							{showOverflow && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/40">
									<span className="text-sm font-semibold text-white">
										+{overflow} photos
									</span>
								</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}
