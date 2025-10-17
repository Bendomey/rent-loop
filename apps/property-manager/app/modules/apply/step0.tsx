import { CircleUserRound, DoorClosed, Home } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemHeader,
	ItemTitle,
} from '~/components/ui/item'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

const models = [
	{
		name: 'Landlord',
		description: 'Owns and rents out their own properties.',
		image:
			'https://images.unsplash.com/photo-1650804068570-7fb2e3dbf888?q=80&w=640&auto=format&fit=crop',
		credit: 'Valeria Reverdo on Unsplash',
		icon: CircleUserRound,
	},
	{
		name: 'Company',
		description: 'Manages properties on behalf of owners.',
		image:
			'https://images.unsplash.com/photo-1610280777472-54133d004c8c?q=80&w=640&auto=format&fit=crop',
		credit: 'Michael Oeser on Unsplash',
		icon: DoorClosed,
	},
]

interface Props {
	onGoNext?: () => void
}

export function Step0({ onGoNext }: Props) {
	return (
		<main className="mx-auto mb-5 space-y-10 md:max-w-2/3">
			<div className="space-y-2">
				<TypographyH2 className="">
					What type of Property Owner are you?
				</TypographyH2>
				<TypographyMuted className="">
					This will help us setup your account to handle your properties more
					effectively.
				</TypographyMuted>
			</div>

			<div>
				<ItemGroup className="grid grid-cols-2 gap-4">
					{models.map((model) => (
						<Item key={model.name} variant="outline">
							<ItemHeader className="flex items-center justify-center">
								<model.icon className="size-20" />
							</ItemHeader>
							<ItemContent className="flex items-center justify-center">
								<ItemTitle>{model.name}</ItemTitle>
								<ItemDescription className="text-center">
									{model.description}
								</ItemDescription>
							</ItemContent>
						</Item>
					))}
				</ItemGroup>

				<div className="mt-5">
					<TypographyMuted>Sub Type</TypographyMuted>
					<div className="mt-3 flex space-x-3">
						<Button variant="default">Property Manager</Button>
						<Button variant="outline">Developer</Button>
						<Button variant="outline">Agency</Button>
					</div>
				</div>
			</div>

			<div className="mt-10 flex items-center justify-end space-x-5">
				<Link to="/login">
					<Button size="sm" variant="ghost">
						<Home />
						Go Home
					</Button>
				</Link>
				<Button
					onClick={onGoNext}
					size="lg"
					variant="default"
					className="bg-rose-600 hover:bg-rose-700"
				>
					Next
				</Button>
			</div>
		</main>
	)
}
