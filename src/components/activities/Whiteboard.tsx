'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Eraser, Pen, Trash2, Undo } from 'lucide-react'
import { cn } from '@/lib/utils'

type Point = { x: number; y: number }
type Stroke = {
    points: Point[]
    color: string
    width: number
}

export default function Whiteboard({ roomId }: { roomId: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [color, setColor] = useState('#ffffff')
    const [width, setWidth] = useState(5)
    const [strokes, setStrokes] = useState<Stroke[]>([])
    const currentStroke = useRef<Stroke | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const resizeCanvas = () => {
            const parent = canvas.parentElement
            if (parent) {
                canvas.width = parent.clientWidth
                canvas.height = parent.clientHeight
                redraw(ctx, strokes)
            }
        }
        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)

        // Realtime subscription
        const channel = supabase.channel(`room:${roomId}`)
        channel
            .on('broadcast', { event: 'draw' }, ({ payload }) => {
                const newStroke = payload.stroke
                setStrokes((prev) => {
                    const updated = [...prev, newStroke]
                    redraw(ctx, updated)
                    return updated
                })
            })
            .on('broadcast', { event: 'clear' }, () => {
                setStrokes([])
                ctx.clearRect(0, 0, canvas.width, canvas.height)
            })
            .on('broadcast', { event: 'undo' }, () => {
                setStrokes((prev) => {
                    const newStrokes = prev.slice(0, -1)
                    redraw(ctx, newStrokes)
                    return newStrokes
                })
            })
            .subscribe()

        return () => {
            window.removeEventListener('resize', resizeCanvas)
            supabase.removeChannel(channel)
        }
    }, [roomId])

    const redraw = (ctx: CanvasRenderingContext2D, strokesToDraw: Stroke[]) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        strokesToDraw.forEach((stroke) => {
            if (stroke.points.length < 2) return
            ctx.beginPath()
            ctx.strokeStyle = stroke.color
            ctx.lineWidth = stroke.width
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
            }
            ctx.stroke()
        })
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
        const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top

        setIsDrawing(true)
        currentStroke.current = {
            points: [{ x, y }],
            color,
            width,
        }
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !currentStroke.current || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
        const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top

        currentStroke.current.points.push({ x, y })

        // Draw locally immediately
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.beginPath()
        const points = currentStroke.current.points
        if (points.length >= 2) {
            ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y)
            ctx.lineTo(x, y)
            ctx.stroke()
        }
    }

    const stopDrawing = async () => {
        if (!isDrawing || !currentStroke.current) return
        setIsDrawing(false)

        const newStroke = currentStroke.current
        setStrokes((prev) => [...prev, newStroke])
        currentStroke.current = null

        // Broadcast stroke
        await supabase.channel(`room:${roomId}`).send({
            type: 'broadcast',
            event: 'draw',
            payload: { stroke: newStroke },
        })
    }

    const clearCanvas = async () => {
        setStrokes([])
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
        await supabase.channel(`room:${roomId}`).send({
            type: 'broadcast',
            event: 'clear',
            payload: {},
        })
    }

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-4 py-2 rounded-full flex items-center gap-4 z-10">
                <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                    <button
                        onClick={() => setColor('#ffffff')}
                        className={cn("w-6 h-6 rounded-full border-2", color === '#ffffff' ? "border-primary" : "border-transparent")}
                        style={{ backgroundColor: '#ffffff' }}
                    />
                    <button
                        onClick={() => setColor('#ef4444')}
                        className={cn("w-6 h-6 rounded-full border-2", color === '#ef4444' ? "border-primary" : "border-transparent")}
                        style={{ backgroundColor: '#ef4444' }}
                    />
                    <button
                        onClick={() => setColor('#3b82f6')}
                        className={cn("w-6 h-6 rounded-full border-2", color === '#3b82f6' ? "border-primary" : "border-transparent")}
                        style={{ backgroundColor: '#3b82f6' }}
                    />
                    <button
                        onClick={() => setColor('#22c55e')}
                        className={cn("w-6 h-6 rounded-full border-2", color === '#22c55e' ? "border-primary" : "border-transparent")}
                        style={{ backgroundColor: '#22c55e' }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setWidth(5)}
                        className={cn("p-2 rounded-md hover:bg-white/10", width === 5 && "bg-white/10 text-primary")}
                    >
                        <Pen className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setWidth(20)}
                        className={cn("p-2 rounded-md hover:bg-white/10", width === 20 && "bg-white/10 text-primary")}
                    >
                        <Eraser className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => {
                            setStrokes((prev) => {
                                const newStrokes = prev.slice(0, -1)
                                const canvas = canvasRef.current
                                const ctx = canvas?.getContext('2d')
                                if (ctx) redraw(ctx, newStrokes)
                                // Broadcast undo
                                supabase.channel(`room:${roomId}`).send({
                                    type: 'broadcast',
                                    event: 'undo',
                                    payload: {},
                                })
                                return newStrokes
                            })
                        }}
                        className="p-2 rounded-md hover:bg-white/10"
                    >
                        <Undo className="h-4 w-4" />
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="p-2 rounded-md hover:bg-white/10 text-red-400"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="flex-1 touch-none cursor-crosshair"
            />
        </div>
    )
}
