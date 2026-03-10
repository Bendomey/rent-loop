import { Footer } from '~/components/layout/footer'
import { Header } from '~/components/layout/header'

export function TermsOfUse() {
	return (
		<div>
			<Header />

			<main className="mx-auto max-w-4xl px-6 py-24 pt-32 lg:px-8">
				<h1 className="text-4xl font-semibold tracking-tight text-gray-900">
					Terms of Use
				</h1>
				<p className="mt-2 text-sm text-gray-500">
					Last Updated: March 6, 2025
				</p>

				<section className="mt-10">
					<h2 className="mb-4 text-2xl font-semibold text-gray-900">
						1. Acceptance of Terms
					</h2>
					<p className="text-base/7 text-gray-600">
						By accessing or using RentLoop, you agree to comply with these Terms
						of Use.
					</p>
					<p className="mt-4 text-base/7 text-gray-600">
						If you do not agree with these terms, you should not use the
						platform.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						2. Description of Service
					</h2>
					<p className="text-base/7 text-gray-600">
						RentLoop provides a digital platform that enables:
					</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Property owners to list rental properties</li>
						<li>Tenants to discover and rent properties</li>
						<li>Parties to manage rental agreements and payments</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						RentLoop does not own the properties listed on the platform.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						3. User Accounts
					</h2>
					<p className="text-base/7 text-gray-600">Users must:</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Provide accurate information</li>
						<li>Maintain the security of their account</li>
						<li>Notify RentLoop of unauthorized use</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						Users are responsible for activities conducted through their
						accounts.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						4. Property Listings
					</h2>
					<p className="text-base/7 text-gray-600">
						Landlords and property managers agree that:
					</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Listings must be accurate</li>
						<li>Pricing must be transparent</li>
						<li>Properties must comply with applicable laws</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						RentLoop reserves the right to remove misleading listings.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						5. Payments
					</h2>
					<p className="text-base/7 text-gray-600">
						Payments processed through the platform may include:
					</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Rent payments</li>
						<li>Deposits</li>
						<li>Platform service fees</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						RentLoop may use third-party payment processors.
					</p>
					<p className="mt-4 text-base/7 text-gray-600">
						Transaction disputes must be addressed according to RentLoop's
						dispute resolution procedures.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						6. Prohibited Activities
					</h2>
					<p className="text-base/7 text-gray-600">Users must not:</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Provide false information</li>
						<li>Engage in fraud</li>
						<li>Attempt to hack or disrupt the platform</li>
						<li>Upload illegal or harmful content</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						Violation may result in account suspension.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						7. Limitation of Liability
					</h2>
					<p className="text-base/7 text-gray-600">
						RentLoop acts only as a platform connecting landlords and tenants.
					</p>
					<p className="mt-4 text-base/7 text-gray-600">
						RentLoop is not responsible for:
					</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Property conditions</li>
						<li>Landlord-tenant disputes</li>
						<li>Losses arising from rental agreements</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						Users agree that transactions are conducted at their own risk.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						8. Termination
					</h2>
					<p className="text-base/7 text-gray-600">
						RentLoop may suspend or terminate accounts that violate these terms.
					</p>
					<p className="mt-4 text-base/7 text-gray-600">
						Users may also terminate their accounts at any time.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						9. Governing Law
					</h2>
					<p className="text-base/7 text-gray-600">
						These Terms are governed by the laws of Ghana.
					</p>
					<p className="mt-4 text-base/7 text-gray-600">
						Any disputes shall be resolved in the courts of Ghana.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						10. Contact
					</h2>
					<p className="text-base/7 text-gray-600">
						For questions about these Terms:
					</p>
					<p className="mt-4 text-base/7 text-gray-600">
						RentLoop Legal Team
						<br />
						Email:{' '}
						<a
							href="mailto:rentloopapp@gmail.com"
							className="text-rose-700 hover:text-rose-600"
						>
							rentloopapp@gmail.com
						</a>
					</p>
				</section>
			</main>

			<Footer />
		</div>
	)
}
