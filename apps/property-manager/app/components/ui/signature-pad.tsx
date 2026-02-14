import { Eraser } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '~/components/ui/button'

interface SignaturePadProps {
	onSignatureChange: (hasSignature: boolean, dataUrl: string | null) => void
}

export function SignaturePad({ onSignatureChange }: SignaturePadProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [isDrawing, setIsDrawing] = useState(false)
	const [hasSignature, setHasSignature] = useState(false)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const rect = canvas.getBoundingClientRect()
		canvas.width = rect.width * window.devicePixelRatio
		canvas.height = rect.height * window.devicePixelRatio
		ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

		ctx.strokeStyle = '#1e293b'
		ctx.lineWidth = 2
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'
	}, [])

	const getPos = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			const canvas = canvasRef.current
			if (!canvas) return { x: 0, y: 0 }
			const rect = canvas.getBoundingClientRect()

			if ('touches' in e) {
				const touch = e.touches[0]
				if (!touch) return { x: 0, y: 0 }
				return {
					x: touch.clientX - rect.left,
					y: touch.clientY - rect.top,
				}
			}
			return {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			}
		},
		[],
	)

	const startDrawing = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			const ctx = canvasRef.current?.getContext('2d')
			if (!ctx) return
			const pos = getPos(e)
			ctx.beginPath()
			ctx.moveTo(pos.x, pos.y)
			setIsDrawing(true)
		},
		[getPos],
	)

	const draw = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			if (!isDrawing) return
			const ctx = canvasRef.current?.getContext('2d')
			if (!ctx) return
			const pos = getPos(e)
			ctx.lineTo(pos.x, pos.y)
			ctx.stroke()

			if (!hasSignature) {
				setHasSignature(true)
				onSignatureChange(true, null)
			}
		},
		[isDrawing, getPos, hasSignature, onSignatureChange],
	)

	const stopDrawing = useCallback(() => {
		if (!isDrawing) return
		setIsDrawing(false)
		const canvas = canvasRef.current
		if (canvas) {
			onSignatureChange(true, canvas.toDataURL('image/png'))
		}
	}, [isDrawing, onSignatureChange])

	const clear = useCallback(() => {
		const canvas = canvasRef.current
		const ctx = canvas?.getContext('2d')
		if (!canvas || !ctx) return
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		setHasSignature(false)
		onSignatureChange(false, null)
	}, [onSignatureChange])

	return (
		<div className="space-y-2">
			<div className="relative rounded-lg border-2 border-dashed border-zinc-300 bg-gray-50">
				<canvas
					ref={canvasRef}
					className="h-60 w-full cursor-crosshair touch-none"
					onMouseDown={startDrawing}
					onMouseMove={draw}
					onMouseUp={stopDrawing}
					onMouseLeave={stopDrawing}
					onTouchStart={startDrawing}
					onTouchMove={draw}
					onTouchEnd={stopDrawing}
				/>
				{!hasSignature && (
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<p className="text-sm text-zinc-400">
							Draw your signature here
						</p>
					</div>
				)}
			</div>
			<div className="flex justify-end">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={clear}
					disabled={!hasSignature}
				>
					<Eraser className="size-4" />
					Clear
				</Button>
			</div>
		</div>
	)
}
