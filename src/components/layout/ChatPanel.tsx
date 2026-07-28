'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { cn, userColor, initials, displayName, formatTime } from '@/lib/utils'

export interface ChatMessage {
  id: string
  userId: string
  email: string
  text: string
  timestamp: string
  isSystem?: boolean
}

interface Props {
  messages: ChatMessage[]
  currentUserId: string
  onSend: (text: string) => void
}

export default function ChatPanel({ messages, currentUserId, onSend }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    onSend(text)
    setInput('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full border-l border-white/8 bg-[#010f1f]/60 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
        <MessageSquare className="w-4 h-4 text-[#00f2ff]" />
        <span className="text-sm font-semibold text-[#d4e4fa]">Chat</span>
        {messages.length > 0 && (
          <span className="ml-auto badge-cyan text-[10px]">{messages.length}</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageSquare className="w-8 h-8 text-white/20 mb-2" />
            <p className="text-xs text-[#7090b0]">No messages yet.<br />Say hello!</p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="text-center py-1">
                <span className="text-[10px] text-[#7090b0] bg-white/5 rounded-full px-2 py-0.5">
                  {msg.text}
                </span>
              </div>
            )
          }

          const isOwn = msg.userId === currentUserId
          const color = userColor(msg.userId)

          return (
            <div
              key={msg.id}
              className={cn('flex gap-2 animate-slide-up', isOwn && 'flex-row-reverse')}
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-[#010f1f]"
                style={{ background: color }}
                title={displayName(msg.email)}
              >
                {initials(msg.email)}
              </div>

              {/* Bubble */}
              <div className={cn('max-w-[75%] space-y-0.5', isOwn && 'items-end flex flex-col')}>
                {!isOwn && (
                  <p className="text-[10px] font-medium px-1" style={{ color }}>
                    {displayName(msg.email)}
                  </p>
                )}
                <div
                  className={cn(
                    'rounded-2xl px-3 py-2 text-sm leading-relaxed break-words',
                    isOwn
                      ? 'bg-[#00f2ff] text-[#010f1f] font-medium rounded-tr-sm'
                      : 'bg-white/8 text-[#d4e4fa] rounded-tl-sm'
                  )}
                >
                  {msg.text}
                </div>
                <p className={cn('text-[10px] text-[#7090b0] px-1', isOwn && 'text-right')}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-white/8">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message room…"
            rows={1}
            className="flex-1 input-nexus resize-none py-2.5 text-sm leading-5 max-h-24 overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Send message"
            className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#00f2ff] text-[#010f1f] flex items-center justify-center hover:bg-[#00dde8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
