'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Hash } from 'lucide-react'
import NexusLogo from '@/components/layout/NexusLogo'
import Link from 'next/link'

export default function JoinRoomPage() {
  const [code, setCode] = useState('')
  const router = useRouter()

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = code.trim().replace(/[^a-zA-Z0-9]/g, '')
    if (clean) router.push(`/room/${clean}`)
  }

  // Recent rooms from sessionStorage
  const recentKeys = typeof window !== 'undefined'
    ? Object.keys(sessionStorage).filter(k => k.startsWith('room_name_')).slice(-4)
    : []
  const recentRooms = recentKeys.map(k => ({
    id: k.replace('room_name_', ''),
    name: sessionStorage.getItem(k) || 'Unnamed Room',
  }))

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(188,19,254,0.07) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex"><NexusLogo size={30} showText /></Link>
          <p className="mt-3 text-[#7090b0] text-sm">Enter a room code to join</p>
        </div>

        <div className="glass-card p-8 space-y-6">
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="code" className="text-sm font-medium text-[#d4e4fa]">Room code</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7090b0]" />
                <input
                  id="code"
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="abc123def456"
                  className="input-nexus pl-10 font-mono tracking-wider"
                  maxLength={32}
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-[#7090b0]">Paste the full URL or just the room code</p>
            </div>

            <button type="submit" disabled={!code.trim()} className="btn-primary w-full">
              Join Room
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {recentRooms.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#7090b0] uppercase tracking-wider">Recent rooms</p>
              <div className="space-y-2">
                {recentRooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => router.push(`/room/${room.id}`)}
                    className="w-full btn-subtle justify-between text-left"
                  >
                    <span className="font-medium truncate">{room.name}</span>
                    <span className="text-[#7090b0] font-mono text-xs">{room.id.slice(0, 8)}…</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-[#7090b0] mt-6">
          Don't have a code?{' '}
          <Link href="/room/create" className="text-[#00f2ff] hover:underline">Create a room</Link>
        </p>
      </div>
    </main>
  )
}
