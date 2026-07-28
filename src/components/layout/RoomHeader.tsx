'use client'

import { useState } from 'react'
import { Copy, Check, Users, Share2 } from 'lucide-react'
import NexusLogo from './NexusLogo'
import { ACTIVITIES, type ActivityId } from '@/lib/constants'
import { cn, copyToClipboard } from '@/lib/utils'
import dynamic from 'next/dynamic'

const QRCode = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false })

interface Props {
  roomId: string
  roomName: string
  memberCount: number
  activeActivity: ActivityId | null
  onActivityChange: (id: ActivityId) => void
}

export default function RoomHeader({ roomId, roomName, memberCount, activeActivity, onActivityChange }: Props) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const roomUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/play?id=${roomId}` : ''

  const handleCopy = async () => {
    const ok = await copyToClipboard(roomUrl)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <header className="flex items-center gap-4 px-4 h-14 border-b border-white/8 bg-[#010f1f]/80 backdrop-blur-xl flex-shrink-0">
        {/* Logo */}
        <NexusLogo size={22} showText className="flex-shrink-0" />

        {/* Divider */}
        <div className="w-px h-5 bg-white/10" />

        {/* Room name + ID */}
        <div className="flex-shrink-0">
          <p className="font-semibold text-sm text-[#d4e4fa] leading-tight">{roomName}</p>
          <p className="text-[10px] text-[#7090b0] font-mono">{roomId}</p>
        </div>

        {/* Activity tabs — horizontal scroll */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide px-1">
          {ACTIVITIES.map(act => (
            <button
              key={act.id}
              onClick={() => onActivityChange(act.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                activeActivity === act.id
                  ? 'text-[#010f1f] font-bold'
                  : 'text-[#7090b0] hover:text-[#d4e4fa] hover:bg-white/8'
              )}
              style={activeActivity === act.id ? {
                background: act.color,
                boxShadow: `0 0 12px ${act.color}40`,
              } : {}}
            >
              {act.label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#7090b0]">
            <Users className="w-3.5 h-3.5" />
            <span>{memberCount}</span>
          </div>

          <button
            onClick={() => setShowQR(v => !v)}
            className="btn-subtle px-3 py-1.5 text-xs relative"
            aria-label="Share room"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>

          <button onClick={handleCopy} className="btn-subtle px-3 py-1.5 text-xs" aria-label="Copy link">
            {copied
              ? <><Check className="w-3.5 h-3.5 text-[#22c55e]" /> Copied!</>
              : <><Copy className="w-3.5 h-3.5" /> Copy link</>
            }
          </button>
        </div>
      </header>

      {/* QR modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowQR(false)}
        >
          <div
            className="glass-card-bright p-6 rounded-2xl space-y-4 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-[#d4e4fa] text-center">Scan to join</p>
            <div className="p-3 bg-white rounded-xl">
              <QRCode value={roomUrl} size={180} />
            </div>
            <p className="text-[10px] text-[#7090b0] text-center font-mono break-all">{roomUrl}</p>
            <button onClick={handleCopy} className="btn-primary w-full text-sm">
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
