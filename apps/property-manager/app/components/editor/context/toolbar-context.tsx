import { type LexicalEditor } from 'lexical'
import { createContext, type JSX, useContext } from 'react'
import type { BlockType } from '../plugins/toolbar/block-format/block-format-data'

const Context = createContext<{
	activeEditor: LexicalEditor
	$updateToolbar: () => void
	blockType: BlockType
	setBlockType: (blockType: BlockType) => void
	showModal: (
		title: string,
		showModal: (onClose: () => void) => JSX.Element,
	) => void
}>({
	activeEditor: {} as LexicalEditor,
	$updateToolbar: () => {},
	blockType: 'paragraph',
	setBlockType: () => {},
	showModal: () => {},
})

export function ToolbarContext({
	activeEditor,
	$updateToolbar,
	blockType,
	setBlockType,
	showModal,
	children,
}: {
	activeEditor: LexicalEditor
	$updateToolbar: () => void
	blockType: BlockType
	setBlockType: (blockType: BlockType) => void
	showModal: (
		title: string,
		showModal: (onClose: () => void) => JSX.Element,
	) => void
	children: React.ReactNode
}) {
	return (
		<Context.Provider
			value={{
				activeEditor,
				$updateToolbar,
				blockType,
				setBlockType,
				showModal,
			}}
		>
			{children}
		</Context.Provider>
	)
}

export function useToolbarContext() {
	return useContext(Context)
}
