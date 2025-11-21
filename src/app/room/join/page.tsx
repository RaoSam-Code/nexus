'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

export default function JoinRoom() {
    const [roomId, setRoomId] = useState('')
    const router = useRouter()

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault()
        if (roomId.trim()) {
            router.push(`/room/${roomId.trim()}`)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md p-8 rounded-xl space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Join a Room</h1>
                    <p className="text-muted-foreground">Enter the Room ID to connect</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="e.g. 123e4567-e89b..."
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            required
                            className="w-full px-3 py-2 rounded-md bg-black/20 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full h-10 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center justify-center group"
                    >
                        Join Room
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                </form>
            </div>
        </div>
    )
}
