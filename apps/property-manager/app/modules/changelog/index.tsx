import bgImge from '~/assets/bg-changelog.jpg'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { TypographyH4 } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'

const timelineData = [
	{
		date: new Date(),
		title: 'The Birth of Rentloop',
		version: '1.0.0',
		content: (
			<div>
				<span>
					Rentloop is born out of a desire to simplify property management for
					landlords and tenants alike. Our mission is to create a seamless
					rental experience through innovative technology and user-friendly
					design. We envision a future where renting is hassle-free,
					transparent, and efficient for everyone involved.
				</span>

				<div className="mt-5">
					<TypographyH4 className="mb-2">Key Features at Launch:</TypographyH4>
					<ul className="list-disc space-y-1 pl-5 text-sm">
						<li>Properties/Units/Apartments Management</li>
						<li>Online rent payments</li>
						<li>Maintenance request tracking</li>
						<li>Tenant screening</li>
						<li>Lease management</li>
						<li>Communication tools</li>
					</ul>
				</div>
			</div>
		),
	},
]

export function ChangelogModule() {
	return (
		<section className="bg-background">
			<div className="">
				<div
					className="relative h-[40vh]"
					style={{
						backgroundImage: `url(${bgImge})`,
					}}
				>
					<div className="absolute top-0 h-full w-full bg-linear-to-b from-transparent via-transparent to-white py-16">
						<h1 className="text-foreground mb-10 text-center text-3xl font-bold tracking-tighter sm:text-6xl">
							Changelog
						</h1>
						<p className="text-muted-foreground mx-auto mb-16 max-w-2xl px-2 text-center text-lg">
							Stay updated with the latest changes, improvements, and features
							in our application. Our changelog provides a comprehensive
							overview of all significant updates to keep you informed.
						</p>
					</div>
				</div>
				<div className="relative mx-auto max-w-4xl px-3 md:px-0">
					<Separator
						orientation="vertical"
						className="bg-muted absolute top-4 left-2 mx-3 md:mx-0"
					/>
					{timelineData.map((entry, index) => (
						<div key={index} className="relative mb-10 pl-8">
							<div className="bg-foreground absolute top-3.5 left-0 flex size-4 items-center justify-center rounded-full" />
							<h4 className="rounded-xl py-2 text-xl font-bold tracking-tight">
								{entry.title} <Badge>v{entry.version}</Badge>
							</h4>

							<h5 className="text-md text-muted-foreground  rounded-xl tracking-tight ">
								{localizedDayjs(entry.date).format('LL')}
							</h5>

							<Card className="m-0 border-none shadow-none md:m-5">
								<CardContent className="px-0 md:px-2">
									<div className="text-foreground">{entry.content}</div>
								</CardContent>
							</Card>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
