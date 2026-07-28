'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/getUser'
import { PICTIONARY_WORDS } from '@/lib/constants'
import { shuffle } from '@/lib/utils'
import { Timer, Eraser, Trash2 } from 'lucide-react'

const COLORS = ['#FFFFFF', '#00f2ff', '#bc13fe', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#f97316']
const ROUND_SECONDS = 60
const ROUNDS = 5

type Phase = 'lobby' | 'drawing' | 'reveal' | 'done'

interface RoundState {
  word: string
  drawerId: string
  drawerEmail: string
  round: number
  guessed: boolean
  winner: string | null
}

interface DrawEvent { x0: number; y0: number; x1: number; y1: number; color: string; size: number }

export default function Pictionary({ roomId, currentUserId, currentUserEmail, onSystemMessage }: {
  roomId: string
  currentUserId: string
  currentUserEmail: string
  onSystemMessage: (text: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('lobby')
  const [round, setRound] = useState<RoundState | null>(null)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [guess, setGuess] = useState('')
  const [scores, setScores] = useState<Record<string, number>>({})
  const [roundNum, setRoundNum] = useState(0)
  const [words] = useState(() => shuffle(PICTIONARY_WORDS))
  const [drawing, setDrawing] = useState(false)
  const [color, setColor] = useState('#FFFFFF')
  const [brushSize, setBrushSize] = useState(5)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const isDrawer = round?.drawerId === currentUserId

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

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0a1628'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { width, height } = canvas.parentElement!.getBoundingClientRect()
    canvas.width = width
    canvas.height = height
    clearCanvas()
  }, [clearCanvas, phase])

  useEffect(() => {
    const channel = supabase.channel(`pictionary:${roomId}`)
    channel
      .on('broadcast', { event: 'round_start' }, ({ payload }) => {
        setRound(payload)
        setPhase('drawing')
        setTimeLeft(ROUND_SECONDS)
        setGuess('')
        clearCanvas()
        timerRef.current && clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
          setTimeLeft(t => {
            if (t <= 1) { clearInterval(timerRef.current!); setPhase('reveal'); return 0 }
            return t - 1
          })
        }, 1000)
      })
      .on('broadcast', { event: 'draw' }, ({ payload }: { payload: DrawEvent }) => {
        if (!canvasRef.current) return
        drawSegment(canvasRef.current.getContext('2d')!, payload)
      })
      .on('broadcast', { event: 'clear_canvas' }, clearCanvas)
      .on('broadcast', { event: 'guess_correct' }, ({ payload }) => {
        timerRef.current && clearInterval(timerRef.current)
        setRound(r => r ? { ...r, guessed: true, winner: payload.email } : r)
        setScores(s => ({ ...s, [payload.userId]: (s[payload.userId] || 0) + payload.points }))
        setPhase('reveal')
        onSystemMessage(`🎯 ${payload.email} guessed the word! (+${payload.points} pts)`)
      })
      .on('broadcast', { event: 'game_done' }, () => {
        setPhase('done')
        clearInterval(timerRef.current!)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel); clearInterval(timerRef.current!) }
  }, [roomId, clearCanvas, drawSegment, onSystemMessage])

  const startGame = async () => {
    const word = words[0]
    const roundState: RoundState = {
      word, drawerId: currentUserId, drawerEmail: currentUserEmail,
      round: 1, guessed: false, winner: null,
    }
    setRoundNum(1)
    await supabase.channel(`pictionary:${roomId}`).send({
      type: 'broadcast', event: 'round_start', payload: roundState,
    })
  }

  const nextRound = async () => {
    const next = roundNum + 1
    if (next > ROUNDS) {
      await supabase.channel(`pictionary:${roomId}`).send({ type: 'broadcast', event: 'game_done', payload: {} })
      return
    }
    setRoundNum(next)
    const word = words[next - 1]
    const roundState: RoundState = {
      word, drawerId: currentUserId, drawerEmail: currentUserEmail,
      round: next, guessed: false, winner: null,
    }
    await supabase.channel(`pictionary:${roomId}`).send({
      type: 'broadcast', event: 'round_start', payload: roundState,
    })
  }

  const submitGuess = async () => {
    if (!round || !guess.trim()) return
    if (guess.trim().toLowerCase() === round.word.toLowerCase()) {
      const points = Math.max(10, Math.floor(timeLeft * 1.5))
      await supabase.channel(`pictionary:${roomId}`).send({
        type: 'broadcast', event: 'guess_correct',
        payload: { userId: currentUserId, email: currentUserEmail, points },
      })
    }
    setGuess('')
  }

  // Drawing handlers
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const onStart = (e: React.MouseEvent | React.TouchEvent) => { if (!isDrawer) return; setDrawing(true); lastPos.current = getPos(e) }
  const onMove = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !lastPos.current || !isDrawer) return
    const pos = getPos(e)
    const event: DrawEvent = { x0: lastPos.current.x, y0: lastPos.current.y, x1: pos.x, y1: pos.y, color, size: brushSize }
    drawSegment(canvasRef.current!.getContext('2d')!, event)
    lastPos.current = pos
    await supabase.channel(`pictionary:${roomId}`).send({ type: 'broadcast', event: 'draw', payload: event })
  }
  const onEnd = () => { setDrawing(false); lastPos.current = null }

  const handleClearCanvas = async () => {
    clearCanvas()
    await supabase.channel(`pictionary:${roomId}`).send({ type: 'broadcast', event: 'clear_canvas', payload: {} })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      {phase !== 'lobby' && round && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/8 bg-[#010f1f]/60 flex-shrink-0">
          <span className="badge-purple">Round {round.round}/{ROUNDS}</span>
          <span className="text-sm text-[#d4e4fa]">
            {isDrawer ? `Draw: `  : `Guess what `}
            <strong style={{ color: '#00f2ff' }}>
              {isDrawer ? round.word : `${round.drawerEmail.split('@')[0]} is drawing`}
            </strong>
          </span>
          <div className="ml-auto flex items-center gap-2 text-sm font-mono">
            <Timer className="w-4 h-4 text-[#f59e0b]" />
            <span className={timeLeft <= 10 ? 'text-[#ef4444] font-bold' : 'text-[#d4e4fa]'}>{timeLeft}s</span>
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {phase === 'lobby' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <p className="text-2xl font-bold text-[#d4e4fa]">Pictionary</p>
              <p className="text-[#7090b0]">Draw a word in 60 seconds, room guesses via chat</p>
              <button onClick={startGame} className="btn-primary px-8">Start Game</button>
            </div>
          </div>
        )}

        {(phase === 'drawing' || phase === 'reveal') && (
          <>
            <canvas
              ref={canvasRef}
              className="flex-1 touch-none"
              style={{ cursor: isDrawer ? 'crosshair' : 'default' }}
              onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
              onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
            />
            {phase === 'reveal' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="glass-card-bright p-8 text-center space-y-4 rounded-2xl animate-slide-up">
                  <p className="text-2xl font-bold text-[#d4e4fa]">
                    {round?.guessed ? `🎯 Guessed!` : `Time's up!`}
                  </p>
                  <p className="text-[#7090b0]">The word was <strong className="text-[#00f2ff] text-xl">{round?.word}</strong></p>
                  {round?.winner && <p className="text-sm text-[#22c55e]">{round.winner} got it right!</p>}
                  <button onClick={nextRound} className="btn-primary">
                    {roundNum >= ROUNDS ? 'See Results' : 'Next Round →'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {phase === 'done' && (
          <div className="flex items-center justify-center h-full">
            <div className="glass-card p-8 text-center space-y-6 max-w-sm w-full">
              <p className="text-2xl font-bold text-[#d4e4fa]">Game Over!</p>
              <div className="space-y-2">
                {Object.entries(scores).sort(([,a],[,b]) => b - a).map(([uid, pts], i) => (
                  <div key={uid} className="flex items-center justify-between px-4 py-2 glass-card rounded-lg">
                    <span className="text-sm text-[#7090b0]">#{i + 1}</span>
                    <span className="font-bold text-[#d4e4fa]">{uid.slice(0, 8)}</span>
                    <span className="badge-cyan">{pts} pts</span>
                  </div>
                ))}
              </div>
              <button onClick={startGame} className="btn-primary w-full">Play Again</button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer toolbar */}
      {phase === 'drawing' && isDrawer && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-card-bright px-4 py-2 flex items-center gap-3 rounded-full">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className="rounded-full transition-transform hover:scale-110"
              style={{ width: color === c ? 22 : 18, height: color === c ? 22 : 18, background: c, border: color === c ? '2px solid #00f2ff' : '2px solid rgba(255,255,255,0.2)' }} />
          ))}
          <div className="w-px h-5 bg-white/10" />
          <button onClick={handleClearCanvas} className="btn-subtle px-3 py-1.5 text-xs">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      )}

      {/* Guesser input */}
      {phase === 'drawing' && !isDrawer && !round?.guessed && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 w-80">
          <input
            value={guess}
            onChange={e => setGuess(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitGuess() }}
            placeholder="Type your guess…"
            className="input-nexus flex-1 text-sm"
          />
          <button onClick={submitGuess} className="btn-primary px-4 text-sm">Guess</button>
        </div>
      )}
    </div>
  )
}
