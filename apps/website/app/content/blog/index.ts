import type { ComponentType } from 'react'

export interface BlogPostMeta {
	title: string
	description: string
	date: string
	author: string
	slug: string
	coverImage?: string
	keywords?: string[]
}

export interface BlogPostEntry {
	meta: BlogPostMeta
	component: () => Promise<{ default: ComponentType }>
	// 'custom' posts render their own full-page layout (chrome included);
	// 'prose' (default) posts render inside the shared article shell.
	layout?: 'prose' | 'custom'
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
			coverImage: '/images/blog/what-is-rentloop-og.png',
		},
		layout: 'custom',
		component: () => import('./what-is-rentloop.tsx'),
	},
	{
		meta: {
			title: 'Understanding Asset Management in Rentloop',
			description:
				'Learn how Rentloop organises your rental portfolio with properties, blocks, and units — and how your plan is set by your total unit count.',
			date: '2026-03-22',
			author: 'Marketing Team',
			slug: 'understanding-asset-management',
			coverImage: '/images/blog/understanding-asset-management-og.png',
			keywords: [
				'rental property asset management',
				'property management software in Ghana',
				'how to organise a rental portfolio',
				'properties blocks and units',
				'multi-unit property management',
				'rental portfolio management software',
				'apartment complex management software',
				'hostel management software Ghana',
				'unit-based pricing property management',
				'property management for landlords',
			],
		},
		layout: 'custom',
		component: () => import('./understanding-asset-management.tsx'),
	},
	{
		meta: {
			title:
				'10 Things to Look for in the Best Property Management App in Ghana',
			description:
				'Discover 10 essential features to look for in the best property management app in Ghana, from rent collection and tenant management to maintenance, reporting and digital agreements.',
			date: '2026-09-15',
			author: 'Marketing Team',
			slug: 'best-property-management-app-in-ghana',
			coverImage: '/images/blog/best-property-management-app-in-ghana-og.png',
			keywords: [
				'best property management app in Ghana',
				'property management software in Ghana',
				'property management system Ghana',
				'rental property management software',
				'rent collection app Ghana',
				'tenant management software',
				'property management app',
				'rental management system Ghana',
			],
		},
		layout: 'custom',
		component: () => import('./best-property-management-app-in-ghana.tsx'),
	},
]

export const getBlogPostBySlug = (slug: string) =>
	blogPosts.find((p) => p.meta.slug === slug)

export const getSortedBlogPosts = () =>
	[...blogPosts].sort(
		(a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime(),
	)
