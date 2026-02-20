import { PenLine } from 'lucide-react'

import { ComponentPickerOption } from '~/components/editor/plugins/picker/component-picker-option'
import { InsertSignatureDialog } from '~/components/editor/plugins/signature-plugin'

export function SignaturePickerPlugin() {
	return new ComponentPickerOption('Signature', {
		icon: <PenLine className="size-4" />,
		keywords: ['signature', 'sign', 'autograph', 'witness'],
		onSelect: (_, editor, showModal) =>
			showModal('Insert Signature Block', (onClose) => (
				<InsertSignatureDialog activeEditor={editor} onClose={onClose} />
			)),
	})
}
