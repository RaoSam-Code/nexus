'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { TRIVIA_QUESTIONS } from '@/lib/constants'
import { shuffle, userColor, displayName, cn } from '@/lib/utils'
import { Timer, Trophy, CheckCircle2, XCircle } from 'lucide-react'

const SECONDS_PER_Q = 15
const QUESTIONS_COUNT = 10

type Phase = 'lobby' | 'question' | 'answer' | 'done'

export default function Trivia({ roomId, currentUserId, currentUserEmail, onSystemMessage }: {
  roomId: string
  currentUserId: string
  currentUserEmail: string
  onSystemMessage: (text: string) => void
}) {
  const [phase, setPhase] = useState<Phase>('lobby')
  const [questions] = useState(() => shuffle(TRIVIA_QUESTIONS).slice(0, QUESTIONS_COUNT))
  const [qIndex, setQIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_Q)
  const [chosen, setChosen] = useState<number | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({})
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const q = questions[qIndex]

  useEffect(() => {
    const channel = supabase.channel(`trivia:${roomId}`)
    channel
      .on('broadcast', { event: 'question' }, ({ payload }) => {
        setQIndex(payload.index)
        setPhase('question')
        setChosen(null)
        setTimeLeft(SECONDS_PER_Q)
        timerRef.current && clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
          setTimeLeft(t => {
            if (t <= 1) {
              clearInterval(timerRef.current!)
              supabase.channel(`trivia:${roomId}`).send({ type: 'broadcast', event: 'reveal_answer', payload: { index: payload.index } })
              return 0
            }
            return t - 1
          })
        }, 1000)
      })
      .on('broadcast', { event: 'reveal_answer' }, () => {
        timerRef.current && clearInterval(timerRef.current)
        setPhase('answer')
      })
      .on('broadcast', { event: 'submit_answer' }, ({ payload }) => {
        if (payload.correct) {
          setScores(s => ({ ...s, [payload.userId]: (s[payload.userId] || 0) + payload.points }))
          setPlayerNames(n => ({ ...n, [payload.userId]: payload.email }))
        }
      })
      .on('broadcast', { event: 'game_done' }, () => {
        setPhase('done')
        clearInterval(timerRef.current!)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel); clearInterval(timerRef.current!) }
  }, [roomId])

  const startGame = async () => {
    setScores({})
    await supabase.channel(`trivia:${roomId}`).send({
      type: 'broadcast', event: 'question', payload: { index: 0 },
    })
  }

  const answer = async (optionIdx: number) => {
    if (chosen !== null) return
    setChosen(optionIdx)
    const correct = optionIdx === q.answer
    const points = correct ? Math.ceil(timeLeft / SECONDS_PER_Q * 100) : 0
    if (correct) onSystemMessage(`✅ ${displayName(currentUserEmail)} answered correctly! (+${points} pts)`)
    await supabase.channel(`trivia:${roomId}`).send({
      type: 'broadcast', event: 'submit_answer',
      payload: { userId: currentUserId, email: displayName(currentUserEmail), correct, points },
    })
  }

  const nextQuestion = async () => {
    const next = qIndex + 1
    if (next >= QUESTIONS_COUNT) {
      await supabase.channel(`trivia:${roomId}`).send({ type: 'broadcast', event: 'game_done', payload: {} })
    } else {
      await supabase.channel(`trivia:${roomId}`).send({
        type: 'broadcast', event: 'question', payload: { index: next },
      })
    }
  }

  const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a)

  return (
    <div className="flex h-full">
      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {phase === 'lobby' && (
          <div className="text-center space-y-4">
            <p className="text-2xl font-bold text-[#d4e4fa]">Trivia</p>
            <p className="text-[#7090b0]">{QUESTIONS_COUNT} questions · 15 seconds each · fastest answer scores most</p>
            <button onClick={startGame} className="btn-primary px-8">Start Trivia</button>
          </div>
        )}

        {(phase === 'question' || phase === 'answer') && (
          <div className="w-full max-w-2xl space-y-6 animate-slide-up">
            {/* Progress & timer */}
            <div className="flex items-center justify-between">
              <span className="badge-cyan">Q{qIndex + 1}/{QUESTIONS_COUNT}</span>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#f59e0b]" />
                <span className={cn('font-bold font-mono text-lg', timeLeft <= 5 ? 'text-[#ef4444]' : 'text-[#d4e4fa]')}>{timeLeft}</span>
              </div>
            </div>

            {/* Timer bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(timeLeft / SECONDS_PER_Q) * 100}%`,
                  background: timeLeft > 8 ? '#00f2ff' : timeLeft > 3 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>

            {/* Question */}
            <div className="glass-card p-6 rounded-2xl">
              <p className="text-xl font-bold text-[#d4e4fa] leading-relaxed">{q.q}</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {q.options.map((opt, i) => {
                let btnState = ''
                if (phase === 'answer') {
                  if (i === q.answer) btnState = 'correct'
                  else if (i === chosen) btnState = 'wrong'
                } else if (chosen === i) {
                  btnState = 'chosen'
                }

                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    disabled={chosen !== null || phase === 'answer'}
                    className={cn(
                      'glass-card p-4 text-left rounded-xl font-medium text-sm transition-all',
                      btnState === 'correct' && 'border-[#22c55e]/60 bg-[#22c55e]/10 text-[#22c55e]',
                      btnState === 'wrong'   && 'border-[#ef4444]/60 bg-[#ef4444]/10 text-[#ef4444]',
                      btnState === 'chosen'  && 'border-[#00f2ff]/40 bg-[#00f2ff]/8 text-[#00f2ff]',
                      !btnState && 'hover:border-white/20 hover:bg-white/5 text-[#d4e4fa]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                      {phase === 'answer' && i === q.answer && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                      {phase === 'answer' && i === chosen && i !== q.answer && <XCircle className="w-4 h-4 ml-auto" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {phase === 'answer' && (
              <button onClick={nextQuestion} className="btn-primary w-full">
                {qIndex + 1 >= QUESTIONS_COUNT ? 'See Results' : 'Next Question →'}
              </button>
            )}
          </div>
        )}

        {phase === 'done' && (
          <div className="w-full max-w-md space-y-6 animate-slide-up">
            <div className="text-center">
              <Trophy className="w-12 h-12 text-[#f59e0b] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#d4e4fa]">Final Scores</p>
            </div>
            <div className="space-y-2">
              {sortedScores.map(([uid, pts], i) => (
                <div key={uid} className="flex items-center gap-4 glass-card px-4 py-3 rounded-xl">
                  <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
                    i === 0 ? 'bg-[#f59e0b] text-[#010f1f]' :
                    i === 1 ? 'bg-[#a0aec0] text-[#010f1f]' :
                    'bg-[#cd7c3a] text-[#010f1f]'
                  )}>{i + 1}</span>
                  <span className="flex-1 font-medium text-[#d4e4fa] truncate capitalize">{playerNames[uid] || uid.slice(0, 8)}</span>
                  <span className="badge-cyan">{pts} pts</span>
                </div>
              ))}
            </div>
            <button onClick={startGame} className="btn-primary w-full">Play Again</button>
          </div>
        )}
      </div>

      {/* Live scoreboard sidebar */}
      {(phase === 'question' || phase === 'answer') && sortedScores.length > 0 && (
        <div className="w-52 border-l border-white/8 p-4 space-y-3">
          <p className="text-xs font-semibold text-[#7090b0] uppercase tracking-wider">Scores</p>
          {sortedScores.map(([uid, pts], i) => (
            <div key={uid} className="flex items-center gap-2">
              <span className="text-xs text-[#7090b0] w-4">#{i + 1}</span>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-[#010f1f] flex-shrink-0"
                style={{ background: userColor(uid) }}>
                {(playerNames[uid] || uid).slice(0, 1).toUpperCase()}
              </div>
              <span className="flex-1 text-xs text-[#d4e4fa] truncate capitalize">{playerNames[uid] || uid.slice(0, 6)}</span>
              <span className="text-xs font-bold text-[#00f2ff]">{pts}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
