'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/getUser'
import { type ActivityId } from '@/lib/constants'

import RoomHeader from '@/components/layout/RoomHeader'
import Sidebar from '@/components/layout/Sidebar'
import ChatPanel, { type ChatMessage } from '@/components/layout/ChatPanel'
import type { RoomUser } from '@/components/layout/Sidebar'

import Whiteboard from '@/components/activities/Whiteboard'
import Pictionary from '@/components/activities/Pictionary'
import WordGuess from '@/components/activities/WordGuess'
import Trivia from '@/components/activities/Trivia'
import WatchParty from '@/components/activities/WatchParty'
import TicTacToe from '@/components/activities/TicTacToe'
import Chess from '@/components/activities/Chess'
import RPS from '@/components/activities/RPS'

interface Props {
  roomId: string
  roomName: string
}

export default function RoomShell({ roomId, roomName }: Props) {
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)
  const [users, setUsers] = useState<RoomUser[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeActivity, setActiveActivity] = useState<ActivityId>('whiteboard')

  // Load current user
  useEffect(() => {
    getCurrentUser().then(setCurrentUser)
  }, [])

  // Supabase Realtime: presence + chat + activity changes
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: currentUser.id } },
    })

    // Presence
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ email: string; online_at: string }>()
      const list: RoomUser[] = Object.entries(state).map(([key, presences]) => ({
        user_id: key,
        email: presences[0].email,
        online_at: presences[0].online_at,
      }))
      setUsers(list)
    })

    // Chat messages
    channel.on('broadcast', { event: 'chat_message' }, ({ payload }) => {
      setMessages(prev => [...prev, payload.message as ChatMessage])
    })

    // Activity change sync
    channel.on('broadcast', { event: 'activity_change' }, ({ payload }) => {
      setActiveActivity(payload.activity as ActivityId)
    })

    channel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return
      await channel.track({
        email: currentUser.email,
        online_at: new Date().toISOString(),
      })
    })

    return () => { supabase.removeChannel(channel) }
  }, [roomId, currentUser])

  const handleSendMessage = useCallback(async (text: string) => {
    if (!currentUser) return
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      email: currentUser.email,
      text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, message])
    await supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'chat_message',
      payload: { message },
    })
  }, [currentUser, roomId])

  const handleActivityChange = useCallback(async (activity: ActivityId) => {
    setActiveActivity(activity)
    await supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'activity_change',
      payload: { activity },
    })
  }, [roomId])

  // Inject system messages into chat
  const addSystemMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      userId: 'system',
      email: 'system',
      text,
      timestamp: new Date().toISOString(),
      isSystem: true,
    }])
  }, [])

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#00f2ff] border-t-transparent animate-spin" />
          <p className="text-sm text-[#7090b0]">Joining room…</p>
        </div>
      </div>
    )
  }

  // Props shared by activities that support system messages and user identity
  const activityProps = {
    roomId,
    currentUserId: currentUser.id,
    currentUserEmail: currentUser.email,
    onSystemMessage: addSystemMessage,
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <RoomHeader
        roomId={roomId}
        roomName={roomName}
        memberCount={users.length}
        activeActivity={activeActivity}
        onActivityChange={handleActivityChange}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: member presence */}
        <div className="w-48 flex-shrink-0 hidden md:flex flex-col">
          <Sidebar users={users} currentUserId={currentUser.id} />
        </div>

        {/* Center: activity workspace */}
        <main className="flex-1 overflow-hidden relative bg-[#010f1f]">
          {activeActivity === 'whiteboard'  && <Whiteboard roomId={roomId} />}
          {activeActivity === 'pictionary'  && <Pictionary {...activityProps} />}
          {activeActivity === 'wordguess'   && <WordGuess roomId={roomId} onSystemMessage={addSystemMessage} />}
          {activeActivity === 'trivia'      && <Trivia {...activityProps} />}
          {activeActivity === 'watchparty'  && <WatchParty roomId={roomId} onSystemMessage={addSystemMessage} />}
          {activeActivity === 'tictactoe'   && <TicTacToe {...activityProps} />}
          {activeActivity === 'chess'       && <Chess {...activityProps} />}
          {activeActivity === 'rps'         && <RPS {...activityProps} />}
        </main>

        {/* Right: persistent chat */}
        <div className="w-72 flex-shrink-0 flex flex-col">
          <ChatPanel
            messages={messages}
            currentUserId={currentUser.id}
            onSend={handleSendMessage}
          />
        </div>
      </div>
    </div>
  )
}
