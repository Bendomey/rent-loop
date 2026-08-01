import { Building2 } from 'lucide-react'
import { Pencil } from 'lucide-react'
import { PLACEHOLDER_ACCENT_COLOUR } from '../placeholder-data'
import {
	comingSoon,
	SettingsPanel,
	SettingsRow,
} from '~/components/blocks/settings-ui'
import { Button } from '~/components/ui/button'

/**
 * Branding has no API behind it yet — the Client model carries no logo or
 * accent colour, so both controls toast via comingSoon(). See
 * ../placeholder-data.ts.
 */
export function BrandingTab() {
	return (
		<div className="flex flex-col gap-5">
			<SettingsPanel caption="Logo">
				<div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
					<div className="bg-muted/50 flex size-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed">
						<Building2 className="text-muted-foreground/60 size-6" />
						<span className="text-muted-foreground/60 font-mono text-[9.5px] tracking-[0.04em] uppercase">
							No logo
						</span>
					</div>

					<div className="flex-1">
						<p className="text-muted-foreground max-w-md text-[15px] leading-relaxed">
							Appears on invoices, lease documents and the tenant portal. Square
							or wide, PNG or SVG, up to 2MB.
						</p>
						<div className="mt-3.5">
							<Button size="sm" onClick={comingSoon('Logo uploads')}>
								Upload logo
							</Button>
						</div>
					</div>
				</div>
			</SettingsPanel>

			<SettingsPanel caption="Accent colour" className="pb-1">
				<SettingsRow
					label="Document accent"
					sub="Used for headings and highlights on tenant-facing documents."
					value={
						<span className="inline-flex items-center gap-2.5">
							<span
								className="size-5.5 rounded-md border"
								style={{ backgroundColor: PLACEHOLDER_ACCENT_COLOUR }}
							/>
							<span className="font-mono text-sm">
								{PLACEHOLDER_ACCENT_COLOUR}
							</span>
						</span>
					}
					action={
						<Button
							variant="outline"
							size="sm"
							onClick={comingSoon('Document accent colours')}
						>
							<Pencil /> Change
						</Button>
					}
					last
				/>
			</SettingsPanel>
		</div>
	)
}
