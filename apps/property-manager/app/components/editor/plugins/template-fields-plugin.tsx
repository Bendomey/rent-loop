import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $wrapNodeInElement } from '@lexical/utils'
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$getSelection,
	$isRootOrShadowRoot,
	$insertNodes,
	$nodesOfType,
} from 'lexical'
import { PenLine, TextCursorInput } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
	$createSignatureNode,
	SignatureNode,
	type SignatureRole,
} from '~/components/editor/nodes/signature-node'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { TypographyH4, TypographySmall } from '~/components/ui/typography'

const TEMPLATE_FIELDS = [
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
	{ label: 'Landlord Witness Signed On', value: 'LandlordWitnessSignedOn' },
	{ label: 'Tenant Witness Name', value: 'TenantWitnessName' },
	{ label: 'Tenant Witness Signed On', value: 'TenantWitnessSignedOn' },
] as const

const SIGNATURE_BLOCKS: Array<{ label: string; role: SignatureRole }> = [
	{ label: 'Property Manager', role: 'property_manager' },
	{ label: 'Tenant', role: 'tenant' },
	{ label: 'Property Manager Witness', role: 'pm_witness' },
	{ label: 'Tenant Witness', role: 'tenant_witness' },
]

// These roles can only appear once in a document
const SINGLETON_ROLES: SignatureRole[] = [
	'property_manager',
	'tenant',
	'pm_witness',
	'tenant_witness',
]

export function TemplateFieldsPlugin() {
	const [editor] = useLexicalComposerContext()
	const [existingRoles, setExistingRoles] = useState<Set<SignatureRole>>(
		new Set(),
	)

	useEffect(() => {
		const readRoles = () => {
			editor.getEditorState().read(() => {
				const roles = $nodesOfType(SignatureNode).map((n) => n.getRole())
				setExistingRoles(new Set(roles))
			})
		}

		readRoles()

		return editor.registerUpdateListener(readRoles)
	}, [editor])

	const insertTextField = (value: string) => {
		editor.update(() => {
			const templateText = `#${value}`
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
	}

	const insertSignatureBlock = (role: SignatureRole) => {
		editor.update(() => {
			const signatureNode = $createSignatureNode({ role })
			$insertNodes([signatureNode])
			if ($isRootOrShadowRoot(signatureNode.getParentOrThrow())) {
				$wrapNodeInElement(signatureNode, $createParagraphNode).selectEnd()
			}
		})
	}

	return (
		<>
			<TypographyH4 className="text-zinc-400">Template Fields</TypographyH4>
			<TypographySmall className="text-xs text-zinc-500">
				Click to insert template fields into your document.
			</TypographySmall>
			<div className="mt-3 space-y-3">
				{TEMPLATE_FIELDS.map((item) => (
					<Button
						onClick={() => insertTextField(item.value)}
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

			<Separator className="my-4" />

			<TypographyH4 className="mt-4 text-zinc-400">
				Signature Blocks
			</TypographyH4>
			<TypographySmall className="text-xs text-zinc-500">
				Click to insert a signature placeholder.
			</TypographySmall>
			<div className="mt-3 space-y-3">
				{SIGNATURE_BLOCKS.map((item) => {
					const isDisabled =
						SINGLETON_ROLES.includes(item.role) && existingRoles.has(item.role)
					return (
						<Button
							onClick={() => insertSignatureBlock(item.role)}
							key={item.role}
							variant="outline"
							disabled={isDisabled}
							title={
								isDisabled
									? 'This signature block is already in the document'
									: undefined
							}
							className="w-full items-center justify-start gap-2"
						>
							<PenLine className="size-5" />
							<TypographySmall className="text-xs font-normal">
								{item.label}
							</TypographySmall>
						</Button>
					)
				})}
			</div>
		</>
	)
}
