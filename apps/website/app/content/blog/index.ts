import type { ComponentType } from 'react'

export interface BlogPostMeta {
	title: string
	description: string
	date: string
	author: string
	slug: string
	coverImage?: string
}

export interface BlogPostEntry {
	meta: BlogPostMeta
	component: () => Promise<{ default: ComponentType }>
}

export const blogPosts: BlogPostEntry[] = [
	{
		meta: {
			title: 'What is Rentloop?',
			description:
				'A detailed introduction to Rentloop — the smart property management platform built for the Ghana rental market.',
			date: '2026-03-22',
			author: 'Marketing Team',
			slug: 'what-is-rentloop',
		},
		component: () => import('./what-is-rentloop.mdx'),
	},
	{
		meta: {
			title: 'Understanding Asset Management in Rentloop',
			description:
				'Learn how Rentloop organises your rental portfolio with properties, blocks, and units — and how billing scales with your unit count.',
			date: '2026-03-22',
			author: 'Marketing Team',
			slug: 'understanding-asset-management',
		},
		component: () => import('./understanding-asset-management.mdx'),
	},
]

export const getBlogPostBySlug = (slug: string) =>
	blogPosts.find((p) => p.meta.slug === slug)

export const getSortedBlogPosts = () =>
	[...blogPosts].sort(
		(a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime(),
	)
