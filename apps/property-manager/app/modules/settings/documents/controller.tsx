import { useQueryClient } from '@tanstack/react-query'
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useNavigation } from 'react-router'
import { toast } from 'sonner'
import { ImportDocumentButton } from './components/import-document-button'
import { useCreateDocument } from '~/api/documents'
import { SearchInput } from '~/components/search'
import { Button } from '~/components/ui/button'
import { Field, FieldDescription } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemHeader,
	ItemTitle,
} from '~/components/ui/item'
import { Label } from '~/components/ui/label'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover'
import { Spinner } from '~/components/ui/spinner'
import { useDisclosure } from '~/hooks/use-disclosure'
import { QUERY_KEYS } from '~/lib/constants'

export type IDocumentTemplate = {
	id: string
	name: string
	charCount: number
	tags: Array<string>
	description: string
	document: SerializedEditorState<SerializedLexicalNode>
}

export const DocumentsController = ({
	documentTemplates,
}: {
	documentTemplates: Array<IDocumentTemplate>
}) => {
	return (
		<div className="flex w-full flex-col gap-2">
			<div className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4">
				<div className="flex items-center gap-2 text-sm">
					<SearchInput placeholder="Search documents..." />
				</div>
				<div className="flex items-center justify-end gap-2">
					<ImportDocumentButton />
					<AddDocumentButton documentTemplates={documentTemplates} />
				</div>
			</div>
		</div>
	)
}

export function AddDocumentButton({
	documentTemplates,
	property,
}: {
	documentTemplates: Array<IDocumentTemplate>
	property?: Property
}) {
	const [documentTitle, setDocumentTitle] = useState<string>('')
	const { mutate, isPending } = useCreateDocument()
	const { isOpened, onClose, setIsOpened } = useDisclosure()
	const [selectedTemplate, setSelectedTemplate] = useState<string>()
	const navigate = useNavigate()
	const { state } = useNavigation()
	const queryClient = useQueryClient()

	const docs = documentTemplates.map((docTemplate) => {
		let header = <></>
		if (docTemplate.id === 'empty') {
			header = <div className="h-24 w-full rounded-md bg-zinc-100" />
		} else if (docTemplate.id === 'basic-lease-agreement') {
			header = (
				<div className="flex h-24 w-full flex-col justify-center space-y-2 rounded-md bg-zinc-100 px-5">
					<div className="h-2 w-full bg-zinc-200" />
					<div className="h-2 w-full bg-zinc-200" />
					<div className="h-2 w-full bg-zinc-200" />
					<div className="h-2 w-full bg-zinc-200" />
				</div>
			)
		}

		return {
			...docTemplate,
			header,
		}
	})

	// TODO: later redirect them to /settings/documents/new with the selected template applied(or to select template screen)
	// and then set the name/type of document there before creating it. For now, we just create with default name as "Untitled Document"
	const handleSubmit = () => {
		if (!selectedTemplate) return

		const template = documentTemplates.find(
			(template) => template.id === selectedTemplate,
		)
		if (!template) {
			toast.error('Selected template not found.')
			return
		}

		const title = documentTitle.trim()
		mutate(
			{
				title: title.length ? title : `Untitled Document (${template.id})`,
				content: JSON.stringify(template.document),
				size: template.charCount,
				tags: template.tags,
				property_id: property?.id,
			},
			{
				onSuccess: (data) => {
					if (!data?.id) {
						toast.error('Failed to create document. Try again later.')
						return
					}

					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.DOCUMENTS],
					})

					if (property) {
						void navigate(
							`/properties/${property.id}/settings/documents/${data.id}`,
						)
						return
					}

					void navigate(`/settings/documents/${data.id}`)
				},
				onError: () => {
					toast.error(`Failed to create document. Try again later.`)
				},
			},
		)
	}

	const isLoading = state === 'loading' || state === 'submitting' || isPending

	return (
		<Popover open={isOpened} onOpenChange={setIsOpened}>
			<PopoverTrigger asChild>
				<Button
					variant="default"
					className="bg-rose-600 text-white hover:bg-rose-700"
				>
					<Plus className="size-4" />
					Add Document
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-full md:w-[50vw]">
				<div className="grid gap-4">
					<div className="space-y-2">
						<h4 className="leading-none font-medium">Add New Document</h4>
						<p className="text-muted-foreground text-sm">
							Choose from the templates below.
						</p>
					</div>
					<div className="py-3">
						<ItemGroup className="grid gap-4 md:grid-cols-2">
							{docs.map((docTemplate) => (
								<Item
									key={docTemplate.name}
									onClick={() => {
										setSelectedTemplate(docTemplate.id)
									}}
									className={`cursor-pointer ${selectedTemplate === docTemplate.id ? 'border-rose-400' : ''}`}
									variant="outline"
								>
									<ItemHeader>{docTemplate.header}</ItemHeader>
									<ItemContent>
										<ItemTitle>{docTemplate.name}</ItemTitle>
										<ItemDescription>{docTemplate.description}</ItemDescription>
									</ItemContent>
								</Item>
							))}
						</ItemGroup>
					</div>
					{selectedTemplate ? (
						<div>
							<Field>
								<Label>Document Title</Label>
								<Input
									value={documentTitle}
									onChange={(e) => setDocumentTitle(e.target.value)}
									placeholder={`Untitled Document (${selectedTemplate})`}
								/>
								<FieldDescription>Optional</FieldDescription>
							</Field>
						</div>
					) : null}
					<div className="flex items-center justify-end gap-x-2">
						<Button variant="ghost" size="sm" onClick={onClose}>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={handleSubmit}
							className="bg-rose-600 hover:bg-rose-700"
							disabled={!Boolean(selectedTemplate) || isLoading}
						>
							{isLoading ? <Spinner className="size-4" /> : null}
							Create Document
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
