import clsx from 'clsx'

function MenuIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
			<path
				d="M5 6h14M5 18h14M5 12h14"
				stroke="#fff"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

function UserIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
			<path
				d="M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.696 19h10.608c1.175 0 2.08-.935 1.532-1.897C18.028 15.69 16.187 14 12 14s-6.028 1.689-6.836 3.103C4.616 18.065 5.521 19 6.696 19Z"
				stroke="#fff"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function AppScreen({
	children,
	className,
	...props
}: React.ComponentPropsWithoutRef<'div'>) {
	return (
		<div className={clsx('flex flex-col', className)} {...props}>
			<div className="flex items-center justify-between px-4 pt-4">
				<MenuIcon className="h-6 w-6 flex-none" />
				<div className="flex items-center gap-2">
					<img
						src="/images/logomark.png"
						alt=""
						className="h-6 w-6 flex-none rounded-md"
					/>
					<span className="text-sm font-semibold text-white">Rentloop</span>
				</div>
				<UserIcon className="h-6 w-6 flex-none" />
			</div>
			{children}
		</div>
	)
}

function AppScreenHeader({ children }: { children: React.ReactNode }) {
	return <div className="mt-6 px-4 text-white">{children}</div>
}

function AppScreenTitle({ children }: { children: React.ReactNode }) {
	return <div className="text-2xl text-white">{children}</div>
}

function AppScreenSubtitle({ children }: { children: React.ReactNode }) {
	return <div className="text-sm text-gray-500">{children}</div>
}

function AppScreenBody({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<div className={clsx('mt-6 flex-auto rounded-t-2xl bg-white', className)}>
			{children}
		</div>
	)
}

AppScreen.Header = AppScreenHeader
AppScreen.Title = AppScreenTitle
AppScreen.Subtitle = AppScreenSubtitle
AppScreen.Body = AppScreenBody
