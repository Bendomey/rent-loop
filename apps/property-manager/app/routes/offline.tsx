export default function OfflinePage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
			<h1 className="text-2xl font-semibold">You're offline</h1>
			<p className="text-muted-foreground text-sm">
				Check your connection and try again.
			</p>
			<a href="/" className="text-primary text-sm underline">
				Go back home
			</a>
		</div>
	)
}
