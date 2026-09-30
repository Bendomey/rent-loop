import clsx from 'clsx'
import { Link } from 'react-router'

const baseStyles = {
	solid:
		'inline-flex items-center justify-center rounded-lg py-2 px-3 text-sm font-semibold transition-colors',
	outline:
		'inline-flex items-center justify-center rounded-lg border py-[calc(--spacing(2)-1px)] px-[calc(--spacing(3)-1px)] text-sm transition-colors',
}

const variantStyles = {
	solid: {
		brand:
			'relative overflow-hidden bg-brand-500 text-white before:absolute before:inset-0 before:transition-colors hover:before:bg-white/10 active:bg-brand-600 active:text-white/80 active:before:bg-transparent',
		white:
			'bg-white text-gray-900 hover:bg-white/90 active:bg-white/90 active:text-gray-900/70',
		gray: 'bg-gray-800 text-white hover:bg-gray-900 active:bg-gray-800 active:text-white/80',
	},
	outline: {
		gray: 'border-gray-300 text-gray-700 hover:border-gray-400 active:bg-gray-100 active:text-gray-700/80',
		white:
			'border-white/25 text-white hover:border-white/40 active:bg-white/10 active:text-white/80',
	},
}

type ButtonProps = (
	| { variant?: 'solid'; color?: keyof typeof variantStyles.solid }
	| { variant: 'outline'; color?: keyof typeof variantStyles.outline }
) & {
	className?: string
	children: React.ReactNode
} & (
		| { href: string; onClick?: never; type?: never }
		| {
				href?: undefined
				onClick?: () => void
				type?: 'button' | 'submit'
		  }
	)

function isInternal(href: string) {
	return href.startsWith('/') && !href.startsWith('//')
}

export function Button({
	variant = 'solid',
	color = 'gray',
	className,
	children,
	...props
}: ButtonProps) {
	const classes = clsx(
		baseStyles[variant],
		variant === 'outline'
			? variantStyles.outline[color as keyof typeof variantStyles.outline]
			: variantStyles.solid[color as keyof typeof variantStyles.solid],
		className,
	)

	if (props.href === undefined) {
		return (
			<button
				type={props.type ?? 'button'}
				onClick={props.onClick}
				className={classes}
			>
				{children}
			</button>
		)
	}

	if (isInternal(props.href)) {
		return (
			<Link to={props.href} className={classes}>
				{children}
			</Link>
		)
	}

	return (
		<a href={props.href} className={classes}>
			{children}
		</a>
	)
}
