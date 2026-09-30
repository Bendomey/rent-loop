import clsx from 'clsx'
import { MarketingFooter } from './footer'
import { MarketingHeader } from './header'
import { CircleBackground, Container, SectionIntro } from './primitives'

export function MarketingPage({
	current,
	children,
}: {
	current?: string
	children: React.ReactNode
}) {
	return (
		<>
			<MarketingHeader current={current} />
			<main className="flex-auto">{children}</main>
			<MarketingFooter />
		</>
	)
}

export function CallToAction({
	id,
	title,
	description,
	actions,
}: {
	id?: string
	title: React.ReactNode
	description: React.ReactNode
	actions: React.ReactNode
}) {
	return (
		<section
			id={id}
			className="relative overflow-hidden bg-gray-900 py-20 sm:py-28"
		>
			<div className="absolute top-1/2 left-20 -translate-y-1/2 sm:left-1/2 sm:-translate-x-1/2">
				<CircleBackground color="#fff" className="animate-spin-slower" />
			</div>
			<Container className="relative">
				<div className="mx-auto max-w-md sm:text-center">
					<h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
						{title}
					</h2>
					<p className="mt-4 text-lg text-gray-300">{description}</p>
					<div className="mt-8 flex flex-wrap gap-4 sm:justify-center">
						{actions}
					</div>
				</div>
			</Container>
		</section>
	)
}

export interface Faq {
	question: string
	answer: React.ReactNode
}

export function Faqs({
	faqs,
	title = 'Frequently asked questions',
	description,
	className,
}: {
	faqs: Array<Faq>
	title?: React.ReactNode
	description?: React.ReactNode
	className?: string
}) {
	const columns: Array<Array<Faq>> = [[], [], []]
	faqs.forEach((faq, index) => columns[index % 3]!.push(faq))

	return (
		<section
			id="faqs"
			aria-labelledby="faqs-title"
			className={clsx('border-t border-gray-200 py-20 sm:py-32', className)}
		>
			<Container>
				<SectionIntro id="faqs-title" title={title} description={description} />
				<ul
					role="list"
					className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-3"
				>
					{columns.map((column, columnIndex) => (
						<li key={columnIndex}>
							<ul role="list" className="space-y-10">
								{column.map((faq) => (
									<li key={faq.question}>
										<h3 className="text-lg/6 font-semibold text-gray-900">
											{faq.question}
										</h3>
										<p className="mt-4 text-sm text-gray-700">{faq.answer}</p>
									</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			</Container>
		</section>
	)
}

export function FeatureCard({
	icon,
	name,
	description,
}: {
	icon: React.ReactNode
	name: React.ReactNode
	description: React.ReactNode
}) {
	return (
		<li className="rounded-2xl border border-gray-200 p-8">
			{icon}
			<h3 className="mt-6 font-semibold text-gray-900">{name}</h3>
			<p className="mt-2 text-gray-700">{description}</p>
		</li>
	)
}

export function FeatureGrid({ children }: { children: React.ReactNode }) {
	return (
		<ul
			role="list"
			className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 text-sm sm:mt-20 sm:grid-cols-2 md:gap-y-10 lg:max-w-none lg:grid-cols-3"
		>
			{children}
		</ul>
	)
}

export function Screenshot({
	src,
	alt,
	className,
}: {
	src: string
	alt: string
	className?: string
}) {
	return (
		<div
			className={clsx(
				'overflow-hidden rounded-2xl bg-white shadow-xl ring-1 shadow-gray-900/5 ring-gray-900/10',
				className,
			)}
		>
			<img src={src} alt={alt} className="w-full" />
		</div>
	)
}
