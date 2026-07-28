'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { userColor, displayName, cn } from '@/lib/utils'

// Chess piece types
type Piece = { type: string; color: 'w' | 'b' }
type Square = Piece | null
type Board = Square[][]

// Initial board setup
function initBoard(): Board {
  const empty = () => Array(8).fill(null).map(() => null as Square)
  const board: Board = Array(8).fill(null).map(empty)
  const backRank = ['R','N','B','Q','K','B','N','R']
  backRank.forEach((t, i) => {
    board[0][i] = { type: t, color: 'b' }
    board[7][i] = { type: t, color: 'w' }
  })
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: 'P', color: 'b' }
    board[6][i] = { type: 'P', color: 'w' }
  }
  return board
}

const PIECE_UNICODE: Record<string, Record<'w'|'b', string>> = {
  K: { w: '♔', b: '♚' }, Q: { w: '♕', b: '♛' },
  R: { w: '♖', b: '♜' }, B: { w: '♗', b: '♝' },
  N: { w: '♘', b: '♞' }, P: { w: '♙', b: '♟' },
}

export default function Chess({ roomId, currentUserId, currentUserEmail, onSystemMessage }: {
  roomId: string
  currentUserId: string
  currentUserEmail: string
  onSystemMessage: (text: string) => void
}) {
  const [board, setBoard] = useState<Board>(initBoard())
  const [players, setPlayers] = useState<Record<'w'|'b', { userId: string; email: string } | null>>({ w: null, b: null })
  const [turn, setTurn] = useState<'w' | 'b'>('w')
  const [selected, setSelected] = useState<[number,number] | null>(null)
  const [phase, setPhase] = useState<'waiting' | 'playing' | 'over'>('waiting')
  const [result, setResult] = useState<string | null>(null)
  const [captured, setCaptured] = useState<{ w: string[]; b: string[] }>({ w: [], b: [] })

  const myColor = players.w?.userId === currentUserId ? 'w' : players.b?.userId === currentUserId ? 'b' : null
  const isMyTurn = myColor === turn && phase === 'playing'

  useEffect(() => {
    const channel = supabase.channel(`chess:${roomId}`)
    channel
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        setPlayers(prev => {
          if (prev.w?.userId === payload.userId || prev.b?.userId === payload.userId) return prev
          if (!prev.w) return { ...prev, w: { userId: payload.userId, email: payload.email } }
          if (!prev.b) {
            const next = { ...prev, b: { userId: payload.userId, email: payload.email } }
            setPhase('playing')
            return next
          }
          return prev
        })
      })
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        const { from, to, newBoard, capturedPiece, promotion } = payload
        setBoard(newBoard)
        setTurn(t => t === 'w' ? 'b' : 'w')
        if (capturedPiece) {
          setCaptured(c => ({
            ...c,
            [capturedPiece.color === 'w' ? 'b' : 'w']: [...c[capturedPiece.color === 'w' ? 'b' : 'w'], capturedPiece.type]
          }))
        }
        setSelected(null)
      })
      .on('broadcast', { event: 'resign' }, ({ payload }) => {
        setPhase('over')
        setResult(`${payload.email} resigned`)
        onSystemMessage(`♟️ ${payload.email} resigned`)
      })
      .on('broadcast', { event: 'reset' }, () => {
        setBoard(initBoard())
        setTurn('w')
        setSelected(null)
        setResult(null)
        setCaptured({ w: [], b: [] })
        setPhase('playing')
      })
      .subscribe()

    supabase.channel(`chess:${roomId}`).send({
      type: 'broadcast', event: 'join',
      payload: { userId: currentUserId, email: currentUserEmail },
    })

    return () => { supabase.removeChannel(channel) }
  }, [roomId, currentUserId, currentUserEmail, onSystemMessage])

  const isLegalMove = (board: Board, from: [number,number], to: [number,number], color: 'w'|'b'): boolean => {
    const [fr, fc] = from; const [tr, tc] = to
    const piece = board[fr][fc]
    if (!piece || piece.color !== color) return false
    const target = board[tr][tc]
    if (target?.color === color) return false

    const dr = tr - fr; const dc = tc - fc

    switch (piece.type) {
      case 'P': {
        const dir = color === 'w' ? -1 : 1
        const startRow = color === 'w' ? 6 : 1
        if (dc === 0 && dr === dir && !target) return true
        if (dc === 0 && dr === 2 * dir && fr === startRow && !board[fr + dir][fc] && !target) return true
        if (Math.abs(dc) === 1 && dr === dir && target) return true
        return false
      }
      case 'N': return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2)
      case 'B': {
        if (Math.abs(dr) !== Math.abs(dc)) return false
        const sr = Math.sign(dr); const sc = Math.sign(dc)
        for (let i = 1; i < Math.abs(dr); i++) {
          if (board[fr + i * sr][fc + i * sc]) return false
        }
        return true
      }
      case 'R': {
        if (dr !== 0 && dc !== 0) return false
        const sr = Math.sign(dr); const sc = Math.sign(dc)
        const steps = Math.max(Math.abs(dr), Math.abs(dc))
        for (let i = 1; i < steps; i++) {
          if (board[fr + i * sr][fc + i * sc]) return false
        }
        return true
      }
      case 'Q': {
        const isBishop = Math.abs(dr) === Math.abs(dc)
        const isRook = dr === 0 || dc === 0
        if (!isBishop && !isRook) return false
        const sr = Math.sign(dr); const sc = Math.sign(dc)
        const steps = Math.max(Math.abs(dr), Math.abs(dc))
        for (let i = 1; i < steps; i++) {
          if (board[fr + i * sr][fc + i * sc]) return false
        }
        return true
      }
      case 'K': return Math.abs(dr) <= 1 && Math.abs(dc) <= 1
      default: return false
    }
  }

  const handleSquareClick = async (row: number, col: number) => {
    if (!isMyTurn) return

    if (!selected) {
      if (board[row][col]?.color === myColor) setSelected([row, col])
      return
    }

    const [fr, fc] = selected
    if (fr === row && fc === col) { setSelected(null); return }

    if (!isLegalMove(board, selected, [row, col], myColor!)) {
      if (board[row][col]?.color === myColor) setSelected([row, col])
      else setSelected(null)
      return
    }

    // Apply move
    const newBoard = board.map(r => r.map(c => c ? { ...c } : null)) as Board
    const capturedPiece = newBoard[row][col]
    newBoard[row][col] = newBoard[fr][fc]
    newBoard[fr][fc] = null

    // Pawn promotion
    if (newBoard[row][col]?.type === 'P' && (row === 0 || row === 7)) {
      newBoard[row][col]!.type = 'Q'
    }

    await supabase.channel(`chess:${roomId}`).send({
      type: 'broadcast', event: 'move',
      payload: { from: selected, to: [row, col], newBoard, capturedPiece },
    })
  }

  const resign = async () => {
    await supabase.channel(`chess:${roomId}`).send({
      type: 'broadcast', event: 'resign',
      payload: { email: displayName(currentUserEmail) },
    })
    setPhase('over')
    setResult('You resigned')
  }

  const isFlipped = myColor === 'b'
  const displayBoard = isFlipped ? [...board].reverse().map(r => [...r].reverse()) : board

  return (
    <div className="flex flex-col h-full items-center justify-center gap-4 p-4">
      {/* Players row */}
      <div className="flex items-center gap-6">
        {(['w','b'] as const).map(color => {
          const p = players[color]
          const isActive = turn === color && phase === 'playing'
          return (
            <div key={color} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg glass-card transition-all', isActive && 'border-[#00f2ff]/40')}>
              <span className="text-2xl">{color === 'w' ? '♔' : '♚'}</span>
              <div>
                <p className="text-xs font-medium text-[#d4e4fa]">{p ? displayName(p.email) : 'Waiting…'}</p>
                <p className="text-[10px] text-[#7090b0] capitalize">{color === 'w' ? 'White' : 'Black'}</p>
              </div>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />}
            </div>
          )
        })}
        {myColor && phase === 'playing' && (
          <button onClick={resign} className="btn-subtle text-xs px-3 py-1.5">Resign</button>
        )}
      </div>

      {/* Board */}
      {phase === 'waiting' ? (
        <p className="text-[#7090b0]">Waiting for {Object.values(players).filter(Boolean).length === 0 ? 'players' : 'another player'}…</p>
      ) : (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          {displayBoard.map((row, ri) => (
            <div key={ri} className="flex">
              {row.map((piece, ci) => {
                const actualRow = isFlipped ? 7 - ri : ri
                const actualCol = isFlipped ? 7 - ci : ci
                const isDark = (actualRow + actualCol) % 2 === 1
                const isSelected = selected?.[0] === actualRow && selected?.[1] === actualCol
                const isLegal = selected ? isLegalMove(board, selected, [actualRow, actualCol], myColor!) : false

                return (
                  <button
                    key={ci}
                    onClick={() => handleSquareClick(actualRow, actualCol)}
                    className={cn(
                      'w-12 h-12 flex items-center justify-center text-2xl transition-all relative',
                      isDark ? 'bg-[#0c1c34]' : 'bg-[#1a2f50]',
                      isSelected && 'bg-[#00f2ff]/20',
                      isLegal && '!bg-[#22c55e]/20',
                      isMyTurn && !selected && piece?.color === myColor && 'hover:bg-white/10 cursor-pointer',
                      isMyTurn && selected && 'cursor-pointer',
                    )}
                  >
                    {piece && (
                      <span
                        className="select-none"
                        style={{ color: piece.color === 'w' ? '#ffffff' : '#00f2ff', textShadow: '0 0 8px rgba(0,0,0,0.8)' }}
                      >
                        {PIECE_UNICODE[piece.type][piece.color]}
                      </span>
                    )}
                    {isLegal && !piece && (
                      <span className="w-3 h-3 rounded-full bg-[#22c55e]/60 absolute" />
                    )}
                    {isLegal && piece && (
                      <span className="absolute inset-0 rounded-full border-4 border-[#22c55e]/60" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Status / result */}
      {result && (
        <div className="glass-card-bright px-6 py-4 text-center space-y-3 rounded-xl animate-slide-up">
          <p className="font-bold text-[#d4e4fa]">{result}</p>
          <button onClick={() => supabase.channel(`chess:${roomId}`).send({ type: 'broadcast', event: 'reset', payload: {} })} className="btn-primary text-sm">
            New Game
          </button>
        </div>
      )}

      {!myColor && phase !== 'waiting' && <p className="badge-purple">Spectating</p>}
    </div>
  )
}
