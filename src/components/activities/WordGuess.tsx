'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { WORD_LIST } from '@/lib/constants'
import { shuffle, cn } from '@/lib/utils'
import { RotateCcw } from 'lucide-react'

const WORD_LENGTH = 5
const MAX_GUESSES = 6

type LetterStatus = 'correct' | 'present' | 'absent' | 'empty' | 'active'

interface TileProps { letter: string; status: LetterStatus }

function Tile({ letter, status }: TileProps) {
  const colors: Record<LetterStatus, string> = {
    correct: 'bg-[#22c55e] border-[#22c55e] text-white',
    present: 'bg-[#f59e0b] border-[#f59e0b] text-white',
    absent:  'bg-[#374151] border-[#374151] text-white',
    active:  'border-[#7090b0] text-[#d4e4fa]',
    empty:   'border-white/10 text-[#d4e4fa]',
  }
  return (
    <div className={cn(
      'w-14 h-14 border-2 rounded-lg flex items-center justify-center text-2xl font-extrabold uppercase transition-all',
      colors[status]
    )}>
      {letter}
    </div>
  )
}

function getStatuses(guess: string, target: string): LetterStatus[] {
  const res: LetterStatus[] = Array(WORD_LENGTH).fill('absent')
  const used = Array(WORD_LENGTH).fill(false)
  // First pass: correct
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === target[i]) { res[i] = 'correct'; used[i] = true }
  }
  // Second pass: present
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (res[i] === 'correct') continue
    const idx = target.split('').findIndex((c, j) => c === guess[i] && !used[j])
    if (idx !== -1) { res[i] = 'present'; used[idx] = true }
  }
  return res
}

type GameState = { word: string; guesses: string[]; over: boolean; won: boolean }

export default function WordGuess({ roomId, onSystemMessage }: {
  roomId: string
  onSystemMessage: (text: string) => void
}) {
  const [game, setGame] = useState<GameState | null>(null)
  const [current, setCurrent] = useState('')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    const channel = supabase.channel(`wordguess:${roomId}`)
    channel
      .on('broadcast', { event: 'game_start' }, ({ payload }) => {
        setGame({ word: payload.word, guesses: [], over: false, won: false })
        setCurrent('')
      })
      .on('broadcast', { event: 'guess' }, ({ payload }) => {
        setGame(g => {
          if (!g) return g
          const newGuesses = [...g.guesses, payload.guess]
          const won = payload.guess === g.word
          const over = won || newGuesses.length >= MAX_GUESSES
          return { ...g, guesses: newGuesses, over, won }
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  const startGame = async () => {
    const wordList = shuffle(WORD_LIST)
    const word = wordList[0]
    await supabase.channel(`wordguess:${roomId}`).send({
      type: 'broadcast', event: 'game_start', payload: { word },
    })
  }

  const submitGuess = async () => {
    if (!game || current.length !== WORD_LENGTH || game.over) return
    if (!WORD_LIST.includes(current.toUpperCase())) {
      setShake(true); setTimeout(() => setShake(false), 500)
      return
    }
    await supabase.channel(`wordguess:${roomId}`).send({
      type: 'broadcast', event: 'guess', payload: { guess: current.toUpperCase() },
    })
    if (current.toUpperCase() === game.word) {
      onSystemMessage(`🟩 Word guessed: ${game.word}!`)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (!game || game.over) return
    if (e.key === 'Enter') { submitGuess(); return }
    if (e.key === 'Backspace') { setCurrent(c => c.slice(0, -1)); return }
    if (/^[a-zA-Z]$/.test(e.key) && current.length < WORD_LENGTH) {
      setCurrent(c => c + e.key.toUpperCase())
    }
  }

  const keyboardRows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','⌫'],
  ]

  const getKeyStatus = (key: string): LetterStatus => {
    if (!game) return 'empty'
    let best: string = 'empty'
    for (const g of game.guesses) {
      const statuses = getStatuses(g, game.word)
      const idx = g.indexOf(key)
      if (idx !== -1) {
        const s = statuses[idx]
        if (s === 'correct') return 'correct'
        if (s === 'present' && best !== 'correct') best = 'present'
        else if (s === 'absent' && best === 'empty') best = 'absent'
      }
    }
    return best as LetterStatus
  }

  return (
    <div
      className="flex flex-col h-full items-center justify-center gap-6 p-4 outline-none"
      tabIndex={0}
      onKeyDown={handleKey}
    >
      {!game ? (
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold text-[#d4e4fa]">Word Guess</p>
          <p className="text-[#7090b0]">Shared Wordle — everyone guesses together in {MAX_GUESSES} tries</p>
          <button onClick={startGame} className="btn-primary px-8">Start Game</button>
        </div>
      ) : (
        <>
          {/* Board */}
          <div className={cn('space-y-1.5', shake && 'animate-[shake_0.3s_ease]')}>
            {Array.from({ length: MAX_GUESSES }).map((_, row) => (
              <div key={row} className="flex gap-1.5 justify-center">
                {Array.from({ length: WORD_LENGTH }).map((_, col) => {
                  const guess = game.guesses[row]
                  const isCurrentRow = row === game.guesses.length
                  const letter = guess?.[col] ?? (isCurrentRow ? (current[col] ?? '') : '')
                  const status: LetterStatus = guess
                    ? getStatuses(guess, game.word)[col]
                    : isCurrentRow && current[col]
                      ? 'active'
                      : 'empty'
                  return <Tile key={col} letter={letter} status={status} />
                })}
              </div>
            ))}
          </div>

          {/* Result overlay */}
          {game.over && (
            <div className="glass-card-bright px-6 py-4 rounded-2xl text-center space-y-2 animate-slide-up">
              <p className="text-xl font-bold text-[#d4e4fa]">{game.won ? '🟩 Nailed it!' : 'Better luck next time'}</p>
              {!game.won && <p className="text-[#7090b0]">The word was <strong className="text-[#00f2ff]">{game.word}</strong></p>}
              <button onClick={startGame} className="btn-primary text-sm">
                <RotateCcw className="w-4 h-4" /> New Word
              </button>
            </div>
          )}

          {/* Keyboard */}
          {!game.over && (
            <div className="space-y-1.5 select-none">
              {keyboardRows.map((row, ri) => (
                <div key={ri} className="flex justify-center gap-1">
                  {row.map(k => {
                    const status = k.length === 1 ? getKeyStatus(k) : 'empty'
                    const isAction = k === 'ENTER' || k === '⌫'
                    return (
                      <button
                        key={k}
                        onClick={() => {
                          if (k === 'ENTER') submitGuess()
                          else if (k === '⌫') setCurrent(c => c.slice(0, -1))
                          else if (current.length < WORD_LENGTH) setCurrent(c => c + k)
                        }}
                        className={cn(
                          'h-12 rounded-lg font-bold text-sm transition-all',
                          isAction ? 'px-3 text-xs' : 'w-10',
                          status === 'correct' && 'bg-[#22c55e] text-white',
                          status === 'present' && 'bg-[#f59e0b] text-white',
                          status === 'absent'  && 'bg-[#374151] text-white',
                          status === 'empty'   && 'bg-white/10 text-[#d4e4fa] hover:bg-white/20',
                        )}
                      >
                        {k}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
