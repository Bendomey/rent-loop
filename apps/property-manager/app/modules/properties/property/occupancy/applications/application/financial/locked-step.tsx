import { Info, Lock } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '~/components/ui/card'

interface LockedStepProps {
	/** The step's position — the same number the live card shows. */
	step: number
	title: string
	/** What has to happen before this step opens. */
	hint: string
}

/**
 * A step that exists but cannot be worked on yet.
 *
 * The four steps are a fixed sequence, so hiding the ones that aren't ready
 * makes the page look like it has fewer steps than it does and moves the
 * numbers around as each unlocks. This keeps 1–4 on screen from the first
 * visit and says why each is shut.
 */
export function LockedStep({ step, title, hint }: LockedStepProps) {
	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle className="text-muted-foreground flex items-center gap-2 text-lg">
					<span className="bg-muted flex size-7 items-center justify-center rounded-full font-mono text-xs font-bold">
						{step}
					</span>
					{title}
					<Lock className="size-3.5" />
				</CardTitle>
				<p className="text-muted-foreground mt-1 flex items-start gap-1.5 text-sm">
					<Info className="mt-0.5 size-3.5 shrink-0" />
					{hint}
				</p>
			</CardHeader>
		</Card>
	)
}
