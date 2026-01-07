'use client'

import { useEffect, useState } from 'react'
import { RotateCcw, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

type Card = {
    id: number
    value: string
    isFlipped: boolean
    isMatched: boolean
}

const CARD_VALUES = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎵', '🎸']

export default function MemoryMatch() {
    const [cards, setCards] = useState<Card[]>([])
    const [flippedCards, setFlippedCards] = useState<number[]>([])
    const [moves, setMoves] = useState(0)
    const [matches, setMatches] = useState(0)
    const [gameWon, setGameWon] = useState(false)
    const [bestMoves, setBestMoves] = useState<number | null>(null)

    useEffect(() => {
        const savedBest = localStorage.getItem('memoryMatchBest')
        if (savedBest) {
            setBestMoves(parseInt(savedBest))
        }
    }, [])

    useEffect(() => {
        if (cards.length === 0) {
            initializeGame()
        }
    }, [])

    const initializeGame = () => {
        const cardPairs = [...CARD_VALUES, ...CARD_VALUES]
        const shuffled = cardPairs
            .map((value, index) => ({
                id: index,
                value,
                isFlipped: false,
                isMatched: false,
            }))
            .sort(() => Math.random() - 0.5)

        setCards(shuffled)
        setFlippedCards([])
        setMoves(0)
        setMatches(0)
        setGameWon(false)
    }

    const handleCardClick = (id: number) => {
        if (flippedCards.length === 2) return
        if (flippedCards.includes(id)) return
        if (cards[id].isMatched) return

        const newFlippedCards = [...flippedCards, id]
        setFlippedCards(newFlippedCards)

        setCards(prevCards =>
            prevCards.map(card =>
                card.id === id ? { ...card, isFlipped: true } : card
            )
        )

        if (newFlippedCards.length === 2) {
            setMoves(m => m + 1)
            const [first, second] = newFlippedCards
            // Find cards by their id property, not by array index
            const firstCard = cards.find(c => c.id === first)
            const secondCard = cards.find(c => c.id === second)

            if (firstCard && secondCard && firstCard.value === secondCard.value) {
                // Match found
                setTimeout(() => {
                    setCards(prevCards =>
                        prevCards.map(card =>
                            card.id === first || card.id === second
                                ? { ...card, isMatched: true }
                                : card
                        )
                    )
                    setFlippedCards([])
                    setMatches(m => {
                        const newMatches = m + 1
                        if (newMatches === CARD_VALUES.length) {
                            setGameWon(true)
                            const currentMoves = moves + 1
                            if (!bestMoves || currentMoves < bestMoves) {
                                setBestMoves(currentMoves)
                                localStorage.setItem('memoryMatchBest', currentMoves.toString())
                            }
                        }
                        return newMatches
                    })
                }, 600)
            } else {
                // No match
                setTimeout(() => {
                    setCards(prevCards =>
                        prevCards.map(card =>
                            card.id === first || card.id === second
                                ? { ...card, isFlipped: false }
                                : card
                        )
                    )
                    setFlippedCards([])
                }, 1000)
            }
        }
    }

    return (
        <div className="flex flex-col h-full w-full items-center justify-center p-8 relative">
            {/* Header */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 rounded-full">
                <h2 className="text-xl font-bold">Memory Match</h2>
            </div>

            <div className="space-y-6 w-full max-w-2xl">
                {/* Stats */}
                <div className="flex justify-between items-center">
                    <div className="glass-panel px-6 py-3 rounded-xl">
                        <p className="text-sm text-muted-foreground">Moves</p>
                        <p className="text-3xl font-bold">{moves}</p>
                    </div>
                    <div className="glass-panel px-6 py-3 rounded-xl">
                        <p className="text-sm text-muted-foreground">Matches</p>
                        <p className="text-3xl font-bold text-green-500">
                            {matches}/{CARD_VALUES.length}
                        </p>
                    </div>
                    {bestMoves !== null && (
                        <div className="glass-panel px-6 py-3 rounded-xl">
                            <p className="text-sm text-muted-foreground">Best</p>
                            <p className="text-3xl font-bold text-yellow-500">{bestMoves}</p>
                        </div>
                    )}
                </div>

                {/* Game Board */}
                <div className="grid grid-cols-4 gap-3">
                    {cards.map((card) => (
                        <button
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            disabled={card.isMatched || card.isFlipped || flippedCards.length === 2}
                            className={cn(
                                "aspect-square rounded-xl border-2 flex items-center justify-center text-4xl font-bold transition-all duration-300",
                                card.isMatched && "bg-green-600/20 border-green-600 opacity-50 cursor-not-allowed",
                                card.isFlipped && !card.isMatched && "bg-blue-600/20 border-blue-600",
                                !card.isFlipped && !card.isMatched && "bg-white/5 border-white/20 hover:border-white/40 hover:bg-white/10 cursor-pointer"
                            )}
                        >
                            {card.isFlipped || card.isMatched ? card.value : '?'}
                        </button>
                    ))}
                </div>

                {/* Game Won */}
                {gameWon && (
                    <div className="glass-panel p-6 rounded-xl text-center space-y-4">
                        <Trophy className="h-12 w-12 text-yellow-500 mx-auto" />
                        <p className="text-2xl font-bold">Congratulations!</p>
                        <p className="text-muted-foreground">
                            You completed the game in <span className="font-bold text-white">{moves}</span> moves!
                        </p>
                        {moves === bestMoves && (
                            <p className="text-yellow-500 font-bold">🎉 New Best Score!</p>
                        )}
                        <button
                            onClick={initializeGame}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Play Again
                        </button>
                    </div>
                )}

                {/* Instructions */}
                {!gameWon && moves === 0 && (
                    <div className="glass-panel p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                            Click cards to flip them and find matching pairs!
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
