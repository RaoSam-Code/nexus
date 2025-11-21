'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateRoom() {
    const router = useRouter()

    useEffect(() => {
        const roomId = crypto.randomUUID()
        router.push(`/room/${roomId}`)
    }, [router])

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="animate-pulse text-xl text-muted-foreground">Creating your room...</div>
        </div>
    )
}
