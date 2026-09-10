'use client'

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { cn } from '@/lib/utils'

export type SignaturePadHandle = {
  isEmpty: () => boolean
  clear: () => void
  toBlob: () => Promise<Blob | null>
}

type SignaturePadProps = {
  className?: string
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
  { className },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const hasDrawnRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(ratio, ratio)
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#111827'
    }
  }, [])

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    drawingRef.current = true
    lastPointRef.current = getPoint(e)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !lastPointRef.current) return
    const point = getPoint(e)
    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true
      setIsEmpty(false)
    }
  }

  const stopDrawing = () => {
    drawingRef.current = false
    lastPointRef.current = null
  }

  useImperativeHandle(ref, () => ({
    isEmpty: () => !hasDrawnRef.current,
    clear: () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      hasDrawnRef.current = false
      setIsEmpty(true)
    },
    toBlob: () => {
      return new Promise((resolve) => {
        const canvas = canvasRef.current
        if (!canvas) return resolve(null)
        canvas.toBlob((blob) => resolve(blob), 'image/png')
      })
    },
  }))

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        className={cn(
          'w-full h-40 rounded-lg border-2 border-dashed border-border bg-muted/20 touch-none cursor-crosshair',
          className
        )}
      />
      {isEmpty && (
        <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground pointer-events-none">
          Dibuja tu firma aquí
        </p>
      )}
    </div>
  )
})
