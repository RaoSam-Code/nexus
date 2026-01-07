'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/getUser'
import { RotateCcw, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

type Player = 'X' | 'O'
type Cell = Player | null
type Board = Cell[]

type GameState = {
    board: Board
    currentPlayer: Player
    winner: Player | 'draw' | null
    gameOver: boolean
    playerX: string | null
    playerO: string | null
}

export default function TicTacToe({ roomId }: { roomId: string }) {
    const [gameState, setGameState] = useState<GameState>({
        board: Array(9).fill(null),
        currentPlayer: 'X',
        winner: null,
        gameOver: false,
        playerX: null,
        playerO: null,
    })
    const [mySymbol, setMySymbol] = useState<Player | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const setupGame = async () => {
            const user = await getCurrentUser()
            setUserId(user.id)

            const channel = supabase.channel(`tictactoe:${roomId}`)
            channel
                .on('broadcast', { event: 'game_start' }, ({ payload }) => {
                    setGameState(payload.gameState)
                    if (user && payload.gameState.playerX === user.id) {
                        setMySymbol('X')
                    } else if (user && payload.gameState.playerO === user.id) {
                        setMySymbol('O')
                    }
                })
                .on('broadcast', { event: 'move' }, ({ payload }) => {
                    setGameState(payload.gameState)
                })
                .on('broadcast', { event: 'reset' }, ({ payload }) => {
                    setGameState(payload.gameState)
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
            board: Array(9).fill(null),
            currentPlayer: 'X',
            winner: null,
            gameOver: false,
            playerX: userId,
            playerO: null,
        }

        setGameState(newGameState)
        setMySymbol('X')

        await supabase.channel(`tictactoe:${roomId}`).send({
            type: 'broadcast',
            event: 'game_start',
            payload: { gameState: newGameState },
        })
    }

    const joinGame = async () => {
        if (!userId || !gameState.playerX || gameState.playerO) return

        const newGameState: GameState = {
            ...gameState,
            playerO: userId,
        }

        setGameState(newGameState)
        setMySymbol('O')

        await supabase.channel(`tictactoe:${roomId}`).send({
            type: 'broadcast',
            event: 'game_start',
            payload: { gameState: newGameState },
        })
    }

    const checkWinner = (board: Board): Player | 'draw' | null => {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6], // diagonals
        ]

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a] as Player
            }
        }

        if (board.every(cell => cell !== null)) {
            return 'draw'
        }

        return null
    }

    const makeMove = async (index: number) => {
        if (gameState.board[index] || gameState.gameOver) return
        if (mySymbol !== gameState.currentPlayer) return
        if (!gameState.playerX || !gameState.playerO) return

        const newBoard = [...gameState.board]
        newBoard[index] = gameState.currentPlayer

        const winner = checkWinner(newBoard)

        const newGameState: GameState = {
            ...gameState,
            board: newBoard,
            currentPlayer: gameState.currentPlayer === 'X' ? 'O' : 'X',
            winner,
            gameOver: winner !== null,
        }

        setGameState(newGameState)

        await supabase.channel(`tictactoe:${roomId}`).send({
            type: 'broadcast',
            event: 'move',
            payload: { gameState: newGameState },
        })
    }

    const resetGame = async () => {
        const newGameState: GameState = {
            board: Array(9).fill(null),
            currentPlayer: 'X',
            winner: null,
            gameOver: false,
            playerX: gameState.playerX,
            playerO: gameState.playerO,
        }

        setGameState(newGameState)

        await supabase.channel(`tictactoe:${roomId}`).send({
            type: 'broadcast',
            event: 'reset',
            payload: { gameState: newGameState },
        })
    }

    return (
        <div className="flex flex-col h-full w-full items-center justify-center p-8 relative">
            {/* Header */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 rounded-full">
                <h2 className="text-xl font-bold">Tic Tac Toe</h2>
            </div>

            {!gameState.playerX ? (
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">No active game</p>
                    <button
                        onClick={startGame}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                    >
                        Start New Game
                    </button>
                </div>
            ) : !gameState.playerO ? (
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">Waiting for player O to join...</p>
                    {userId && userId !== gameState.playerX && (
                        <button
                            onClick={joinGame}
                            className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
                        >
                            Join as Player O
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-6 w-full max-w-md">
                    {/* Game Info */}
                    <div className="glass-panel p-4 rounded-xl text-center">
                        <p className="text-sm text-muted-foreground mb-1">
                            You are: <span className="font-bold text-white">{mySymbol}</span>
                        </p>
                        {!gameState.gameOver && (
                            <p className="text-lg font-bold">
                                {gameState.currentPlayer === mySymbol ? "Your turn!" : `Player ${gameState.currentPlayer}'s turn`}
                            </p>
                        )}
                    </div>

                    {/* Game Board */}
                    <div className="grid grid-cols-3 gap-3 aspect-square">
                        {gameState.board.map((cell, index) => (
                            <button
                                key={index}
                                onClick={() => makeMove(index)}
                                disabled={!!cell || gameState.gameOver || mySymbol !== gameState.currentPlayer}
                                className={cn(
                                    "aspect-square rounded-xl border-2 flex items-center justify-center text-5xl font-bold transition-all",
                                    cell === 'X' && "bg-blue-600/20 border-blue-600 text-blue-400",
                                    cell === 'O' && "bg-pink-600/20 border-pink-600 text-pink-400",
                                    !cell && !gameState.gameOver && mySymbol === gameState.currentPlayer && "border-white/20 hover:border-white/40 hover:bg-white/5 cursor-pointer",
                                    !cell && (gameState.gameOver || mySymbol !== gameState.currentPlayer) && "border-white/10 cursor-not-allowed"
                                )}
                            >
                                {cell}
                            </button>
                        ))}
                    </div>

                    {/* Game Over */}
                    {gameState.gameOver && (
                        <div className="glass-panel p-6 rounded-xl text-center space-y-4">
                            {gameState.winner === 'draw' ? (
                                <>
                                    <p className="text-xl font-bold">It's a Draw!</p>
                                    <p className="text-muted-foreground">Well played!</p>
                                </>
                            ) : (
                                <>
                                    <Trophy className="h-12 w-12 text-yellow-500 mx-auto" />
                                    <p className="text-xl font-bold">
                                        Player {gameState.winner} Wins!
                                    </p>
                                    {mySymbol === gameState.winner && (
                                        <p className="text-green-400">Congratulations!</p>
                                    )}
                                </>
                            )}
                            <button
                                onClick={resetGame}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Play Again
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
