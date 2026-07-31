import {
	Laptop,
	Monitor,
	Smartphone,
	Tablet,
	type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
	LAPTOP: Laptop,
	DESKTOP: Monitor,
	PHONE: Smartphone,
	TABLET: Tablet,
}

/**
 * Maps the backend's device_kind onto an icon. Falls back to a laptop for
 * UNKNOWN and for anything absent — the backend leaves the field null when a
 * client sent no metadata and its User-Agent was unparseable, and a generic
 * computer reads better there than an empty slot.
 */
export function deviceIcon(kind?: string): LucideIcon {
	if (!kind) return Laptop
	return icons[kind] ?? Laptop
}
