/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
	$getSelectionStyleValueForProperty,
	$isAtNodeEnd,
} from '@lexical/selection'
import { mergeRegister } from '@lexical/utils'
import type { BaseSelection, NodeKey, TextNode } from 'lexical'
import {
	$addUpdateTag,
	$createTextNode,
	$getNodeByKey,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	$setSelection,
	COMMAND_PRIORITY_LOW,
	HISTORY_MERGE_TAG,
	KEY_ARROW_RIGHT_COMMAND,
	KEY_TAB_COMMAND,
} from 'lexical'
import { useCallback, useEffect } from 'react'
import type { JSX } from 'react'

import {
	$createAutocompleteNode,
	AutocompleteNode,
} from '~/components/editor/nodes/autocomplete-node'
import { addSwipeRightListener } from '~/components/editor/utils/swipe'

const HISTORY_MERGE = { tag: HISTORY_MERGE_TAG }

declare global {
	interface Navigator {
		userAgentData?: {
			mobile: boolean
		}
	}
}

type SearchPromise = {
	dismiss: () => void
	promise: Promise<null | string>
}

export const uuid = Math.random()
	.toString(36)
	.replace(/[^a-z]+/g, '')
	.substring(0, 5)

// TODO lookup should be custom
function $search(selection: null | BaseSelection): [boolean, string] {
	if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
		return [false, '']
	}
	const node = selection.getNodes()[0]
	const anchor = selection.anchor
	// Check siblings?
	if (!$isTextNode(node) || !node.isSimpleText() || !$isAtNodeEnd(anchor)) {
		return [false, '']
	}
	const word = []
	const text = node.getTextContent()
	let i = node.getTextContentSize()
	let c
	while (i-- && i >= 0 && (c = text[i]) !== ' ') {
		word.push(c)
	}
	if (word.length === 0) {
		return [false, '']
	}
	return [true, word.reverse().join('')]
}

// TODO query should be custom
function useQuery(): (searchText: string) => SearchPromise {
	return useCallback((searchText: string) => {
		const server = new AutocompleteServer()
		console.time('query')
		const response = server.query(searchText)
		console.timeEnd('query')
		return response
	}, [])
}

function formatSuggestionText(suggestion: string): string {
	const userAgentData = window.navigator.userAgentData
	const isMobile =
		userAgentData !== undefined
			? userAgentData.mobile
			: window.innerWidth <= 800 && window.innerHeight <= 600

	return `${suggestion} ${isMobile ? '(SWIPE \u2B95)' : '(TAB)'}`
}

export function AutocompletePlugin(): JSX.Element | null {
	const [editor] = useLexicalComposerContext()
	const query = useQuery()
	// const {toolbarState} = useToolbarState();

	useEffect(() => {
		let autocompleteNodeKey: null | NodeKey = null
		let lastMatch: null | string = null
		let lastSuggestion: null | string = null
		let searchPromise: null | SearchPromise = null
		let prevNodeFormat: number = 0
		function $clearSuggestion() {
			const autocompleteNode =
				autocompleteNodeKey !== null ? $getNodeByKey(autocompleteNodeKey) : null
			if (autocompleteNode !== null && autocompleteNode.isAttached()) {
				autocompleteNode.remove()
				autocompleteNodeKey = null
			}
			if (searchPromise !== null) {
				searchPromise.dismiss()
				searchPromise = null
			}
			lastMatch = null
			lastSuggestion = null
			prevNodeFormat = 0
		}
		function updateAsyncSuggestion(
			refSearchPromise: SearchPromise,
			newSuggestion: null | string,
		) {
			if (searchPromise !== refSearchPromise || newSuggestion === null) {
				// Outdated or no suggestion
				return
			}
			editor.update(() => {
				const selection = $getSelection()
				const [hasMatch, match] = $search(selection)
				if (!hasMatch || match !== lastMatch || !$isRangeSelection(selection)) {
					// Outdated
					return
				}
				const fontSize = $getSelectionStyleValueForProperty(
					selection,
					'font-size',
					'16px',
				)

				const selectionCopy = selection.clone()
				const prevNode = selection.getNodes()[0] as TextNode
				prevNodeFormat = prevNode.getFormat()
				const node = $createAutocompleteNode(
					formatSuggestionText(newSuggestion),
					uuid,
				)
					.setFormat(prevNodeFormat)
					.setStyle(`font-size: ${fontSize}`)
				autocompleteNodeKey = node.getKey()
				selection.insertNodes([node])
				$setSelection(selectionCopy)
				lastSuggestion = newSuggestion
			}, HISTORY_MERGE)
		}

		function $handleAutocompleteNodeTransform(node: AutocompleteNode) {
			const key = node.getKey()
			if (node.__uuid === uuid && key !== autocompleteNodeKey) {
				// Max one Autocomplete node per session
				$clearSuggestion()
			}
		}
		function handleUpdate() {
			editor.update(() => {
				const selection = $getSelection()
				const [hasMatch, match] = $search(selection)
				if (!hasMatch) {
					$clearSuggestion()
					return
				}
				if (match === lastMatch) {
					return
				}
				$clearSuggestion()
				searchPromise = query(match)
				searchPromise.promise
					.then((newSuggestion) => {
						if (searchPromise !== null) {
							updateAsyncSuggestion(searchPromise, newSuggestion)
						}
					})
					.catch((e) => {
						if (e !== 'Dismissed') {
							console.error(e)
						}
					})
				lastMatch = match
			}, HISTORY_MERGE)
		}
		function $handleAutocompleteIntent(): boolean {
			if (lastSuggestion === null || autocompleteNodeKey === null) {
				return false
			}
			const autocompleteNode = $getNodeByKey(autocompleteNodeKey)
			if (autocompleteNode === null) {
				return false
			}

			const selection = $getSelection()
			if (!$isRangeSelection(selection)) {
				// Outdated
				return false
			}
			const fontSize = $getSelectionStyleValueForProperty(
				selection,
				'font-size',
				'16px',
			)

			const textNode = $createTextNode(lastSuggestion)
				.setFormat(prevNodeFormat)
				.setStyle(`font-size: ${fontSize}`)
			autocompleteNode.replace(textNode)
			textNode.selectNext()
			$clearSuggestion()
			return true
		}
		function $handleKeypressCommand(e: Event) {
			if ($handleAutocompleteIntent()) {
				e.preventDefault()
				return true
			}
			return false
		}
		function handleSwipeRight(_force: number, e: TouchEvent) {
			editor.update(() => {
				if ($handleAutocompleteIntent()) {
					e.preventDefault()
				} else {
					$addUpdateTag(HISTORY_MERGE.tag)
				}
			})
		}
		function unmountSuggestion() {
			editor.update(() => {
				$clearSuggestion()
			}, HISTORY_MERGE)
		}

		const rootElem = editor.getRootElement()

		return mergeRegister(
			editor.registerNodeTransform(
				AutocompleteNode,
				$handleAutocompleteNodeTransform,
			),
			editor.registerUpdateListener(handleUpdate),
			editor.registerCommand(
				KEY_TAB_COMMAND,
				$handleKeypressCommand,
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand(
				KEY_ARROW_RIGHT_COMMAND,
				$handleKeypressCommand,
				COMMAND_PRIORITY_LOW,
			),
			...(rootElem !== null
				? [addSwipeRightListener(rootElem, handleSwipeRight)]
				: []),
			unmountSuggestion,
		)
	}, [editor, query])

	return null
}

/*
 * Simulate an asynchronous autocomplete server (typical in more common use cases like GMail where
 * the data is not static).
 */
class AutocompleteServer {
	DATABASE = DICTIONARY
	LATENCY = 200

	query = (searchText: string): SearchPromise => {
		let isDismissed = false

		const dismiss = () => {
			isDismissed = true
		}
		const promise: Promise<null | string> = new Promise((resolve, reject) => {
			setTimeout(() => {
				if (isDismissed) {
					// TODO cache result
					return reject('Dismissed')
				}
				const searchTextLength = searchText.length
				if (searchText === '' || searchTextLength < 4) {
					return resolve(null)
				}
				const char0 = searchText.charCodeAt(0)
				const isCapitalized = char0 >= 65 && char0 <= 90
				const caseInsensitiveSearchText = isCapitalized
					? String.fromCharCode(char0 + 32) + searchText.substring(1)
					: searchText
				const match = this.DATABASE.find(
					(dictionaryWord) =>
						dictionaryWord.startsWith(caseInsensitiveSearchText) ?? null,
				)
				if (match === undefined) {
					return resolve(null)
				}
				const matchCapitalized = isCapitalized
					? String.fromCharCode(match.charCodeAt(0) - 32) + match.substring(1)
					: match
				const autocompleteChunk = matchCapitalized.substring(searchTextLength)
				if (autocompleteChunk === '') {
					return resolve(null)
				}
				return resolve(autocompleteChunk)
			}, this.LATENCY)
		})

		return {
			dismiss,
			promise,
		}
	}
}

// most used words in lease agreements/real estate contracts
const DICTIONARY = [
	'Landlord',
	'Tenant',
	'Lessor',
	'Lessee',
	'Owner',
	'Occupant',
	'Agent',
	'Broker',
	'Representative',
	'Subtenant',
	'Sublessor',
	'Property Manager',
	'Guarantor',
	'Assignor',
	'Assignee',
	'Buyer',
	'Seller',
	'Client',
	'Parties',

	'Agreement',
	'Contract',
	'Lease',
	'Addendum',
	'Amendment',
	'Schedule',
	'Exhibit',
	'Annex',
	'Covenant',
	'Obligation',
	'Condition',
	'Provision',
	'Clause',
	'Term',
	'Duration',
	'Renewal',
	'Termination',
	'Extension',
	'Modification',
	'Assignment',
	'Execution',
	'Counterpart',
	'Effective Date',
	'Commencement Date',
	'Expiration Date',
	'Notice Period',
	'Breach',
	'Default',
	'Remedy',
	'Indemnity',
	'Waiver',
	'Confidentiality',
	'Representation',
	'Warranty',
	'Liability',
	'Severability',
	'Governing Law',
	'Jurisdiction',
	'Force Majeure',
	'Entire Agreement',
	'Binding',
	'Enforceable',

	'Rent',
	'Deposit',
	'Security Deposit',
	'Advance',
	'Installment',
	'Due Date',
	'Payment',
	'Interest',
	'Late Fee',
	'Penalty',
	'Outstanding',
	'Invoice',
	'Receipt',
	'Escrow',
	'Deduction',
	'Refund',
	'Reimbursement',
	'Utilities',
	'Maintenance Fee',
	'Service Charge',
	'Operating Expense',
	'Adjustment',
	'Tax',
	'Assessment',
	'Insurance',
	'Coverage',
	'Premium',
	'Compensation',

	'Premises',
	'Property',
	'Building',
	'Unit',
	'Apartment',
	'House',
	'Plot',
	'Land',
	'Suite',
	'Office',
	'Floor',
	'Room',
	'Common Area',
	'Parking Space',
	'Fixtures',
	'Fittings',
	'Appliances',
	'Furniture',
	'Utilities',
	'Access',
	'Entrance',
	'Boundaries',
	'Location',
	'Description',
	'Address',
	'Area',
	'Square Feet',
	'Survey Plan',
	'Title',
	'Certificate',
	'Ownership',
	'Encumbrance',
	'Improvements',
	'Alterations',
	'Repairs',
	'Maintenance',
	'Condition',
	'Inspection',

	'Commencement',
	'Expiry',
	'Renewal',
	'Term',
	'Period',
	'Monthly',
	'Annually',
	'Calendar Year',
	'Business Day',
	'Notice',
	'Prior',
	'Subsequent',
	'Immediately',
	'Thereafter',
	'Within',
	'Upon',
	'Effective',
	'Until',
	'Before',
	'After',

	'Applicable Law',
	'Jurisdiction',
	'Regulations',
	'Permits',
	'Licenses',
	'Compliance',
	'Zoning',
	'Building Code',
	'Health and Safety',
	'Fire Safety',
	'Insurance Policy',
	'Subrogation',
	'Default',
	'Breach',
	'Notice of Default',
	'Termination Notice',
	'Arbitration',
	'Dispute',
	'Settlement',
	'Litigation',
	'Attorney',
	'Costs',
	'Fees',
	'Indemnification',
	'Limitation',
	'Liability',
	'Confidential',
	'Disclosure',
	'Representations',
	'Warranties',
	'Severability',

	'Purchase',
	'Sale',
	'Transfer',
	'Title',
	'Deed',
	'Possession',
	'Closing',
	'Completion',
	'Settlement',
	'Escrow',
	'Deposit',
	'Consideration',
	'Market Value',
	'Appraisal',
	'Valuation',
	'Mortgage',
	'Loan',
	'Lien',
	'Encumbrance',
	'Registration',
	'Ownership',
	'Joint Tenancy',
	'Tenancy in Common',
	'Freehold',
	'Leasehold',
	'Sublease',
	'Assignment',
	'Option',
	'Right of First Refusal',
	'Offer',
	'Acceptance',
	'Counteroffer',

	'Obligation',
	'Right',
	'Responsibility',
	'Access',
	'Quiet Enjoyment',
	'Repair',
	'Maintenance',
	'Alteration',
	'Improvement',
	'Inspection',
	'Entry',
	'Notice',
	'Consent',
	'Approval',
	'Authorization',
	'Restriction',
	'Prohibited',
	'Permitted Use',
	'Subletting',
	'Assignment',
	'Utilities',
	'Services',
	'Security',
	'Insurance',
	'Indemnify',
	'Defend',
	'Hold Harmless',
	'Compliance',

	'Repair',
	'Maintain',
	'Replace',
	'Restore',
	'Clean',
	'Damage',
	'Wear and Tear',
	'Alteration',
	'Improvement',
	'Renovation',
	'Decoration',
	'Inspection',
	'Condition',
	'Defect',
	'Hazard',
	'Safety',
	'Compliance',
	'Utilities',
	'Plumbing',
	'Electrical',
	'Heating',
	'Air Conditioning',
	'Water Supply',
	'Waste Disposal',

	'Notice',
	'Written Notice',
	'Email',
	'Address',
	'Delivery',
	'Recipient',
	'Sender',
	'Service',
	'Acknowledgment',
	'Receipt',
	'Registered Mail',
	'Courier',
	'Signature',
	'Electronic Signature',
	'Date',

	'Hereinafter referred to as',
	'In consideration of',
	'Subject to',
	'Notwithstanding',
	'Provided that',
	'Without prejudice to',
	'Pursuant to',
	'Whereas',
	'In witness whereof',
	'Hereunder',
	'Thereof',
	'Hereby',
	'Therein',
	'Herein',
	'Shall',
	'May',
	'Deem',
	'Mutually agreed',
	'Between the parties',
	'For avoidance of doubt',
	'Unless otherwise stated',
	'To the extent permitted by law',
]
