'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { userColor, displayName, cn } from '@/lib/utils'

type Choice = 'rock' | 'paper' | 'scissors' | null
type PlayerSlot = { userId: string; email: string; index: 0 | 1 }

const ICONS: Record<NonNullable<Choice>, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
}

const SVG_ICONS: Record<NonNullable<Choice>, React.ReactNode> = {
  rock: (
    <svg viewBox="0 0 40 40" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="20" cy="20" r="14" />
      <path d="M14 22 Q20 12 26 22" />
    </svg>
  ),
  paper: (
    <svg viewBox="0 0 40 40" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="10" y="8" width="20" height="24" rx="3" />
      <path d="M14 14h12M14 19h12M14 24h8" />
    </svg>
  ),
  scissors: (
    <svg viewBox="0 0 40 40" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="13" cy="27" r="5" />
      <circle cx="27" cy="27" r="5" />
      <path d="M17 24 L20 13 L23 24" />
    </svg>
  ),
}

function getResult(a: Choice, b: Choice): 'win' | 'lose' | 'draw' | null {
  if (!a || !b) return null
  if (a === b) return 'draw'
  if ((a === 'rock' && b === 'scissors') || (a === 'scissors' && b === 'paper') || (a === 'paper' && b === 'rock')) return 'win'
  return 'lose'
}

export default function RPS({ roomId, currentUserId, currentUserEmail, onSystemMessage }: {
  roomId: string
  currentUserId: string
  currentUserEmail: string
  onSystemMessage: (text: string) => void
}) {
  const [players, setPlayers] = useState<PlayerSlot[]>([])
  const [choices, setChoices] = useState<[Choice, Choice]>([null, null])
  const [revealed, setRevealed] = useState(false)
  const [scores, setScores] = useState<[number, number]>([0, 0])
  const [round, setRound] = useState(1)
  const BEST_OF = 5

  const mySlot = players.find(p => p.userId === currentUserId)
  const myIdx = mySlot?.index ?? null
  const myChoice = myIdx !== null ? choices[myIdx] : null
  const theirIdx = myIdx === 0 ? 1 : 0
  const theirChoice = choices[theirIdx]

  useEffect(() => {
    const channel = supabase.channel(`rps:${roomId}`)
    channel
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        setPlayers(prev => {
          if (prev.find(p => p.userId === payload.userId)) return prev
          if (prev.length >= 2) return prev
          return [...prev, { ...payload, index: prev.length as 0 | 1 }]
        })
      })
      .on('broadcast', { event: 'choice' }, ({ payload }) => {
        setChoices(c => {
          const next: [Choice, Choice] = [...c] as [Choice, Choice]
          next[payload.index] = payload.choice
          // Both chosen → reveal
          if (next[0] && next[1]) {
            setTimeout(() => {
              setRevealed(true)
            }, 300)
          }
          return next
        })
      })
      .on('broadcast', { event: 'next_round' }, ({ payload }) => {
        setChoices([null, null])
        setRevealed(false)
        setRound(payload.round)
        setScores(payload.scores)
      })
      .on('broadcast', { event: 'reset' }, () => {
        setChoices([null, null])
        setRevealed(false)
        setRound(1)
        setScores([0, 0])
      })
      .subscribe()

    supabase.channel(`rps:${roomId}`).send({
      type: 'broadcast', event: 'join',
      payload: { userId: currentUserId, email: currentUserEmail },
    })

    return () => { supabase.removeChannel(channel) }
  }, [roomId, currentUserId, currentUserEmail])

  const makeChoice = async (choice: Choice) => {
    if (myIdx === null || myChoice) return
    await supabase.channel(`rps:${roomId}`).send({
      type: 'broadcast', event: 'choice',
      payload: { index: myIdx, choice },
    })
  }

  const nextRound = async () => {
    let newScores: [number, number] = [...scores] as [number, number]
    const res0 = getResult(choices[0], choices[1])
    if (res0 === 'win') newScores[0]++
    else if (res0 === 'lose') newScores[1]++

    const nextRound = round + 1
    if (newScores[0] > BEST_OF / 2 || newScores[1] > BEST_OF / 2 || nextRound > BEST_OF) {
      // Game over
      const winnerIdx = newScores[0] > newScores[1] ? 0 : newScores[1] > newScores[0] ? 1 : -1
      const winner = winnerIdx >= 0 ? players[winnerIdx] : null
      onSystemMessage(winner ? `✊ ${displayName(winner.email)} wins the match!` : `✊ Match ended in a draw!`)
      await supabase.channel(`rps:${roomId}`).send({
        type: 'broadcast', event: 'next_round',
        payload: { round: nextRound, scores: newScores },
      })
      return
    }

    await supabase.channel(`rps:${roomId}`).send({
      type: 'broadcast', event: 'next_round',
      payload: { round: nextRound, scores: newScores },
    })
  }

  const myResult = revealed && myIdx !== null ? getResult(choices[myIdx], choices[theirIdx]) : null

  return (
    <div className="flex flex-col h-full items-center justify-center gap-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-6">
        {players.map((p, i) => (
          <div key={p.userId} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-[#010f1f]"
              style={{ background: userColor(p.userId) }}>
              {displayName(p.email).slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-[#d4e4fa] capitalize">{displayName(p.email)}</p>
              <p className="text-lg font-bold text-[#00f2ff]">{scores[i]}</p>
            </div>
          </div>
        ))}
        {players.length === 2 && (
          <div className="text-center">
            <p className="text-xs text-[#7090b0]">Round {Math.min(round, BEST_OF)}/{BEST_OF}</p>
            <p className="text-sm font-bold text-[#d4e4fa]">Best of {BEST_OF}</p>
          </div>
        )}
      </div>

      {/* Reveal area */}
      {players.length === 2 && (
        <div className="flex items-center gap-8">
          {/* Player 0 choice */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-[#7090b0] capitalize">{displayName(players[0]?.email || '')}</p>
            <div className={cn(
              'w-24 h-24 rounded-2xl glass-card flex items-center justify-center transition-all',
              revealed && choices[0] && 'border-[#00f2ff]/40'
            )}>
              {revealed && choices[0] ? (
                <span className="text-5xl">{ICONS[choices[0]]}</span>
              ) : choices[0] ? (
                <span className="text-4xl">🤜</span>
              ) : (
                <span className="text-3xl text-[#7090b0]">?</span>
              )}
            </div>
          </div>

          <span className="text-2xl font-bold text-[#7090b0]">VS</span>

          {/* Player 1 choice */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-[#7090b0] capitalize">{displayName(players[1]?.email || '')}</p>
            <div className={cn(
              'w-24 h-24 rounded-2xl glass-card flex items-center justify-center transition-all',
              revealed && choices[1] && 'border-[#bc13fe]/40'
            )}>
              {revealed && choices[1] ? (
                <span className="text-5xl">{ICONS[choices[1]]}</span>
              ) : choices[1] ? (
                <span className="text-4xl scale-x-[-1] inline-block">🤜</span>
              ) : (
                <span className="text-3xl text-[#7090b0]">?</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {revealed && myResult && myIdx !== null && (
        <div className="glass-card-bright px-6 py-3 rounded-xl text-center animate-slide-up">
          <p className={cn('text-xl font-bold',
            myResult === 'win' ? 'text-[#22c55e]' :
            myResult === 'lose' ? 'text-[#ef4444]' :
            'text-[#f59e0b]'
          )}>
            {myResult === 'win' ? '🎉 You Win!' : myResult === 'lose' ? '😅 You Lose' : '🤝 Draw!'}
          </p>
          {round <= BEST_OF && myIdx === 0 && (
            <button onClick={nextRound} className="mt-3 btn-primary text-sm">Next Round</button>
          )}
        </div>
      )}

      {/* Choice buttons */}
      {!myChoice && myIdx !== null && players.length === 2 && (
        <div className="flex gap-4">
          {(['rock', 'paper', 'scissors'] as const).map(c => (
            <button
              key={c}
              onClick={() => makeChoice(c)}
              className="flex flex-col items-center gap-2 w-24 glass-card p-4 rounded-xl hover:border-[#00f2ff]/40 hover:bg-[#00f2ff]/5 transition-all group"
            >
              <span className="w-10 h-10 text-[#d4e4fa] group-hover:text-[#00f2ff] transition-colors">
                {SVG_ICONS[c]}
              </span>
              <span className="text-xs font-medium capitalize text-[#7090b0] group-hover:text-[#00f2ff] transition-colors">{c}</span>
            </button>
          ))}
        </div>
      )}

      {myChoice && !revealed && (
        <p className="text-[#7090b0] animate-pulse-slow">Waiting for other player…</p>
      )}

      {/* Waiting / spectating */}
      {players.length < 2 && (
        <p className="text-[#7090b0]">Waiting for opponent…</p>
      )}
      {!mySlot && players.length >= 2 && (
        <p className="badge-purple">Spectating</p>
      )}

      {/* Play again button (either player after game ends) */}
      {revealed && scores.some(s => s > BEST_OF / 2) && (
        <button onClick={() => supabase.channel(`rps:${roomId}`).send({ type: 'broadcast', event: 'reset', payload: {} })} className="btn-primary">
          Play Again
        </button>
      )}
    </div>
  )
}
