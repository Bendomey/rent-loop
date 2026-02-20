import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
import { ArrowLeft, PencilLine, Save } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useUpdateDocument } from '~/api/documents'
import { Button } from '~/components/ui/button'
import { TypographyMuted } from '~/components/ui/typography'

export function MenuBar({ document }: { document: RentloopDocument }) {
	const navigate = useNavigate()
	const [editor] = useLexicalComposerContext()
	const updateDocument = useUpdateDocument()
	const savedContentRef = useRef(document.content)
	const isFirstUpdateRef = useRef(true)
	const [hasChanges, setHasChanges] = useState(false)

	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			const currentContent = JSON.stringify(editorState.toJSON())

			if (isFirstUpdateRef.current) {
				savedContentRef.current = currentContent
				isFirstUpdateRef.current = false
				return
			}

			setHasChanges(currentContent !== savedContentRef.current)
		})
	}, [editor])

	const handleSave = () => {
		const editorState = editor.getEditorState()
		const content = JSON.stringify(editorState.toJSON())
		const charCount = editorState.read(() => $getRoot().getTextContent().length)

		updateDocument.mutate(
			{ id: document.id, content, size: charCount },
			{
				onSuccess: () => {
					savedContentRef.current = content
					setHasChanges(false)
					toast.success('Document saved')
				},
				onError: (error) => {
					toast.error('Failed to save', { description: error.message })
				},
			},
		)
	}

	const handleDiscard = () => {
		const saved = savedContentRef.current
		if (saved) {
			const restoredState = editor.parseEditorState(saved)
			editor.setEditorState(restoredState)
		}
		setHasChanges(false)
	}

	return (
		<div className="flex flex-col justify-between gap-2 border-b py-3 md:flex-row md:items-center md:px-3">
			<div className="flex items-center space-x-2">
				<Button onClick={() => navigate(-1)} size="sm" variant="ghost">
					<ArrowLeft />
				</Button>
				<h1 className="font-medium">{document.title}</h1>
				<Button size="sm" variant="ghost">
					<PencilLine />
				</Button>
			</div>
			<div>{hasChanges && <TypographyMuted>Changes Made</TypographyMuted>}</div>
			<div className="flex items-center space-x-2">
				{hasChanges && (
					<Button
						size="sm"
						variant="ghost"
						className="text-xs"
						onClick={handleDiscard}
					>
						Discard
					</Button>
				)}
				<Button
					size="sm"
					className="bg-rose-600 text-xs hover:bg-rose-800"
					disabled={!hasChanges || updateDocument.isPending}
					onClick={handleSave}
				>
					<Save className="size-3" />
					{updateDocument.isPending ? 'Saving...' : 'Save Document'}
				</Button>
			</div>
		</div>
	)
}
