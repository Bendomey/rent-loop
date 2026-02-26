import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export function dataUrlToBlob(dataUrl: string): Blob {
	const commaIndex = dataUrl.indexOf(',')
	const header = dataUrl.slice(0, commaIndex)
	const data = dataUrl.slice(commaIndex + 1)
	const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
	const binary = atob(data)
	const array = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i++) {
		array[i] = binary.charCodeAt(i)
	}
	return new Blob([array], { type: mime })
}
