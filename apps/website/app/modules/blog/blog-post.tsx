import { Suspense, lazy, useEffect } from 'react'
import { useParams } from 'react-router'
import { Footer } from '~/components/layout/footer'
import { Header } from '~/components/layout/header'
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

	return (
		<div>
			<Header />

			<div className="pt-24 pb-24">
				<div className="mx-auto max-w-3xl px-6 lg:px-8">
					{/* Post header */}
					<div className="mb-10">
						<p className="text-base/7 font-semibold text-rose-600">Blog</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
							{post.meta.title}
						</h1>
						<div className="mt-4 flex items-center gap-x-4 text-sm text-gray-500">
							<span>
								{new Date(post.meta.date).toLocaleDateString('en-GB', {
									day: 'numeric',
									month: 'long',
									year: 'numeric',
								})}
							</span>
							<span aria-hidden="true">·</span>
							<span>{post.meta.author}</span>
						</div>
						<p className="mt-4 text-lg text-gray-500">
							{post.meta.description}
						</p>
						<div className="mt-6 border-t border-gray-100" />
					</div>

					{/* MDX content */}
					<Suspense
						fallback={
							<div className="animate-pulse space-y-4">
								{Array.from({ length: 6 }).map((_, i) => (
									<div key={i} className="h-4 rounded bg-gray-100" />
								))}
							</div>
						}
					>
						<div className="prose prose-gray prose-headings:font-semibold prose-a:text-rose-600 prose-a:no-underline hover:prose-a:underline max-w-none">
							<PostContent />
							<ScrollToHash />
						</div>
					</Suspense>
				</div>
			</div>

			<Footer />
		</div>
	)
}
