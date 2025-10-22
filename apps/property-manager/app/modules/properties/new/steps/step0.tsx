import { Building, Home } from 'lucide-react'
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
		name: 'Single Unit',
		description: 'A complete housing space rented by one family or tenant.',
		icon: Home,
	},
	{
		name: 'Multi-Unit',
		description:
			'A property divided into separate spaces rented by multiple tenants.',
		icon: Building,
	},
]

interface Props {
	onGoNext?: () => void
}

export function Step0({ onGoNext }: Props) {
	return (
		<main className="mx-auto mb-5 space-y-10 md:max-w-2/3">
			<div className="space-y-2">
				<TypographyH2 className="">What type of Property is this?</TypographyH2>
				<TypographyMuted className="">
					Choose the category that best matches your property's layout or use.
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
					<TypographyMuted>Status</TypographyMuted>
					<div className="mt-3 flex space-x-3">
						<Button variant="default">Active</Button>
						<Button variant="outline">Maintenance</Button>
						<Button variant="outline">Inactive</Button>
					</div>
				</div>
			</div>

			<div className="mt-10 flex items-center justify-end space-x-5">
				<Link to="/properties">
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
