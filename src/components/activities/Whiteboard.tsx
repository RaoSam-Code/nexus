'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Eraser, Trash2, Download, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLORS = ['#FFFFFF', '#00f2ff', '#bc13fe', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#f97316', '#ec4899', '#a0aec0', '#1a1a2e', '#000000']
const SIZES = [2, 5, 12, 24]

interface DrawEvent {
  x0: number; y0: number; x1: number; y1: number
  color: string; size: number
}

export default function Whiteboard({ roomId }: { roomId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [color, setColor] = useState('#FFFFFF')
  const [size, setSize] = useState(5)
  const [isEraser, setIsEraser] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Draw a segment on canvas
  const drawSegment = useCallback((ctx: CanvasRenderingContext2D, e: DrawEvent) => {
    ctx.beginPath()
    ctx.moveTo(e.x0, e.y0)
    ctx.lineTo(e.x1, e.y1)
    ctx.strokeStyle = e.color
    ctx.lineWidth = e.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Set canvas size to container
    const resize = () => {
      const { width, height } = canvas.parentElement!.getBoundingClientRect()
      // Preserve existing drawing
      const tmpCanvas = document.createElement('canvas')
      tmpCanvas.width = canvas.width
      tmpCanvas.height = canvas.height
      tmpCanvas.getContext('2d')!.drawImage(canvas, 0, 0)
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      // Dot grid background
      ctx.fillStyle = '#0a1628'
      ctx.fillRect(0, 0, width, height)
      for (let x = 20; x < width; x += 30) {
        for (let y = 20; y < height; y += 30) {
          ctx.fillStyle = 'rgba(255,255,255,0.06)'
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.drawImage(tmpCanvas, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const channel = supabase.channel(`whiteboard:${roomId}`)
    channel
      .on('broadcast', { event: 'draw' }, ({ payload }: { payload: DrawEvent }) => {
        const canvas = canvasRef.current
        if (!canvas) return
        drawSegment(canvas.getContext('2d')!, payload)
      })
      .on('broadcast', { event: 'clear' }, () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#0a1628'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        for (let x = 20; x < canvas.width; x += 30) {
          for (let y = 20; y < canvas.height; y += 30) {
            ctx.fillStyle = 'rgba(255,255,255,0.06)'
            ctx.beginPath()
            ctx.arc(x, y, 1, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, drawSegment])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onStart = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true)
    lastPos.current = getPos(e)
  }

  const onMove = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !lastPos.current) return
    const pos = getPos(e)
    const event: DrawEvent = {
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: pos.x,
      y1: pos.y,
      color: isEraser ? '#0a1628' : color,
      size: isEraser ? size * 3 : size,
    }
    drawSegment(canvasRef.current!.getContext('2d')!, event)
    lastPos.current = pos

    await supabase.channel(`whiteboard:${roomId}`).send({
      type: 'broadcast', event: 'draw', payload: event,
    })
  }

  const onEnd = () => { setDrawing(false); lastPos.current = null }

  const handleClear = async () => {
    await supabase.channel(`whiteboard:${roomId}`).send({
      type: 'broadcast', event: 'clear', payload: {},
    })
    // Also clear locally
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0a1628'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const handleExport = () => {
    const canvas = canvasRef.current!
    const link = document.createElement('a')
    link.download = `nexus-whiteboard-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="flex flex-col h-full relative select-none">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 cursor-crosshair touch-none"
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
      />

      {/* Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-card-bright px-4 py-2 flex items-center gap-3 rounded-full flex-wrap justify-center">
        {/* Colors */}
        <div className="flex items-center gap-1.5">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setIsEraser(false) }}
              className="rounded-full transition-transform hover:scale-110 flex-shrink-0"
              style={{
                width: color === c && !isEraser ? 22 : 18,
                height: color === c && !isEraser ? 22 : 18,
                background: c,
                border: color === c && !isEraser ? '2px solid #00f2ff' : '2px solid rgba(255,255,255,0.2)',
                boxShadow: color === c && !isEraser ? `0 0 8px ${c}80` : 'none',
              }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10" />

        {/* Brush sizes */}
        <div className="flex items-center gap-2">
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={cn(
                'rounded-full bg-white transition-all',
                size === s ? 'opacity-100 ring-2 ring-[#00f2ff]' : 'opacity-40 hover:opacity-70'
              )}
              style={{ width: Math.max(s / 1.5, 4), height: Math.max(s / 1.5, 4) }}
              aria-label={`Brush size ${s}`}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10" />

        {/* Tools */}
        <button
          onClick={() => setIsEraser(v => !v)}
          className={cn('btn-subtle px-3 py-1.5 text-xs', isEraser && 'border-[#00f2ff]/40 text-[#00f2ff]')}
        >
          <Eraser className="w-3.5 h-3.5" />
          Eraser
        </button>
        <button onClick={handleClear} className="btn-subtle px-3 py-1.5 text-xs">
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
        <button onClick={handleExport} className="btn-subtle px-3 py-1.5 text-xs">
          <Download className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
    </div>
  )
}
