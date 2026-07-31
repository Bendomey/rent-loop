import { Camera } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'

interface Props {
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
}

/**
 * UI only — profile photo uploads are not wired to the API yet.
 */
export default function UploadPhotoModal({ opened, setOpened }: Props) {
	return (
		<Dialog open={opened} onOpenChange={setOpened}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<div className="bg-muted mb-2 flex size-12 items-center justify-center rounded-xl">
						<Camera className="size-5" />
					</div>
					<DialogTitle>Upload a profile photo</DialogTitle>
					<DialogDescription>
						A square image works best — it&rsquo;s cropped to a circle
						everywhere it appears.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center gap-5 sm:flex-row">
					<div className="text-muted-foreground flex size-26 shrink-0 flex-col items-center justify-center gap-1.5 rounded-full border border-dashed">
						<Camera className="size-5" />
						<span className="font-mono text-[9.5px] tracking-wide uppercase">
							Preview
						</span>
					</div>

					<div className="flex-1 rounded-xl border border-dashed px-5 py-6 text-center">
						<div className="text-sm font-semibold">Drop an image here</div>
						<div className="text-muted-foreground mt-1 text-[13px]">
							JPG or PNG · min 200×200px · up to 2MB
						</div>
						<Button variant="outline" size="sm" className="mt-3.5">
							Choose file
						</Button>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpened(false)}>
						Cancel
					</Button>
					<Button onClick={() => setOpened(false)}>Save photo</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
