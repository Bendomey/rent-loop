import clsx from 'clsx'
import { useId } from 'react'

export function Container({
	className,
	...props
}: React.ComponentPropsWithoutRef<'div'>) {
	return (
		<div
			className={clsx('mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}
			{...props}
		/>
	)
}

export function SectionIntro({
	title,
	description,
	align = 'left',
	dark = false,
	as: Heading = 'h2',
	id,
	className,
}: {
	title: React.ReactNode
	description?: React.ReactNode
	align?: 'left' | 'center'
	dark?: boolean
	as?: 'h1' | 'h2'
	id?: string
	className?: string
}) {
	return (
		<div
			className={clsx(
				'max-w-2xl',
				align === 'center' ? 'mx-auto sm:text-center' : 'lg:mx-0',
				className,
			)}
		>
			<Heading
				id={id}
				className={clsx(
					'text-3xl font-medium tracking-tight',
					dark ? 'text-white' : 'text-gray-900',
				)}
			>
				{title}
			</Heading>
			{description && (
				<p
					className={clsx(
						'mt-2 text-lg',
						dark ? 'text-gray-400' : 'text-gray-600',
					)}
				>
					{description}
				</p>
			)}
		</div>
	)
}

export function Logomark({ className }: { className?: string }) {
	return (
		<img
			src="/images/logomark.png"
			alt=""
			width={40}
			height={40}
			className={clsx('rounded-xl', className)}
		/>
	)
}

export function Logo({
	className,
	dark = false,
}: {
	className?: string
	dark?: boolean
}) {
	return (
		<span className={clsx('flex items-center gap-3', className)}>
			<Logomark className="h-10 w-10 flex-none" />
			<span
				className={clsx(
					'text-lg font-semibold tracking-tight',
					dark ? 'text-white' : 'text-gray-900',
				)}
			>
				Rentloop
			</span>
		</span>
	)
}

export function IconBadge({
	icon: Icon,
	dark = false,
}: {
	icon: React.ComponentType<{ className?: string }>
	dark?: boolean
}) {
	return (
		<span
			className={clsx(
				'flex h-8 w-8 items-center justify-center rounded-full',
				dark ? 'bg-white/10' : 'bg-gray-400/20',
			)}
		>
			<Icon
				className={clsx('h-5 w-5', dark ? 'text-white' : 'text-gray-900')}
			/>
		</span>
	)
}

export function CheckIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
			<path
				d="M9.307 12.248a.75.75 0 1 0-1.114 1.004l1.114-1.004ZM11 15.25l-.557.502a.75.75 0 0 0 1.15-.043L11 15.25Zm4.844-5.041a.75.75 0 0 0-1.188-.918l1.188.918Zm-7.651 3.043 2.25 2.5 1.114-1.004-2.25-2.5-1.114 1.004Zm3.4 2.457 4.25-5.5-1.187-.918-4.25 5.5 1.188.918Z"
				fill="currentColor"
			/>
			<circle
				cx="12"
				cy="12"
				r="8.25"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function CircleBackground({
	color,
	...props
}: React.ComponentPropsWithoutRef<'svg'> & { color: string }) {
	const id = useId()

	return (
		<svg
			viewBox="0 0 558 558"
			width="558"
			height="558"
			fill="none"
			aria-hidden="true"
			{...props}
		>
			<defs>
				<linearGradient
					id={id}
					x1="79"
					y1="16"
					x2="105"
					y2="237"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor={color} />
					<stop offset="1" stopColor={color} stopOpacity="0" />
				</linearGradient>
			</defs>
			<path
				opacity=".2"
				d="M1 279C1 125.465 125.465 1 279 1s278 124.465 278 278-124.465 278-278 278S1 432.535 1 279Z"
				stroke={color}
			/>
			<path
				d="M1 279C1 125.465 125.465 1 279 1"
				stroke={`url(#${id})`}
				strokeLinecap="round"
			/>
		</svg>
	)
}

export function BackgroundIllustration(
	props: React.ComponentPropsWithoutRef<'div'>,
) {
	const id = useId()

	return (
		<div {...props}>
			<svg
				viewBox="0 0 1026 1026"
				fill="none"
				aria-hidden="true"
				className="animate-spin-slow absolute inset-0 h-full w-full"
			>
				<path
					d="M1025 513c0 282.77-229.23 512-512 512S1 795.77 1 513 230.23 1 513 1s512 229.23 512 512Z"
					stroke="#D4D4D4"
					strokeOpacity="0.7"
				/>
				<path
					d="M513 1025C230.23 1025 1 795.77 1 513"
					stroke={`url(#${id}-gradient-1)`}
					strokeLinecap="round"
				/>
				<defs>
					<linearGradient
						id={`${id}-gradient-1`}
						x1="1"
						y1="513"
						x2="1"
						y2="1025"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#c8003a" />
						<stop offset="1" stopColor="#c8003a" stopOpacity="0" />
					</linearGradient>
				</defs>
			</svg>
			<svg
				viewBox="0 0 1026 1026"
				fill="none"
				aria-hidden="true"
				className="animate-spin-reverse-slower absolute inset-0 h-full w-full"
			>
				<path
					d="M913 513c0 220.914-179.086 400-400 400S113 733.914 113 513s179.086-400 400-400 400 179.086 400 400Z"
					stroke="#D4D4D4"
					strokeOpacity="0.7"
				/>
				<path
					d="M913 513c0 220.914-179.086 400-400 400"
					stroke={`url(#${id}-gradient-2)`}
					strokeLinecap="round"
				/>
				<defs>
					<linearGradient
						id={`${id}-gradient-2`}
						x1="913"
						y1="513"
						x2="913"
						y2="913"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#c8003a" />
						<stop offset="1" stopColor="#c8003a" stopOpacity="0" />
					</linearGradient>
				</defs>
			</svg>
		</div>
	)
}
