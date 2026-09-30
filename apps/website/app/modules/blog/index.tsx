import { Link } from 'react-router'
import { Container, MarketingPage } from '~/components/marketing'
import { getSortedBlogPosts } from '~/content/blog'

export function formatPostDate(date: string) {
	return new Date(date).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})
}

export function BlogIndexModule() {
	const posts = getSortedBlogPosts()

	return (
		<MarketingPage current="blog">
			<Container className="py-20 sm:py-32">
				<div className="max-w-2xl">
					<h1 className="text-4xl font-medium tracking-tight text-gray-900">
						Guides, tips, and updates
					</h1>
					<p className="mt-4 text-lg text-gray-600">
						Learn how to get the most out of Rentloop and manage your properties
						smarter.
					</p>
				</div>

				<div className="mt-16 grid grid-cols-1 gap-8 sm:mt-20 md:grid-cols-2 lg:grid-cols-3">
					{posts.map((post) => (
						<Link
							key={post.meta.slug}
							to={`/blog/${post.meta.slug}`}
							className="group flex flex-col rounded-2xl border border-gray-200 p-6 transition-colors hover:border-gray-300"
						>
							{post.meta.coverImage && (
								<img
									src={post.meta.coverImage}
									alt=""
									loading="lazy"
									className="mb-6 aspect-[1200/630] w-full rounded-lg object-cover"
								/>
							)}
							<time dateTime={post.meta.date} className="text-sm text-gray-500">
								{formatPostDate(post.meta.date)}
							</time>
							<h2 className="group-hover:text-brand-500 mt-2 text-lg/6 font-semibold text-gray-900">
								{post.meta.title}
							</h2>
							<p className="mt-2 line-clamp-3 flex-1 text-sm text-gray-700">
								{post.meta.description}
							</p>
							<p className="mt-4 text-sm text-gray-500">{post.meta.author}</p>
						</Link>
					))}
				</div>
			</Container>
		</MarketingPage>
	)
}
