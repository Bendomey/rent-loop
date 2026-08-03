import { Building2, Pencil } from 'lucide-react'
import { PLACEHOLDER_ACCENT_COLOUR } from '../placeholder-data'
import {
	comingSoon,
	SettingsPanel,
	SettingsRow,
} from '~/components/blocks/settings-ui'
import { Button } from '~/components/ui/button'

interface Props {
	client: Client
	onEdit: () => void
}

/**
 * The logo is editable through the company details dialog, while the accent
 * colour remains a placeholder until that feature is released.
 */
export function BrandingTab({ client, onEdit }: Props) {
	const hasLogo = Boolean(client.logo_url)

	return (
		<div className="flex flex-col gap-5">
			<SettingsPanel caption="Logo">
				<div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
					<div className="bg-muted/50 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed">
						{hasLogo ? (
							<img
								alt={`${client.name || 'Company'} logo`}
								className="h-full w-full object-contain p-2"
								src={client.logo_url || undefined}
							/>
						) : (
							<div className="flex flex-col items-center justify-center gap-1.5">
								<Building2 className="text-muted-foreground/60 size-6" />
								<span className="text-muted-foreground/60 font-mono text-[9.5px] tracking-[0.04em] uppercase">
									No logo
								</span>
							</div>
						)}
					</div>

					<div className="flex-1">
						<p className="text-muted-foreground max-w-md text-[15px] leading-relaxed">
							Appears on invoices, lease documents and the tenant portal. Square
							or wide, PNG or SVG, up to 2MB.
						</p>
						<div className="mt-3.5">
							<Button size="sm" onClick={onEdit}>
								{hasLogo ? 'Change logo' : 'Upload logo'}
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
