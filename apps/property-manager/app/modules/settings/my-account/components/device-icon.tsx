import { Laptop, Smartphone, Tablet, type LucideIcon } from 'lucide-react'
import type { SessionKind } from '../placeholder-data'

const icons: Record<SessionKind, LucideIcon> = {
	laptop: Laptop,
	phone: Smartphone,
	tablet: Tablet,
}

export function deviceIcon(kind: SessionKind): LucideIcon {
	return icons[kind] ?? Laptop
}
