'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Choice = 'rock' | 'paper' | 'scissors' | null
type Result = 'win' | 'lose' | 'draw' | null

type GameState = {
    player1Id: string | null
    player2Id: string | null
    player1Choice: Choice
    player2Choice: Choice
    player1Score: number
    player2Score: number
    round: number
    maxRounds: number
    revealed: boolean
}

const CHOICES = [
    { id: 'rock', emoji: '🪨', label: 'Rock' },
    { id: 'paper', emoji: '📄', label: 'Paper' },
    { id: 'scissors', emoji: '✂️', label: 'Scissors' },
]

export default function RockPaperScissors({ roomId }: { roomId: string }) {
    const [gameState, setGameState] = useState<GameState>({
        player1Id: null,
        player2Id: null,
        player1Choice: null,
        player2Choice: null,
        player1Score: 0,
        player2Score: 0,
        round: 1,
        maxRounds: 5,
        revealed: false,
    })
    const [myChoice, setMyChoice] = useState<Choice>(null)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const setupGame = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
            }

            const channel = supabase.channel(`rps:${roomId}`)
            channel
                .on('broadcast', { event: 'game_start' }, ({ payload }) => {
                    setGameState(payload.gameState)
                })
                .on('broadcast', { event: 'choice' }, ({ payload }) => {
                    setGameState(payload.gameState)
                })
                .on('broadcast', { event: 'reveal' }, ({ payload }) => {
                    setGameState(payload.gameState)
                })
                .on('broadcast', { event: 'next_round' }, ({ payload }) => {
                    setGameState(payload.gameState)
                    setMyChoice(null)
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        setupGame()
    }, [roomId])

    const startGame = async () => {
        if (!userId) return

        const newGameState: GameState = {
            player1Id: userId,
            player2Id: null,
            player1Choice: null,
            player2Choice: null,
            player1Score: 0,
            player2Score: 0,
            round: 1,
            maxRounds: 5,
            revealed: false,
        }

        setGameState(newGameState)

        await supabase.channel(`rps:${roomId}`).send({
            type: 'broadcast',
            event: 'game_start',
            payload: { gameState: newGameState },
        })
    }

    const joinGame = async () => {
        if (!userId || !gameState.player1Id || gameState.player2Id) return

        const newGameState: GameState = {
            ...gameState,
            player2Id: userId,
        }

        setGameState(newGameState)

        await supabase.channel(`rps:${roomId}`).send({
            type: 'broadcast',
            event: 'game_start',
            payload: { gameState: newGameState },
        })
    }

    const makeChoice = async (choice: Choice) => {
        if (!userId || !gameState.player1Id || !gameState.player2Id) return
        if (gameState.revealed) return

        setMyChoice(choice)

        const isPlayer1 = userId === gameState.player1Id
        const newGameState = {
            ...gameState,
            [isPlayer1 ? 'player1Choice' : 'player2Choice']: choice,
        }

        setGameState(newGameState)

        await supabase.channel(`rps:${roomId}`).send({
            type: 'broadcast',
            event: 'choice',
            payload: { gameState: newGameState },
        })

        // Auto-reveal when both choices are made
        if (newGameState.player1Choice && newGameState.player2Choice && !newGameState.revealed) {
            setTimeout(async () => {
                const result = determineWinner(newGameState.player1Choice!, newGameState.player2Choice!)
                const revealedState = {
                    ...newGameState,
                    revealed: true,
                    player1Score: newGameState.player1Score + (result === 'player1' ? 1 : 0),
                    player2Score: newGameState.player2Score + (result === 'player2' ? 1 : 0),
                }

                setGameState(revealedState)

                await supabase.channel(`rps:${roomId}`).send({
                    type: 'broadcast',
                    event: 'reveal',
                    payload: { gameState: revealedState },
                })
            }, 500)
        }
    }

    const determineWinner = (choice1: Choice, choice2: Choice): 'player1' | 'player2' | 'draw' => {
        if (choice1 === choice2) return 'draw'
        if (
            (choice1 === 'rock' && choice2 === 'scissors') ||
            (choice1 === 'paper' && choice2 === 'rock') ||
            (choice1 === 'scissors' && choice2 === 'paper')
        ) {
            return 'player1'
        }
        return 'player2'
    }

    const nextRound = async () => {
        if (gameState.round >= gameState.maxRounds) return

        const newGameState: GameState = {
            ...gameState,
            player1Choice: null,
            player2Choice: null,
            round: gameState.round + 1,
            revealed: false,
        }

        setGameState(newGameState)
        setMyChoice(null)

        await supabase.channel(`rps:${roomId}`).send({
            type: 'broadcast',
            event: 'next_round',
            payload: { gameState: newGameState },
        })
    }

    const resetGame = async () => {
        const newGameState: GameState = {
            ...gameState,
            player1Choice: null,
            player2Choice: null,
            player1Score: 0,
            player2Score: 0,
            round: 1,
            revealed: false,
        }

        setGameState(newGameState)
        setMyChoice(null)

        await supabase.channel(`rps:${roomId}`).send({
            type: 'broadcast',
            event: 'next_round',
            payload: { gameState: newGameState },
        })
    }

    const isGameOver = gameState.round > gameState.maxRounds
    const myScore = userId === gameState.player1Id ? gameState.player1Score : gameState.player2Score
    const opponentScore = userId === gameState.player1Id ? gameState.player2Score : gameState.player1Score

    return (
        <div className="flex flex-col h-full w-full items-center justify-center p-8 relative">
            {/* Header */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 rounded-full">
                <h2 className="text-xl font-bold">Rock Paper Scissors</h2>
            </div>

            {!gameState.player1Id ? (
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">No active game</p>
                    <button
                        onClick={startGame}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                    >
                        Start New Game
                    </button>
                </div>
            ) : !gameState.player2Id ? (
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">Waiting for opponent...</p>
                    {userId && userId !== gameState.player1Id && (
                        <button
                            onClick={joinGame}
                            className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
                        >
                            Join Game
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-6 w-full max-w-2xl">
                    {/* Scoreboard */}
                    <div className="glass-panel p-6 rounded-xl">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">You</p>
                                <p className="text-4xl font-bold">{myScore}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Round</p>
                                <p className="text-2xl font-bold">
                                    {Math.min(gameState.round, gameState.maxRounds)}/{gameState.maxRounds}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Opponent</p>
                                <p className="text-4xl font-bold">{opponentScore}</p>
                            </div>
                        </div>
                    </div>

                    {isGameOver ? (
                        <div className="glass-panel p-8 rounded-xl text-center space-y-4">
                            <p className="text-3xl font-bold">
                                {myScore > opponentScore ? '🎉 You Win!' : myScore < opponentScore ? '😔 You Lose' : "🤝 It's a Tie!"}
                            </p>
                            <p className="text-xl">
                                Final Score: {myScore} - {opponentScore}
                            </p>
                            <button
                                onClick={resetGame}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Play Again
                            </button>
                        </div>
                    ) : gameState.revealed ? (
                        <div className="space-y-4">
                            <div className="glass-panel p-6 rounded-xl">
                                <p className="text-center text-lg font-bold mb-4">
                                    {determineWinner(gameState.player1Choice!, gameState.player2Choice!) === 'draw'
                                        ? "It's a Draw!"
                                        : (userId === gameState.player1Id
                                            ? determineWinner(gameState.player1Choice!, gameState.player2Choice!) === 'player1'
                                            : determineWinner(gameState.player1Choice!, gameState.player2Choice!) === 'player2')
                                            ? 'You Won This Round!'
                                            : 'Opponent Won This Round!'}
                                </p>
                                <div className="flex justify-center items-center gap-8">
                                    <div className="text-center">
                                        <p className="text-6xl mb-2">{CHOICES.find(c => c.id === myChoice)?.emoji}</p>
                                        <p className="text-sm text-muted-foreground">You</p>
                                    </div>
                                    <div className="text-4xl">VS</div>
                                    <div className="text-center">
                                        <p className="text-6xl mb-2">
                                            {CHOICES.find(c => c.id === (userId === gameState.player1Id ? gameState.player2Choice : gameState.player1Choice))?.emoji}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Opponent</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={nextRound}
                                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                            >
                                Next Round
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-center text-lg font-medium">
                                {myChoice ? 'Waiting for opponent...' : 'Choose your move!'}
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                {CHOICES.map((choice) => (
                                    <button
                                        key={choice.id}
                                        onClick={() => makeChoice(choice.id as Choice)}
                                        disabled={!!myChoice}
                                        className={cn(
                                            "glass-panel p-8 rounded-xl hover:bg-white/10 transition-all",
                                            myChoice === choice.id && "bg-primary/20 border-2 border-primary",
                                            myChoice && myChoice !== choice.id && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="text-6xl mb-2">{choice.emoji}</div>
                                        <p className="font-medium">{choice.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
