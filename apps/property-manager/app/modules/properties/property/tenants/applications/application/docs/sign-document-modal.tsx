import { Pen } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { SignaturePad } from '~/components/ui/signature-pad'

interface SignDocumentModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	documentTitle: string
	onSign: (signatureDataUrl: string) => void
}

export function SignDocumentModal({
	open,
	onOpenChange,
	documentTitle,
	onSign,
}: SignDocumentModalProps) {
	const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
	const [hasSignature, setHasSignature] = useState(false)

	const handleSignatureChange = useCallback(
		(hasSig: boolean, dataUrl: string | null) => {
			setHasSignature(hasSig)
			setSignatureDataUrl(dataUrl)
		},
		[],
	)

	const handleSign = () => {
		if (signatureDataUrl) {
			onSign(signatureDataUrl)
			onOpenChange(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Sign Document</DialogTitle>
					<DialogDescription>
						Add your signature to &ldquo;{documentTitle}&rdquo;. Draw
						your signature in the box below.
					</DialogDescription>
				</DialogHeader>

				<SignaturePad onSignatureChange={handleSignatureChange} />

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button disabled={!hasSignature} onClick={handleSign}>
						<Pen className="size-4" />
						Confirm Signature
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
