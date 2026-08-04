export function InfoRow({
	icon,
	label,
	value,
}: {
	icon?: React.ReactNode
	label: string
	value: React.ReactNode
}) {
	return (
		<div className="flex gap-3">
			{icon && (
				<div className="text-muted-foreground mt-1 flex-shrink-0">{icon}</div>
			)}
			<div className="min-w-0 flex-1">
				<p className="text-muted-foreground text-xs font-semibold">{label}</p>
				<p className="text-foreground text-sm font-medium">{value || 'N/A'}</p>
			</div>
		</div>
	)
}
