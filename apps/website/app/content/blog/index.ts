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
			author: 'Rentloop Team',
			slug: 'what-is-rentloop',
		},
		component: () => import('./what-is-rentloop.mdx'),
	},
]

export const getBlogPostBySlug = (slug: string) =>
	blogPosts.find((p) => p.meta.slug === slug)

export const getSortedBlogPosts = () =>
	[...blogPosts].sort(
		(a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime(),
	)
