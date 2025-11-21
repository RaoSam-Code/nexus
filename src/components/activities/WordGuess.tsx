'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Check, X, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

type GuessResult = {
    letter: string
    status: 'correct' | 'present' | 'absent'
}

type GameState = {
    targetWord: string
    guesses: string[]
    currentGuess: string
    gameOver: boolean
    won: boolean
}

const WORD_LENGTH = 5
const MAX_ATTEMPTS = 6

// Simple word list for demo - in production, use a larger dictionary
const WORD_LIST = ['REACT', 'NEXUS', 'BOARD', 'GAMES', 'PARTY', 'WATCH', 'GUESS', 'WORDS', 'MAGIC', 'LINKS']

export default function WordGuess({ roomId }: { roomId: string }) {
    const [gameState, setGameState] = useState<GameState>({
        targetWord: '',
        guesses: [],
        currentGuess: '',
        gameOver: false,
        won: false,
    })
    const [hostId, setHostId] = useState<string | null>(null)
    const [isHost, setIsHost] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const setupGame = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            // Listen for game state updates
            const channel = supabase.channel(`wordguess:${roomId}`)
            channel
                .on('broadcast', { event: 'game_start' }, ({ payload }) => {
                    setGameState({
                        targetWord: payload.targetWord,
                        guesses: [],
                        currentGuess: '',
                        gameOver: false,
                        won: false,
                    })
                    setHostId(payload.hostId)
                    setIsHost(user?.id === payload.hostId)
                })
                .on('broadcast', { event: 'new_guess' }, ({ payload }) => {
                    setGameState((prev) => ({
                        ...prev,
                        guesses: payload.guesses,
                        gameOver: payload.gameOver,
                        won: payload.won,
                    }))
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        setupGame()
    }, [roomId])

    const startNewGame = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]

        setGameState({
            targetWord: randomWord,
            guesses: [],
            currentGuess: '',
            gameOver: false,
            won: false,
        })
        setHostId(user.id)
        setIsHost(true)

        await supabase.channel(`wordguess:${roomId}`).send({
            type: 'broadcast',
            event: 'game_start',
            payload: {
                targetWord: randomWord,
                hostId: user.id,
            },
        })
    }

    const submitGuess = async () => {
        if (gameState.currentGuess.length !== WORD_LENGTH) return
        if (gameState.gameOver) return

        const newGuesses = [...gameState.guesses, gameState.currentGuess.toUpperCase()]
        const won = gameState.currentGuess.toUpperCase() === gameState.targetWord
        const gameOver = won || newGuesses.length >= MAX_ATTEMPTS

        setGameState((prev) => ({
            ...prev,
            guesses: newGuesses,
            currentGuess: '',
            gameOver,
            won,
        }))

        await supabase.channel(`wordguess:${roomId}`).send({
            type: 'broadcast',
            event: 'new_guess',
            payload: {
                guesses: newGuesses,
                gameOver,
                won,
            },
        })
    }

    const getLetterStatus = (letter: string, index: number, guess: string): 'correct' | 'present' | 'absent' => {
        if (!gameState.targetWord) return 'absent'

        if (gameState.targetWord[index] === letter) {
            return 'correct'
        }
        if (gameState.targetWord.includes(letter)) {
            return 'present'
        }
        return 'absent'
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            submitGuess()
        } else if (e.key === 'Backspace') {
            setGameState((prev) => ({
                ...prev,
                currentGuess: prev.currentGuess.slice(0, -1),
            }))
        } else if (/^[a-zA-Z]$/.test(e.key) && gameState.currentGuess.length < WORD_LENGTH) {
            setGameState((prev) => ({
                ...prev,
                currentGuess: prev.currentGuess + e.key.toUpperCase(),
            }))
        }
    }

    return (
        <div className="flex flex-col h-full w-full items-center justify-center p-8 relative">
            {/* Header */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 rounded-full">
                <h2 className="text-xl font-bold">Word Guess</h2>
            </div>

            {!gameState.targetWord ? (
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">No active game</p>
                    <button
                        onClick={startNewGame}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                    >
                        Start New Game
                    </button>
                </div>
            ) : (
                <div className="space-y-6 w-full max-w-md">
                    {/* Game Board */}
                    <div className="space-y-2">
                        {Array.from({ length: MAX_ATTEMPTS }).map((_, attemptIndex) => (
                            <div key={attemptIndex} className="flex gap-2 justify-center">
                                {Array.from({ length: WORD_LENGTH }).map((_, letterIndex) => {
                                    const guess = gameState.guesses[attemptIndex]
                                    const letter = guess?.[letterIndex] || (attemptIndex === gameState.guesses.length ? gameState.currentGuess[letterIndex] : '')
                                    const status = guess ? getLetterStatus(guess[letterIndex], letterIndex, guess) : null

                                    return (
                                        <div
                                            key={letterIndex}
                                            className={cn(
                                                "w-14 h-14 border-2 rounded-md flex items-center justify-center text-2xl font-bold uppercase transition-all",
                                                status === 'correct' && "bg-green-600 border-green-600 text-white",
                                                status === 'present' && "bg-yellow-600 border-yellow-600 text-white",
                                                status === 'absent' && "bg-gray-600 border-gray-600 text-white",
                                                !status && letter && "border-white/40",
                                                !status && !letter && "border-white/10"
                                            )}
                                        >
                                            {letter}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    {!gameState.gameOver && (
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={gameState.currentGuess}
                                onKeyDown={handleKeyPress}
                                maxLength={WORD_LENGTH}
                                className="hidden"
                                autoFocus
                            />
                            <button
                                onClick={() => inputRef.current?.focus()}
                                className="flex-1 px-4 py-3 bg-white/10 rounded-md border border-white/20 hover:bg-white/20 transition-colors"
                            >
                                Click to type guess
                            </button>
                            <button
                                onClick={submitGuess}
                                disabled={gameState.currentGuess.length !== WORD_LENGTH}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit
                            </button>
                        </div>
                    )}

                    {/* Game Over */}
                    {gameState.gameOver && (
                        <div className="glass-panel p-6 rounded-xl text-center space-y-4">
                            {gameState.won ? (
                                <>
                                    <Check className="h-12 w-12 text-green-500 mx-auto" />
                                    <p className="text-xl font-bold">Congratulations!</p>
                                    <p className="text-muted-foreground">You guessed the word in {gameState.guesses.length} attempts</p>
                                </>
                            ) : (
                                <>
                                    <X className="h-12 w-12 text-red-500 mx-auto" />
                                    <p className="text-xl font-bold">Game Over</p>
                                    <p className="text-muted-foreground">The word was: <span className="font-bold text-white">{gameState.targetWord}</span></p>
                                </>
                            )}
                            {isHost && (
                                <button
                                    onClick={startNewGame}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    New Game
                                </button>
                            )}
                        </div>
                    )}

                    {/* Debug: Show word for host */}
                    {isHost && !gameState.gameOver && (
                        <div className="text-xs text-muted-foreground text-center">
                            Host target word: {gameState.targetWord}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
