'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { userColor, displayName, cn } from '@/lib/utils'

type Board = (null | 'X' | 'O')[]
type PlayerSlot = { userId: string; email: string; mark: 'X' | 'O' }

const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

function checkWinner(b: Board): 'X' | 'O' | 'draw' | null {
  for (const [a,c,e] of LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[e]) return b[a] as 'X' | 'O'
  }
  if (b.every(Boolean)) return 'draw'
  return null
}

export default function TicTacToe({ roomId, currentUserId, currentUserEmail, onSystemMessage }: {
  roomId: string
  currentUserId: string
  currentUserEmail: string
  onSystemMessage: (text: string) => void
}) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [players, setPlayers] = useState<PlayerSlot[]>([])
  const [turn, setTurn] = useState<'X' | 'O'>('X')
  const [result, setResult] = useState<'X' | 'O' | 'draw' | null>(null)
  const [phase, setPhase] = useState<'waiting' | 'playing' | 'over'>('waiting')

  const mySlot = players.find(p => p.userId === currentUserId)
  const isMyTurn = mySlot?.mark === turn && phase === 'playing'

  useEffect(() => {
    const channel = supabase.channel(`tictactoe:${roomId}`)
    channel
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        setPlayers(prev => {
          if (prev.find(p => p.userId === payload.userId)) return prev
          if (prev.length >= 2) return prev
          const mark: 'X' | 'O' = prev.length === 0 ? 'X' : 'O'
          const next = [...prev, { ...payload, mark }]
          if (next.length === 2) setPhase('playing')
          return next
        })
      })
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        setBoard(b => {
          const next = [...b]
          next[payload.index] = payload.mark
          const res = checkWinner(next)
          if (res) {
            setResult(res)
            setPhase('over')
            const msg = res === 'draw' ? "It's a draw!" : `${payload.email} wins!`
            onSystemMessage(`✖️ ${msg}`)
          }
          return next
        })
        setTurn(t => t === 'X' ? 'O' : 'X')
      })
      .on('broadcast', { event: 'reset' }, () => {
        setBoard(Array(9).fill(null))
        setResult(null)
        setPhase('playing')
        setTurn('X')
      })
      .subscribe()

    // Join as player
    supabase.channel(`tictactoe:${roomId}`).send({
      type: 'broadcast', event: 'join',
      payload: { userId: currentUserId, email: currentUserEmail },
    })

    return () => { supabase.removeChannel(channel) }
  }, [roomId, currentUserId, currentUserEmail, onSystemMessage])

  const makeMove = async (idx: number) => {
    if (!isMyTurn || board[idx] || result) return
    await supabase.channel(`tictactoe:${roomId}`).send({
      type: 'broadcast', event: 'move',
      payload: { index: idx, mark: mySlot!.mark, email: displayName(currentUserEmail) },
    })
  }

  const resetGame = async () => {
    await supabase.channel(`tictactoe:${roomId}`).send({ type: 'broadcast', event: 'reset', payload: {} })
  }

  const winLine = (() => {
    for (const [a,c,e] of LINES) {
      if (board[a] && board[a] === board[c] && board[a] === board[e]) return [a,c,e]
    }
    return null
  })()

  return (
    <div className="flex flex-col h-full items-center justify-center gap-8 p-6">
      {/* Players */}
      <div className="flex items-center gap-8">
        {(['X', 'O'] as const).map(mark => {
          const p = players.find(pl => pl.mark === mark)
          const isActive = turn === mark && phase === 'playing'
          return (
            <div key={mark} className={cn('flex items-center gap-3 px-4 py-2 rounded-xl transition-all glass-card', isActive && 'border-[#00f2ff]/40')}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-[#010f1f]"
                style={{ background: p ? userColor(p.userId) : '#374151' }}>
                {p ? displayName(p.email).slice(0, 1).toUpperCase() : '?'}
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: mark === 'X' ? '#00f2ff' : '#bc13fe' }}>{mark}</p>
                <p className="text-xs text-[#7090b0]">{p ? displayName(p.email) : 'Waiting…'}</p>
              </div>
              {isActive && <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />}
            </div>
          )
        })}
      </div>

      {/* Board */}
      {phase !== 'waiting' && (
        <div className="grid grid-cols-3 gap-2">
          {board.map((cell, i) => {
            const inWinLine = winLine?.includes(i)
            return (
              <button
                key={i}
                onClick={() => makeMove(i)}
                disabled={!isMyTurn || !!cell || !!result}
                className={cn(
                  'w-24 h-24 rounded-xl glass-card flex items-center justify-center text-5xl font-extrabold transition-all',
                  isMyTurn && !cell && !result && 'hover:border-white/20 hover:bg-white/5 cursor-pointer',
                  inWinLine && 'border-[#22c55e]/60 bg-[#22c55e]/10',
                  !cell && !isMyTurn && 'cursor-default',
                )}
                style={{ color: cell === 'X' ? '#00f2ff' : '#bc13fe' }}
              >
                {cell}
              </button>
            )
          })}
        </div>
      )}

      {/* Status */}
      <div className="text-center space-y-3">
        {phase === 'waiting' && (
          <p className="text-[#7090b0]">Waiting for {2 - players.length} more player{players.length < 1 ? 's' : ''}…</p>
        )}
        {phase === 'playing' && !result && (
          <p className="text-[#d4e4fa]">
            {isMyTurn ? (
              <span className="text-gradient-cyan font-bold">Your turn!</span>
            ) : (
              <span className="text-[#7090b0]">Waiting for {players.find(p => p.mark === turn)?.email?.split('@')[0]}…</span>
            )}
          </p>
        )}
        {result && (
          <div className="space-y-3">
            <p className="text-2xl font-bold text-[#d4e4fa]">
              {result === 'draw' ? "🤝 Draw!" : `${players.find(p => p.mark === result)?.email?.split('@')[0]} wins!`}
            </p>
            <button onClick={resetGame} className="btn-primary">Play Again</button>
          </div>
        )}
        {phase === 'playing' && mySlot && (
          <p className="text-xs text-[#7090b0]">You are <strong style={{ color: mySlot.mark === 'X' ? '#00f2ff' : '#bc13fe' }}>{mySlot.mark}</strong></p>
        )}
        {!mySlot && phase !== 'waiting' && (
          <p className="badge-purple">Spectating</p>
        )}
      </div>
    </div>
  )
}
