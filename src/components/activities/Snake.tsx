'use client'

import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = { x: number; y: number }

const GRID_SIZE = 20
const CELL_SIZE = 20
const INITIAL_SPEED = 150

export default function Snake() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
    const [food, setFood] = useState<Position>({ x: 15, y: 15 })
    const [direction, setDirection] = useState<Direction>('RIGHT')
    const [gameOver, setGameOver] = useState(false)
    const [score, setScore] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [highScore, setHighScore] = useState(0)

    const directionRef = useRef(direction)
    const gameLoopRef = useRef<NodeJS.Timeout | undefined>(undefined)

    useEffect(() => {
        directionRef.current = direction
    }, [direction])

    useEffect(() => {
        const savedHighScore = localStorage.getItem('snakeHighScore')
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore))
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear canvas
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw grid
        ctx.strokeStyle = '#1a1a1a'
        ctx.lineWidth = 1
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath()
            ctx.moveTo(i * CELL_SIZE, 0)
            ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(0, i * CELL_SIZE)
            ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE)
            ctx.stroke()
        }

        // Draw snake
        snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? '#10b981' : '#059669'
            ctx.fillRect(
                segment.x * CELL_SIZE + 1,
                segment.y * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2
            )
        })

        // Draw food
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.arc(
            food.x * CELL_SIZE + CELL_SIZE / 2,
            food.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 2 - 2,
            0,
            Math.PI * 2
        )
        ctx.fill()
    }, [snake, food])

    useEffect(() => {
        if (!isPlaying) return

        const handleKeyPress = (e: KeyboardEvent) => {
            const key = e.key
            const currentDirection = directionRef.current

            if (key === 'ArrowUp' && currentDirection !== 'DOWN') {
                setDirection('UP')
            } else if (key === 'ArrowDown' && currentDirection !== 'UP') {
                setDirection('DOWN')
            } else if (key === 'ArrowLeft' && currentDirection !== 'RIGHT') {
                setDirection('LEFT')
            } else if (key === 'ArrowRight' && currentDirection !== 'LEFT') {
                setDirection('RIGHT')
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [isPlaying])

    useEffect(() => {
        if (!isPlaying || gameOver) {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current)
            }
            return
        }

        gameLoopRef.current = setInterval(() => {
            moveSnake()
        }, INITIAL_SPEED)

        return () => {
            if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current)
            }
        }
    }, [isPlaying, gameOver, snake, direction, food])

    const generateFood = (): Position => {
        let newFood: Position
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            }
        } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
        return newFood
    }

    const moveSnake = () => {
        setSnake(prevSnake => {
            const head = prevSnake[0]
            const currentDir = directionRef.current
            let newHead: Position

            switch (currentDir) {
                case 'UP':
                    newHead = { x: head.x, y: head.y - 1 }
                    break
                case 'DOWN':
                    newHead = { x: head.x, y: head.y + 1 }
                    break
                case 'LEFT':
                    newHead = { x: head.x - 1, y: head.y }
                    break
                case 'RIGHT':
                    newHead = { x: head.x + 1, y: head.y }
                    break
            }

            // Check wall collision
            if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
                setGameOver(true)
                setIsPlaying(false)
                return prevSnake
            }

            // Check self collision
            if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
                setGameOver(true)
                setIsPlaying(false)
                return prevSnake
            }

            const newSnake = [newHead, ...prevSnake]

            // Check food collision
            if (newHead.x === food.x && newHead.y === food.y) {
                setFood(generateFood())
                setScore(prev => {
                    const newScore = prev + 10
                    if (newScore > highScore) {
                        setHighScore(newScore)
                        localStorage.setItem('snakeHighScore', newScore.toString())
                    }
                    return newScore
                })
                return newSnake
            }

            newSnake.pop()
            return newSnake
        })
    }

    const startGame = () => {
        setSnake([{ x: 10, y: 10 }])
        setFood({ x: 15, y: 15 })
        setDirection('RIGHT')
        setGameOver(false)
        setScore(0)
        setIsPlaying(true)
    }

    const togglePause = () => {
        setIsPlaying(!isPlaying)
    }

    return (
        <div className="flex flex-col h-full w-full items-center justify-center p-8 relative">
            {/* Header */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 rounded-full">
                <h2 className="text-xl font-bold">Snake</h2>
            </div>

            <div className="space-y-6 w-full max-w-2xl">
                {/* Score Display */}
                <div className="flex justify-between items-center">
                    <div className="glass-panel px-6 py-3 rounded-xl">
                        <p className="text-sm text-muted-foreground">Score</p>
                        <p className="text-3xl font-bold">{score}</p>
                    </div>
                    <div className="glass-panel px-6 py-3 rounded-xl">
                        <p className="text-sm text-muted-foreground">High Score</p>
                        <p className="text-3xl font-bold text-yellow-500">{highScore}</p>
                    </div>
                </div>

                {/* Game Canvas */}
                <div className="relative flex items-center justify-center bg-black rounded-xl overflow-hidden border-2 border-white/10">
                    <canvas
                        ref={canvasRef}
                        width={GRID_SIZE * CELL_SIZE}
                        height={GRID_SIZE * CELL_SIZE}
                        className="block"
                    />

                    {gameOver && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <p className="text-4xl font-bold text-red-500">Game Over!</p>
                                <p className="text-xl">Final Score: {score}</p>
                                {score === highScore && score > 0 && (
                                    <p className="text-yellow-500 font-bold">New High Score!</p>
                                )}
                            </div>
                        </div>
                    )}

                    {!isPlaying && !gameOver && snake.length === 1 && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <p className="text-2xl font-bold">Ready to Play?</p>
                                <p className="text-muted-foreground">Use arrow keys to control</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex gap-3 justify-center">
                    {!isPlaying && !gameOver && snake.length === 1 ? (
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                        >
                            <Play className="h-5 w-5" />
                            Start Game
                        </button>
                    ) : gameOver ? (
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                        >
                            <RotateCcw className="h-5 w-5" />
                            Play Again
                        </button>
                    ) : (
                        <button
                            onClick={togglePause}
                            className="px-8 py-3 bg-white/10 text-white rounded-md font-medium hover:bg-white/20 transition-colors inline-flex items-center gap-2"
                        >
                            {isPlaying ? (
                                <>
                                    <Pause className="h-5 w-5" />
                                    Pause
                                </>
                            ) : (
                                <>
                                    <Play className="h-5 w-5" />
                                    Resume
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Instructions */}
                <div className="glass-panel p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                        🎮 Use <kbd className="px-2 py-1 bg-white/10 rounded">↑</kbd>{' '}
                        <kbd className="px-2 py-1 bg-white/10 rounded">↓</kbd>{' '}
                        <kbd className="px-2 py-1 bg-white/10 rounded">←</kbd>{' '}
                        <kbd className="px-2 py-1 bg-white/10 rounded">→</kbd> arrow keys to move
                    </p>
                </div>
            </div>
        </div>
    )
}
