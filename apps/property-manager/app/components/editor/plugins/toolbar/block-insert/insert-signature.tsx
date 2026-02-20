import { PenLine } from 'lucide-react'

import { useToolbarContext } from '~/components/editor/context/toolbar-context'
import { InsertSignatureDialog } from '~/components/editor/plugins/signature-plugin'
import { SelectItem } from '~/components/ui/select'

export function InsertSignature() {
	const { activeEditor, showModal } = useToolbarContext()

	return (
		<SelectItem
			value="signature"
			onPointerUp={() => {
				showModal('Insert Signature Block', (onClose) => (
					<InsertSignatureDialog
						activeEditor={activeEditor}
						onClose={onClose}
					/>
				))
			}}
		>
			<div className="flex items-center gap-1">
				<PenLine className="size-4" />
				<span>Signature</span>
			</div>
		</SelectItem>
	)
}
