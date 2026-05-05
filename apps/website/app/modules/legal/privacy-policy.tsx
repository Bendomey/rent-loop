import { Footer } from '~/components/layout/footer'
import { Header } from '~/components/layout/header'

export function PrivacyPolicy() {
	return (
		<div>
			<Header />

			<main className="mx-auto max-w-4xl px-6 py-24 pt-32 lg:px-8">
				<h1 className="text-4xl font-semibold tracking-tight text-gray-900">
					Privacy Policy
				</h1>
				<p className="mt-2 text-sm text-gray-500">
					Last Updated: March 6, 2025
				</p>

				<section className="mt-10">
					<h2 className="mb-4 text-2xl font-semibold text-gray-900">
						1. Introduction
					</h2>
					<p className="text-base/7 text-gray-600">
						RentLoop (&ldquo;RentLoop&rdquo;, &ldquo;we&rdquo;,
						&ldquo;us&rdquo;, or &ldquo;our&rdquo;) respects your privacy and is
						committed to protecting the personal data of our users. This Privacy
						Policy explains how we collect, use, disclose, and safeguard your
						information when you use the RentLoop platform, website, and related
						services.
					</p>
					<p className="mt-4 text-base/7 text-gray-600">
						This policy is designed in compliance with the Data Protection Act,
						2012 (Act 843) and other applicable laws in Ghana.
					</p>
					<p className="mt-4 text-base/7 text-gray-600">
						By using RentLoop, you consent to the practices described in this
						Privacy Policy.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						2. Information We Collect
					</h2>
					<p className="text-base/7 text-gray-600">
						We may collect the following types of personal data:
					</p>

					<h3 className="mt-6 mb-2 text-lg font-medium text-gray-900">
						Personal Identification Information
					</h3>
					<ul className="list-disc space-y-1 pl-6 text-gray-600">
						<li>Full name</li>
						<li>Email address</li>
						<li>Phone number</li>
						<li>Residential address</li>
						<li>National ID (if required for verification)</li>
					</ul>

					<h3 className="mt-6 mb-2 text-lg font-medium text-gray-900">
						Property and Rental Information
					</h3>
					<ul className="list-disc space-y-1 pl-6 text-gray-600">
						<li>Property listings</li>
						<li>Lease details</li>
						<li>Payment records</li>
						<li>Tenant and landlord details</li>
					</ul>

					<h3 className="mt-6 mb-2 text-lg font-medium text-gray-900">
						Payment Information
					</h3>
					<ul className="list-disc space-y-1 pl-6 text-gray-600">
						<li>Mobile money numbers</li>
						<li>Payment transaction references</li>
						<li>Billing information</li>
					</ul>

					<h3 className="mt-6 mb-2 text-lg font-medium text-gray-900">
						Technical Data
					</h3>
					<ul className="list-disc space-y-1 pl-6 text-gray-600">
						<li>IP address</li>
						<li>Device information</li>
						<li>Browser type</li>
						<li>Cookies and usage data</li>
					</ul>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						3. How We Collect Your Information
					</h2>
					<p className="text-base/7 text-gray-600">
						We collect information when you:
					</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Create an account on RentLoop</li>
						<li>List or rent a property</li>
						<li>Make rent payments</li>
						<li>Contact customer support</li>
						<li>Use the RentLoop website or mobile application</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						We may also collect limited technical data automatically through
						cookies and analytics tools.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						4. How We Use Your Information
					</h2>
					<p className="text-base/7 text-gray-600">
						Your personal data may be used for the following purposes:
					</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Creating and managing your account</li>
						<li>
							Facilitating rental agreements between tenants and landlords
						</li>
						<li>Processing rent payments</li>
						<li>Verifying user identities</li>
						<li>Communicating important service updates</li>
						<li>Preventing fraud or illegal activities</li>
						<li>Improving our platform and services</li>
					</ul>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						5. Legal Basis for Processing
					</h2>
					<p className="text-base/7 text-gray-600">
						We process personal data based on:
					</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>User consent</li>
						<li>Performance of a contract</li>
						<li>Compliance with legal obligations</li>
						<li>Legitimate business interests</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						These principles are required under the Data Protection Act, 2012
						(Act 843), which mandates lawful and transparent data processing.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						6. Sharing of Personal Information
					</h2>
					<p className="text-base/7 text-gray-600">
						We may share your information with:
					</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Payment service providers</li>
						<li>Property managers or landlords</li>
						<li>Cloud infrastructure providers</li>
						<li>Law enforcement agencies where legally required</li>
						<li>Professional advisors (legal, accounting, etc.)</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						We do not sell personal data to third parties.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						7. Data Security
					</h2>
					<p className="text-base/7 text-gray-600">
						We implement appropriate technical and organizational measures to
						protect personal data, including:
					</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Encrypted data transmission</li>
						<li>Secure authentication</li>
						<li>Access control policies</li>
						<li>Regular security monitoring</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						However, no system is completely secure, and users should also take
						precautions to protect their login credentials.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						8. Data Retention
					</h2>
					<p className="text-base/7 text-gray-600">
						We retain personal data only for as long as necessary to:
					</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Provide our services</li>
						<li>Comply with legal obligations</li>
						<li>Resolve disputes</li>
						<li>Enforce agreements</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						When data is no longer needed, it will be securely deleted or
						anonymized.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						9. Your Rights Under Ghana Law
					</h2>
					<p className="text-base/7 text-gray-600">
						Under the Data Protection Act, 2012 (Act 843), you have the right
						to:
					</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Request access to your personal data</li>
						<li>Request correction of inaccurate data</li>
						<li>Object to certain processing activities</li>
						<li>Withdraw consent</li>
						<li>Request deletion of personal data where legally permissible</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						You may also lodge complaints with the Data Protection Commission.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						10. Cookies and Tracking
					</h2>
					<p className="text-base/7 text-gray-600">
						RentLoop may use cookies and similar technologies to:
					</p>
					<ul className="mt-4 list-disc space-y-1 pl-6 text-gray-600">
						<li>Improve user experience</li>
						<li>Analyze traffic</li>
						<li>Remember user preferences</li>
					</ul>
					<p className="mt-4 text-base/7 text-gray-600">
						You can disable cookies through your browser settings.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						11. Third-Party Links
					</h2>
					<p className="text-base/7 text-gray-600">
						Our platform may contain links to third-party websites. We are not
						responsible for the privacy practices of those websites.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						12. Changes to This Policy
					</h2>
					<p className="text-base/7 text-gray-600">
						We may update this Privacy Policy periodically. When changes occur,
						we will update the &ldquo;Last Updated&rdquo; date and notify users
						where appropriate.
					</p>
				</section>

				<section>
					<h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900">
						13. Contact Information
					</h2>
					<p className="text-base/7 text-gray-600">
						If you have questions about this Privacy Policy, contact:
					</p>
					<p className="mt-4 text-base/7 text-gray-600">
						RentLoop
						<br />
						Email:{' '}
						<a
							href="mailto:support@rentloopapp.com"
							className="text-rose-700 hover:text-rose-600"
						>
							support@rentloopappapp.com
						</a>
						<br />
						Country: Ghana
					</p>
				</section>
			</main>

			<Footer />
		</div>
	)
}
