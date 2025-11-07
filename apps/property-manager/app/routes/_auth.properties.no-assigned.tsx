import { GalleryVerticalEnd, SearchIcon } from 'lucide-react'
import { Form, redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.no-assigned'

import { Button } from '~/components/ui/button'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
} from '~/components/ui/empty'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '~/components/ui/input-group'
import { TypographyH1 } from '~/components/ui/typography'
import { userContext } from '~/lib/actions/auth.context.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'

export async function loader({ request, context }: Route.LoaderArgs) {
	const authData = context.get(userContext)
	if (!authData) {
		return redirect('/login')
	}

	if (authData.clientUser.role !== 'STAFF') {
		return redirect('/')
	}

	if (
		authData.clientUser.role === 'STAFF' &&
		authData.clientUserProperties.rows.length
	) {
		const firstProperty = authData.clientUserProperties.rows[0]
		return redirect(`/properties/${firstProperty?.property?.slug}`)
	}

	return {
		origin: getDomainUrl(request),
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `No Properties Assigned | ${APP_NAME}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default function NoAssignedProperties() {
	return (
		<div className="mx-auto flex h-screen w-full items-center justify-center">
			<Empty className="">
				<EmptyHeader>
					<div className="flex flex-col gap-2 font-medium">
						<div className="flex size-8 items-center justify-center rounded-md">
							<GalleryVerticalEnd className="size-10" />
						</div>
						<span className="sr-only">{APP_NAME}.</span>
					</div>
					<TypographyH1 className="mt-4">
						Welcome to{' '}
						<span className="text-rose-700">{APP_NAME.slice(0, 4)}</span>{' '}
						<span className="font-extrabold">{APP_NAME.slice(4)}</span>
					</TypographyH1>
					<EmptyDescription>
						You currently have no properties assigned to your account. Reach out
						to your administrator for access.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent className="mt-5">
					<InputGroup className="sm:w-3/4">
						<InputGroupInput placeholder="Try searching for pages..." />
						<InputGroupAddon>
							<SearchIcon />
						</InputGroupAddon>
						<InputGroupAddon align="inline-end">
							<kbd>/</kbd>
						</InputGroupAddon>
					</InputGroup>
					<EmptyDescription>
						Need help?{' '}
						<Button
							variant="link"
							className="ml-2 p-0 underline"
							onClick={() => window?.Tawk_API?.toggle()}
						>
							Contact support
						</Button>
					</EmptyDescription>
					<Form method="post" action="/logout">
						<Button>Logout</Button>
					</Form>
				</EmptyContent>
			</Empty>
		</div>
	)
}
