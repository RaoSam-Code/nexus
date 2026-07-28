'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import RoomShell from '@/components/room/RoomShell'

function RoomLoader() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  if (!id) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold text-[#d4e4fa]">Room not found</p>
          <p className="text-[#7090b0]">Please check the link or join a new room.</p>
        </div>
      </div>
    )
  }

  return <RoomShell roomId={id} roomName="Nexus Room" />
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-[#7090b0]">Loading room...</div>}>
      <RoomLoader />
    </Suspense>
  )
}
