import dayjs from 'dayjs'
import { CircleCheck, FileText, Loader } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useLoaderData, useRevalidator } from 'react-router'
import { useAcceptAgreement, useGetAgreements } from '~/api/agreements'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { useAuth } from '~/providers/auth-provider'
import type { loader } from '~/routes/_auth._dashboard.settings.agreements'

function AgreementCard({ agreement }: { agreement: Agreement }) {
	const { currentUser } = useAuth()
	const { mutate: acceptAgreement, isPending } = useAcceptAgreement()
	const revalidator = useRevalidator()
	const isOwner = currentUser?.role === 'OWNER'

	const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
	const scrollRef = useRef<HTMLDivElement>(null)

	const handleScroll = useCallback(() => {
		const el = scrollRef.current
		if (!el) return
		const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 4
		if (atBottom) setHasScrolledToBottom(true)
	}, [])

	return (
		<Card className="shadow-none">
			<CardHeader>
				<div className="flex items-center gap-3">
					<FileText className="text-muted-foreground mt-0.5 size-5 shrink-0" />
					<div>
						<div className="flex items-center gap-2">
							<span className="font-semibold">{agreement.name}</span>
							<Badge
								variant="outline"
								className="text-muted-foreground text-xs"
							>
								{agreement.version}
							</Badge>
						</div>
						<TypographyMuted className="text-xs">
							Effective {dayjs(agreement.effective_date).format('MMMM D, YYYY')}
						</TypographyMuted>
					</div>
				</div>
			</CardHeader>
			<Separator />
			<CardContent className="pt-4">
				<div
					ref={scrollRef}
					onScroll={handleScroll}
					className="prose prose-sm dark:prose-invert bg-muted/50 max-h-96 max-w-none overflow-y-auto rounded-md border p-5 dark:bg-black"
				>
					<ReactMarkdown>{agreement.content}</ReactMarkdown>
				</div>
			</CardContent>
			{agreement.user_has_accepted ? (
				<CardFooter className="pt-0">
					<Badge className="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
						<CircleCheck className="size-3.5" />
						Accepted
					</Badge>
				</CardFooter>
			) : isOwner ? (
				<CardFooter className="flex flex-col items-start gap-1.5 pt-0">
					{!hasScrolledToBottom && (
						<TypographyMuted className="text-xs">
							Scroll to the bottom of the agreement to accept.
						</TypographyMuted>
					)}
					<Button
						size="sm"
						onClick={() => {
							acceptAgreement(agreement.id, {
								onSuccess: () => {
									void revalidator.revalidate()
								},
							})
						}}
						disabled={isPending || !hasScrolledToBottom}
					>
						{isPending ? <Loader className="size-4 animate-spin" /> : null}I
						Agree
					</Button>
				</CardFooter>
			) : null}
		</Card>
	)
}

export function AgreementsModule() {
	const loaderData = useLoaderData<typeof loader>()
	const { data: agreements } = useGetAgreements()

	const displayAgreements = agreements ?? loaderData.agreements

	return (
		<main className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
			<div>
				<TypographyH4>Legal Agreements</TypographyH4>
				<TypographyMuted>
					Review and accept the agreements required to use RentLoop. When new
					versions are published, you will need to accept them again.
				</TypographyMuted>
			</div>
			{displayAgreements.length === 0 ? (
				<Card className="shadow-none">
					<CardContent className="py-8 text-center">
						<TypographyMuted>
							No agreements to review at this time.
						</TypographyMuted>
					</CardContent>
				</Card>
			) : (
				<div className="flex flex-col gap-4">
					{displayAgreements.map((agreement) => (
						<AgreementCard key={agreement.id} agreement={agreement} />
					))}
				</div>
			)}
		</main>
	)
}
