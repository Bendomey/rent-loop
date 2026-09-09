import { ArrowRight, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { RELEASES } from './releases'
import { highlightIcons } from './index'
import bgImage from '~/assets/bg-changelog.jpg'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from '~/components/ui/dialog'

const SEEN_KEY = 'rl-changelog-whats-new-seen'

const headline = RELEASES.find((release) => release.headline)

export function WhatsNewModal() {
	const [open, setOpen] = useState(false)

	useEffect(() => {
		if (headline && localStorage.getItem(SEEN_KEY) !== headline.id) setOpen(true)
	}, [])

	if (!headline) return null

	const dismiss = () => {
		localStorage.setItem(SEEN_KEY, headline.id)
		setOpen(false)
	}

	return (
		<Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
			<DialogContent
				showCloseButton={false}
				className="gap-0 overflow-hidden p-0 sm:max-w-[560px]"
			>
				<div
					className="relative h-40 bg-cover bg-center"
					style={{ backgroundImage: `url(${bgImage})` }}
				>
					<div className="to-background absolute inset-0 bg-linear-to-b from-transparent" />
					<DialogClose className="bg-background/80 text-foreground hover:bg-background absolute top-3 right-3 flex size-8 items-center justify-center rounded-full backdrop-blur transition-colors">
						<XIcon className="size-4" />
						<span className="sr-only">Close</span>
					</DialogClose>
				</div>

				<div className="px-6 pb-6">
					<p className="text-xs font-semibold tracking-widest text-rose-600 uppercase dark:text-rose-400">
						New in Rentloop
					</p>
					<DialogTitle className="text-foreground mt-3 text-2xl font-semibold tracking-tight text-pretty">
						{headline.title}
					</DialogTitle>
					{headline.summary && (
						<DialogDescription className="text-muted-foreground mt-3 text-[15px] leading-relaxed text-pretty">
							{headline.summary}
						</DialogDescription>
					)}

					{headline.highlights && (
						<div className="mt-5 flex flex-col gap-4">
							{headline.highlights.map((highlight) => {
								const Glyph = highlightIcons[highlight.icon]
								return (
									<div key={highlight.title} className="flex gap-3.5">
										<div className="bg-muted text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
											<Glyph className="size-[18px]" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="text-foreground text-[15px] font-semibold">
												{highlight.title}
											</p>
											<p className="text-muted-foreground mt-1 text-sm leading-relaxed text-pretty">
												{highlight.body}
											</p>
										</div>
									</div>
								)
							})}
						</div>
					)}

					{headline.where && (
						<div className="bg-muted text-muted-foreground mt-5 rounded-lg px-4 py-3 text-sm leading-relaxed">
							Where to find it:{' '}
							<span className="text-foreground font-medium">
								{headline.where}
							</span>
						</div>
					)}

					<div className="mt-6 flex flex-wrap items-center gap-3">
						<span className="text-muted-foreground min-w-[13rem] flex-1 text-sm leading-snug">
							You will only see this once. It stays under Changelog.
						</span>
						<Button variant="outline" size="sm" onClick={dismiss}>
							Not now
						</Button>
						<Button size="sm" asChild>
							<Link to="/changelog" onClick={dismiss}>
								{headline.cta ?? 'See what changed'}
								<ArrowRight />
							</Link>
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
