import {
	ArrowRight,
	CalendarDays,
	Check,
	Clock,
	FileText,
	TriangleAlert,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CHANGELOG_SINCE, RELEASES, type ReleaseHighlight } from './releases'
import bgImge from '~/assets/bg-changelog.jpg'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { localizedDayjs } from '~/lib/date'

const LAST_SEEN_KEY = 'rl-changelog-last-seen'

const highlightIcons: Record<ReleaseHighlight['icon'], typeof FileText> = {
	doc: FileText,
	clock: Clock,
	calendar: CalendarDays,
	alert: TriangleAlert,
}

function relativeTime(dateStr: string) {
	const then = localizedDayjs(dateStr)
	const days = localizedDayjs().startOf('day').diff(then.startOf('day'), 'day')
	if (days <= 0) return 'today'
	if (days === 1) return 'yesterday'
	if (days < 30) return `${days} days ago`
	const months = Math.round(days / 30)
	return months === 1 ? 'a month ago' : `${months} months ago`
}

export function ChangelogModule() {
	const [lastSeen, setLastSeen] = useState<string | null>(null)

	useEffect(() => {
		setLastSeen(localStorage.getItem(LAST_SEEN_KEY))
		localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString())
	}, [])

	const freshIds = useMemo(() => {
		const seen = lastSeen ? localizedDayjs(lastSeen) : null
		return new Set(
			RELEASES.filter(
				(release) =>
					!release.minor &&
					(!seen || localizedDayjs(release.date).isAfter(seen)),
			).map((release) => release.id),
		)
	}, [lastSeen])

	const freshCount = freshIds.size

	const months = useMemo(() => {
		const groups: { key: string; releases: typeof RELEASES }[] = []
		for (const release of RELEASES) {
			const key = localizedDayjs(release.date).format('MMMM YYYY')
			const last = groups.at(-1)
			if (last && last.key === key) last.releases.push(release)
			else groups.push({ key, releases: [release] })
		}
		return groups
	}, [])

	return (
		<section className="bg-background">
			<div
				className="relative h-[28vh] bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: `url(${bgImge})` }}
			>
				<div className="from-background/10 via-background/60 to-background absolute inset-0 flex items-center justify-center bg-linear-to-b">
					<h1 className="text-foreground text-center text-3xl font-semibold tracking-tighter drop-shadow-sm sm:text-6xl">
						Changelog
					</h1>
				</div>
			</div>

			<div className="mx-auto max-w-3xl px-4 pt-12 pb-24">
				<p className="text-muted-foreground max-w-xl text-base leading-relaxed">
					Everything we have added to Rentloop, newest first.{' '}
					{freshCount > 0
						? `${freshCount === 1 ? 'One thing' : `${freshCount} things`} here you have not seen yet.`
						: 'You have seen all of it.'}{' '}
					Nothing here needs anything from you.
				</p>

				<div className="mt-12 flex flex-col gap-12">
					{months.map((month) => (
						<div key={month.key}>
							<h2 className="text-muted-foreground border-b pb-3 text-xs font-semibold tracking-widest uppercase">
								{month.key}
							</h2>
							<div className="mt-6 flex flex-col gap-5">
								{month.releases.map((release) => {
									const fresh = freshIds.has(release.id)
									return (
										<Card
											key={release.id}
											className="group shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-500/30 hover:shadow-md"
										>
											<CardContent>
												<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
													<span className="text-foreground text-sm font-semibold">
														{localizedDayjs(release.date).format('D MMMM YYYY')}
													</span>
													<span className="text-muted-foreground text-sm">
														{relativeTime(release.date)}
													</span>
													{fresh && (
														<Badge
															variant="outline"
															className="border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400"
														>
															New to you
														</Badge>
													)}
												</div>

												<h3 className="text-foreground mt-3 text-xl font-semibold tracking-tight text-pretty">
													{release.title}
												</h3>

												{release.summary && (
													<p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed text-pretty">
														{release.summary}
													</p>
												)}

												{release.highlights && (
													<div className="mt-5 flex flex-col gap-4">
														{release.highlights.map((highlight) => {
															const Glyph = highlightIcons[highlight.icon]
															return (
																<div
																	key={highlight.title}
																	className="flex gap-3.5"
																>
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

												{release.bullets && (
													<ul className="mt-4 flex flex-col gap-2.5">
														{release.bullets.map((bullet) => (
															<li
																key={bullet}
																className="text-muted-foreground flex gap-2.5 text-[15px] leading-relaxed"
															>
																<Check className="text-muted-foreground mt-0.5 size-4 shrink-0" />
																<span className="text-pretty">{bullet}</span>
															</li>
														))}
													</ul>
												)}

												{release.where && (
													<div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t pt-4">
														<span className="text-muted-foreground min-w-[15rem] flex-1 text-sm leading-snug">
															Where to find it:{' '}
															<span className="text-foreground font-medium">
																{release.where}
															</span>
														</span>
														{release.cta && (
															<Button variant="outline" size="sm">
																{release.cta}
																<ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
															</Button>
														)}
													</div>
												)}
											</CardContent>
										</Card>
									)
								})}
							</div>
						</div>
					))}
				</div>

				<p className="text-muted-foreground mt-12 text-sm">
					That is as far back as this goes. Rentloop started keeping this list
					in {CHANGELOG_SINCE}.
				</p>
			</div>
		</section>
	)
}
