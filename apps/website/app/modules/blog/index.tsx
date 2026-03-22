import { Link } from 'react-router'
import { getSortedBlogPosts } from '~/content/blog'
import { Footer } from '~/components/layout/footer'
import { Header } from '~/components/layout/header'

export function BlogIndexModule() {
	const posts = getSortedBlogPosts()

	return (
		<div>
			<Header />

			<div className="pt-24 pb-16">
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="mx-auto max-w-2xl text-center">
						<p className="text-base/7 font-semibold text-rose-600">Blog</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance text-gray-950 sm:text-5xl">
							Guides,{' '}
							<span className="font-[Shantell] text-rose-600 italic">tips</span>
							, and updates
						</h1>
						<p className="mt-6 text-lg font-light text-gray-500">
							Learn how to get the most out of Rentloop and manage your
							properties smarter.
						</p>
					</div>
				</div>
			</div>

			<div className="pb-24">
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
						{posts.map((post) => (
							<Link
								key={post.meta.slug}
								to={`/blog/${post.meta.slug}`}
								className="group flex flex-col rounded-2xl bg-white p-6 ring-1 ring-gray-200 transition-shadow hover:shadow-md hover:ring-rose-200"
							>
								<div className="flex-1">
									<p className="text-xs font-medium tracking-wide text-rose-600 uppercase">
										{new Date(post.meta.date).toLocaleDateString('en-GB', {
											day: 'numeric',
											month: 'long',
											year: 'numeric',
										})}
									</p>
									<h2 className="mt-3 text-lg font-semibold text-gray-900 transition-colors group-hover:text-rose-600">
										{post.meta.title}
									</h2>
									<p className="mt-2 line-clamp-3 text-sm text-gray-500">
										{post.meta.description}
									</p>
								</div>
								<div className="mt-4 flex items-center gap-x-2">
									<span className="text-xs text-gray-400">
										{post.meta.author}
									</span>
								</div>
							</Link>
						))}
					</div>
				</div>
			</div>

			<Footer />
		</div>
	)
}
