'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, MessageSquare, MonitorPlay, PenTool, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Whiteboard from './activities/Whiteboard'
import WordGuess from './activities/WordGuess'
import WatchParty from './activities/WatchParty'
import TicTacToe from './activities/TicTacToe'
import Snake from './activities/Snake'
import MemoryMatch from './activities/MemoryMatch'
import RockPaperScissors from './activities/RockPaperScissors'

type User = {
    id: string
    email: string
    avatar_url?: string
}

type Message = {
    id: string
    userId: string
    email: string
    text: string
    timestamp: string
}

export default function Room({ roomId }: { roomId: string }) {
    const [users, setUsers] = useState<any[]>([])
    const [activeActivity, setActiveActivity] = useState<'whiteboard' | 'wordguess' | 'watchparty' | 'tictactoe' | 'snake' | 'memorymatch' | 'rps' | null>(null)
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputMessage, setInputMessage] = useState('')

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Authenticated user
                setCurrentUser({
                    id: user.id,
                    email: user.email!,
                })
            } else {
                // Anonymous user - create temporary identity
                const anonymousId = localStorage.getItem('anonymous_user_id') || crypto.randomUUID()
                const anonymousEmail = localStorage.getItem('anonymous_user_email') || `guest_${anonymousId.slice(0, 8)}@nexus.local`

                // Save to localStorage for persistence
                localStorage.setItem('anonymous_user_id', anonymousId)
                localStorage.setItem('anonymous_user_email', anonymousEmail)

                setCurrentUser({
                    id: anonymousId,
                    email: anonymousEmail,
                })
            }
        }
        getUser()
    }, [])

    useEffect(() => {
        if (!currentUser) return

        const channel = supabase.channel(`room:${roomId}`, {
            config: {
                presence: {
                    key: currentUser.id,
                },
            },
        })

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState<any>()
                const presentUsers = Object.values(newState).flat()
                setUsers(presentUsers)
            })
            .on('broadcast', { event: 'activity_change' }, ({ payload }: { payload: { activity: 'whiteboard' | 'wordguess' | 'watchparty' } }) => {
                setActiveActivity(payload.activity)
            })
            .on('broadcast', { event: 'chat_message' }, ({ payload }: { payload: { message: Message } }) => {
                setMessages((prev) => [...prev, payload.message])
            })
            .subscribe(async (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: currentUser.id,
                        email: currentUser.email,
                        online_at: new Date().toISOString(),
                    })
                }
            })

        return () => {
            channel.unsubscribe()
        }
    }, [roomId, currentUser])

    const changeActivity = async (activity: 'whiteboard' | 'wordguess' | 'watchparty' | 'tictactoe' | 'snake' | 'memorymatch' | 'rps') => {
        setActiveActivity(activity)
        await supabase.channel(`room:${roomId}`).send({
            type: 'broadcast',
            event: 'activity_change',
            payload: { activity },
        })
    }

    const sendMessage = async () => {
        if (!inputMessage.trim() || !currentUser) return

        const message: Message = {
            id: crypto.randomUUID(),
            userId: currentUser.id,
            email: currentUser.email,
            text: inputMessage.trim(),
            timestamp: new Date().toISOString(),
        }

        // Add to local state immediately
        setMessages((prev) => [...prev, message])
        setInputMessage('')

        // Broadcast to other users
        await supabase.channel(`room:${roomId}`).send({
            type: 'broadcast',
            event: 'chat_message',
            payload: { message },
        })
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar - Presence & Chat */}
            <div className="w-80 border-r border-white/10 bg-black/20 backdrop-blur-md flex flex-col">
                <div className="p-4 border-b border-white/10">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Room Members ({users.length})
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {users.map((user) => (
                        <div key={user.user_id} className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.email}</p>
                                <p className="text-xs text-muted-foreground">Online</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chat Section */}
                <div className="flex-1 flex flex-col border-t border-white/10">
                    <div className="p-3 border-b border-white/10">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Chat
                        </h3>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                No messages yet. Start chatting!
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex gap-2",
                                        message.userId === currentUser?.id && "justify-end"
                                    )}
                                >
                                    {message.userId !== currentUser?.id && (
                                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {message.email.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[75%] rounded-lg px-3 py-2",
                                            message.userId === currentUser?.id
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-white/10"
                                        )}
                                    >
                                        {message.userId !== currentUser?.id && (
                                            <p className="text-xs font-semibold mb-1 opacity-70">
                                                {message.email.split('@')[0]}
                                            </p>
                                        )}
                                        <p className="text-sm break-words">{message.text}</p>
                                        <p className="text-xs opacity-50 mt-1">
                                            {new Date(message.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-white/10">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type a message..."
                                className="flex-1 px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!inputMessage.trim()}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex flex-col">
                {/* Activity Selector */}
                <div className="h-16 border-b border-white/10 flex items-center px-6 gap-4 bg-black/10">
                    <span className="text-sm font-medium text-muted-foreground mr-2">Activities:</span>

                    <button
                        onClick={() => changeActivity('whiteboard')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                            activeActivity === 'whiteboard'
                                ? "bg-primary text-white shadow-lg shadow-primary/25"
                                : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white"
                        )}
                    >
                        <PenTool className="h-4 w-4" />
                        Whiteboard
                    </button>

                    <button
                        onClick={() => changeActivity('wordguess')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                            activeActivity === 'wordguess'
                                ? "bg-pink-600 text-white shadow-lg shadow-pink-600/25"
                                : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white"
                        )}
                    >
                        <Gamepad2 className="h-4 w-4" />
                        Word Guess
                    </button>

                    <button
                        onClick={() => changeActivity('watchparty')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                            activeActivity === 'watchparty'
                                ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                                : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white"
                        )}
                    >
                        <MonitorPlay className="h-4 w-4" />
                        Watch Party
                    </button>

                    <button
                        onClick={() => changeActivity('tictactoe')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                            activeActivity === 'tictactoe'
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white"
                        )}
                    >
                        <Gamepad2 className="h-4 w-4" />
                        Tic Tac Toe
                    </button>

                    <button
                        onClick={() => changeActivity('snake')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                            activeActivity === 'snake'
                                ? "bg-green-600 text-white shadow-lg shadow-green-600/25"
                                : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white"
                        )}
                    >
                        <Gamepad2 className="h-4 w-4" />
                        Snake
                    </button>

                    <button
                        onClick={() => changeActivity('memorymatch')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                            activeActivity === 'memorymatch'
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
                                : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white"
                        )}
                    >
                        <Gamepad2 className="h-4 w-4" />
                        Memory Match
                    </button>

                    <button
                        onClick={() => changeActivity('rps')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                            activeActivity === 'rps'
                                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/25"
                                : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white"
                        )}
                    >
                        <Gamepad2 className="h-4 w-4" />
                        Rock Paper Scissors
                    </button>
                </div>

                {/* Activity Area */}
                <div className="flex-1 relative overflow-hidden">
                    {activeActivity === 'whiteboard' && <Whiteboard roomId={roomId} />}
                    {activeActivity === 'wordguess' && <WordGuess roomId={roomId} />}
                    {activeActivity === 'watchparty' && <WatchParty roomId={roomId} />}
                    {activeActivity === 'tictactoe' && <TicTacToe roomId={roomId} />}
                    {activeActivity === 'snake' && <Snake />}
                    {activeActivity === 'memorymatch' && <MemoryMatch />}
                    {activeActivity === 'rps' && <RockPaperScissors roomId={roomId} />}
                    {!activeActivity && (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 p-6">
                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                                <Gamepad2 className="h-10 w-10 opacity-50" />
                            </div>
                            <p>Select an activity to start playing together</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
