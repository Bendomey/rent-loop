import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ImportDocumentButton } from './components/import-document-button'
import { Button } from '~/components/ui/button'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '~/components/ui/input-group'
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemHeader,
	ItemTitle,
} from '~/components/ui/item'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover'
import { useDisclosure } from '~/hooks/use-disclosure'

type IDocumentTemplate = {
	id: string
	name: string
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
					<InputGroup>
						<InputGroupInput placeholder="Search documents ..." />
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>
				</div>
				<div className="flex items-center justify-end gap-2">
					<ImportDocumentButton />
					<AddDocumentButton documentTemplates={documentTemplates} />
				</div>
			</div>
		</div>
	)
}

function AddDocumentButton({
	documentTemplates,
}: {
	documentTemplates: Array<IDocumentTemplate>
}) {
	const { isOpened, onClose, setIsOpened } = useDisclosure()
	const [selectedTemplate, setSelectedTemplate] = useState<string>()
	const navigate = useNavigate()

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
					<div className="flex items-center justify-end gap-x-2">
						<Button variant="ghost" size="sm" onClick={onClose}>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={() => {
								// TODO: later redirect them to /settings/documents/new with the selected template applied(or to select template screen)
								// and then set the name/type of document there before creating it. For now, we just create with default name as "Untitled Document"
								void navigate(`/settings/documents/${selectedTemplate}`)
							}}
							className="bg-rose-600 hover:bg-rose-700"
							disabled={!Boolean(selectedTemplate)}
						>
							Create Document
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
