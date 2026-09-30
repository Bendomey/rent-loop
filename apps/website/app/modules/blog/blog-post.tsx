import { Suspense, lazy, useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { formatPostDate } from './index'
import { Container, MarketingPage } from '~/components/marketing'
import { getBlogPostBySlug } from '~/content/blog'

function ScrollToHash() {
	useEffect(() => {
		const { hash } = window.location
		if (!hash) return
		const el = document.querySelector(hash)
		if (el) el.scrollIntoView({ behavior: 'smooth' })
	}, [])
	return null
}

export function BlogPostModule() {
	const { slug } = useParams<{ slug: string }>()
	const post = getBlogPostBySlug(slug ?? '')

	if (!post) return null

	const PostContent = lazy(post.component)

	if (post.layout === 'custom') {
		return (
			<Suspense fallback={null}>
				<PostContent />
			</Suspense>
		)
	}

	return (
		<MarketingPage current="blog">
			<Container className="py-20 sm:py-32">
				<article className="mx-auto max-w-3xl">
					<Link to="/blog" className="text-sm font-semibold text-gray-900">
						<span aria-hidden="true">←</span> All posts
					</Link>
					<header className="mt-8 border-b border-gray-200 pb-10">
						<h1 className="text-4xl font-medium tracking-tight text-gray-900">
							{post.meta.title}
						</h1>
						<div className="mt-4 flex items-center gap-x-3 text-sm text-gray-500">
							<time dateTime={post.meta.date}>
								{formatPostDate(post.meta.date)}
							</time>
							<span aria-hidden="true">·</span>
							<span>{post.meta.author}</span>
						</div>
						<p className="mt-6 text-lg text-gray-600">
							{post.meta.description}
						</p>
					</header>

					<Suspense
						fallback={
							<div className="mt-10 animate-pulse space-y-4">
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={i} className="h-4 rounded bg-gray-100" />
								))}
							</div>
						}
					>
						<div className="prose prose-gray prose-headings:font-semibold prose-headings:tracking-tight prose-h2:font-medium prose-a:text-brand-500 prose-a:no-underline hover:prose-a:underline mt-10 max-w-none">
							<PostContent />
							<ScrollToHash />
						</div>
					</Suspense>
				</article>
			</Container>
		</MarketingPage>
	)
}
