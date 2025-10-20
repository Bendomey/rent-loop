import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$getSelection,
} from 'lexical'
import { TextCursorInput } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { TypographyH4, TypographySmall } from '~/components/ui/typography'

export function TemplateFieldsPlugin() {
	const [editor] = useLexicalComposerContext()

	return (
		<>
			<TypographyH4 className="text-zinc-400">Template Fields</TypographyH4>
			<TypographySmall className="text-xs text-zinc-500">
				Click to insert template fields into your document.
			</TypographySmall>
			<div className="mt-3 space-y-3">
				{[
					{ label: 'Landlord Name', value: 'LandlordName' },
					{ label: 'Landlord Email', value: 'LandlordEmail' },
					{ label: 'Landlord Phone Number', value: 'LandlordPhoneNumber' },
					{ label: 'Landlord Address', value: 'LandlordAddress' },

					{ label: 'Tenant Name', value: 'TenantName' },
					{ label: 'Tenant Address', value: 'TenantAddress' },
					{ label: 'Tenant Email', value: 'TenantEmail' },
					{ label: 'Tenant Phone Number', value: 'TenantPhoneNumber' },

					{ label: 'Property Address', value: 'PropertyAddress' },
					{ label: 'Unit Number', value: 'UnitNumber' },
					{ label: 'Lease Start Date', value: 'LeaseStartDate' },
					{ label: 'Lease End Date', value: 'LeaseEndDate' },
					{ label: 'Lease Duration', value: 'LeaseDuration' },
					{ label: 'Rent Amount', value: 'RentAmount' },
					{ label: 'Rent Amount In Words', value: 'RentAmountInWords' },
					{ label: 'Rent Frequency', value: 'RentFrequency' },
					{ label: 'Security Deposit', value: 'SecurityDeposit' },

					{ label: 'Payment Due Date', value: 'PaymentDueDate' },
					{ label: 'Payment Account Details', value: 'PaymentAccountDetails' },
					{ label: 'Agreement Date', value: 'AgreementDate' },

					{ label: 'Late Fee Amount', value: 'LateFeeAmount' },
					{ label: 'Notice Period', value: 'NoticePeriod' },
					{ label: 'Refund Period', value: 'RefundPeriod' },
					{ label: 'Renewal Terms', value: 'RenewalTerms' },

					{ label: 'Landlord Signed On', value: 'LandlordSignedOn' },
					{ label: 'Tenant Signed On', value: 'TenantSignedOn' },
					{ label: 'Landlord Witness Name', value: 'LandlordWitnessName' },
					{
						label: 'Landlord Witness Signed On',
						value: 'LandlordWitnessSignedOn',
					},
					{ label: 'Tenant Witness Name', value: 'TenantWitnessName' },
					{ label: 'Tenant Witness Signed On', value: 'TenantWitnessSignedOn' },
				].map((item) => (
					<Button
						onClick={() => {
							editor.update(() => {
								const templateText = `#${item.value}`
								const selection = $getSelection()

								if (selection) {
									selection.insertNodes([$createTextNode(templateText)])
								} else {
									const root = $getRoot()
									const paragraph = $createParagraphNode()
									const text = $createTextNode(templateText)
									paragraph.append(text)
									root.append(paragraph)
								}
							})
						}}
						key={item.value}
						variant="outline"
						className="w-full items-center justify-start gap-2"
					>
						<TextCursorInput className="size-5" />
						<TypographySmall className="text-xs font-normal">
							{item.label}
						</TypographySmall>
					</Button>
				))}
			</div>
		</>
	)
}
