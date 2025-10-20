import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { COMMAND_PRIORITY_CRITICAL, SELECTION_CHANGE_COMMAND } from 'lexical'
import { useEffect, useState } from 'react'

import type { BlockType } from './block-format/block-format-data'
import { ToolbarContext } from '~/components/editor/context/toolbar-context'
import { useEditorModal } from '~/components/editor/editor-hooks/use-modal'

export function ToolbarPlugin({
	children,
}: {
	children: (props: { blockType: BlockType }) => React.ReactNode
}) {
	const [editor] = useLexicalComposerContext()

	const [activeEditor, setActiveEditor] = useState(editor)
	const [blockType, setBlockType] = useState<BlockType>('paragraph')

	const [modal, showModal] = useEditorModal()

	const $updateToolbar = () => {}

	useEffect(() => {
		return activeEditor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			(_payload, newEditor) => {
				setActiveEditor(newEditor)
				return false
			},
			COMMAND_PRIORITY_CRITICAL,
		)
	}, [activeEditor])

	return (
		<ToolbarContext
			activeEditor={activeEditor}
			$updateToolbar={$updateToolbar}
			blockType={blockType}
			setBlockType={setBlockType}
			showModal={showModal}
		>
			{modal}

			{children({ blockType })}
		</ToolbarContext>
	)
}
