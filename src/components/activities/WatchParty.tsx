'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Play, Pause, SkipForward, ExternalLink, Plus, X, List } from 'lucide-react'

interface VideoItem { id: string; url: string; title: string }
type PlayState = { videoId: string; isPlaying: boolean; startedAt: number; seekedTo: number }

function extractYtId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]{11})/)
  return m ? m[1] : null
}

export default function WatchParty({ roomId, onSystemMessage }: {
  roomId: string
  onSystemMessage: (text: string) => void
}) {
  const [queue, setQueue] = useState<VideoItem[]>([])
  const [current, setCurrent] = useState<PlayState | null>(null)
  const [input, setInput] = useState('')
  const [showQueue, setShowQueue] = useState(false)

  useEffect(() => {
    const channel = supabase.channel(`watchparty:${roomId}`)
    channel
      .on('broadcast', { event: 'queue_update' }, ({ payload }) => setQueue(payload.queue))
      .on('broadcast', { event: 'play_video' }, ({ payload }) => {
        setCurrent(payload)
        onSystemMessage(`▶️ Now playing: ${payload.videoId}`)
      })
      .on('broadcast', { event: 'play_pause' }, ({ payload }) => {
        setCurrent(p => p ? { ...p, isPlaying: payload.isPlaying, startedAt: Date.now(), seekedTo: payload.seekedTo } : p)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, onSystemMessage])

  const broadcast = async (event: string, payload: object) => {
    await supabase.channel(`watchparty:${roomId}`).send({ type: 'broadcast', event, payload })
  }

  const addToQueue = async () => {
    const id = extractYtId(input)
    if (!id) return
    const item: VideoItem = { id, url: input, title: `youtube.com/watch?v=${id}` }
    const newQueue = [...queue, item]
    setQueue(newQueue)
    setInput('')
    await broadcast('queue_update', { queue: newQueue })
    // Auto-play if nothing is playing
    if (!current) playItem(item, newQueue)
  }

  const playItem = async (item: VideoItem, q?: VideoItem[]) => {
    const state: PlayState = { videoId: item.id, isPlaying: true, startedAt: Date.now(), seekedTo: 0 }
    setCurrent(state)
    await broadcast('play_video', state)
  }

  const removeFromQueue = async (id: string) => {
    const newQueue = queue.filter(v => v.id !== id)
    setQueue(newQueue)
    await broadcast('queue_update', { queue: newQueue })
  }

  const togglePlay = async () => {
    if (!current) return
    const newState = { ...current, isPlaying: !current.isPlaying, startedAt: Date.now() }
    setCurrent(newState)
    await broadcast('play_pause', { isPlaying: newState.isPlaying, seekedTo: current.seekedTo })
  }

  const skipNext = async () => {
    const idx = queue.findIndex(v => v.id === current?.videoId)
    if (idx !== -1 && idx + 1 < queue.length) playItem(queue[idx + 1])
    else setCurrent(null)
  }

  // Build iframe src — autoplay + start time
  const elapsed = current ? Math.floor((Date.now() - current.startedAt) / 1000 + current.seekedTo) : 0
  const iframeSrc = current
    ? `https://www.youtube.com/embed/${current.videoId}?autoplay=${current.isPlaying ? 1 : 0}&start=${elapsed}&rel=0&modestbranding=1`
    : null

  return (
    <div className="flex h-full">
      {/* Main player area */}
      <div className="flex-1 flex flex-col p-4 gap-4">
        {current && iframeSrc ? (
          <>
            <div className="flex-1 relative bg-black rounded-2xl overflow-hidden">
              <iframe
                key={iframeSrc}
                src={iframeSrc}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="btn-primary px-4 py-2">
                {current.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button onClick={skipNext} className="btn-subtle px-4 py-2">
                <SkipForward className="w-4 h-4" /> Skip
              </button>
              <a
                href={`https://youtube.com/watch?v=${current.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-subtle px-4 py-2 ml-auto"
              >
                <ExternalLink className="w-4 h-4" /> YouTube
              </a>
              <div className="flex items-center gap-2 text-xs text-[#7090b0]">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                Synced
              </div>
              <button onClick={() => setShowQueue(v => !v)} className="btn-subtle px-4 py-2">
                <List className="w-4 h-4" /> Queue
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center">
              <Play className="w-10 h-10 text-[#ef4444]" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#d4e4fa]">Watch Party</p>
              <p className="text-[#7090b0] mt-1">Add a YouTube URL to start watching together</p>
            </div>
          </div>
        )}

        {/* Add video input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addToQueue() }}
            placeholder="Paste YouTube URL…"
            className="input-nexus flex-1 text-sm"
          />
          <button onClick={addToQueue} disabled={!extractYtId(input)} className="btn-primary px-4">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Queue panel */}
      {showQueue && (
        <div className="w-64 border-l border-white/8 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <p className="text-sm font-semibold text-[#d4e4fa]">Queue ({queue.length})</p>
            <button onClick={() => setShowQueue(false)} className="text-[#7090b0] hover:text-[#d4e4fa]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {queue.length === 0 && (
              <p className="text-xs text-[#7090b0] text-center py-4">Queue is empty</p>
            )}
            {queue.map((v, i) => (
              <div key={v.id} className={`flex items-center gap-2 p-2 rounded-lg glass-card ${current?.videoId === v.id ? 'border-[#00f2ff]/30' : ''}`}>
                <span className="text-xs text-[#7090b0] w-4 flex-shrink-0">{i + 1}</span>
                <img src={`https://img.youtube.com/vi/${v.id}/default.jpg`} alt="" className="w-12 h-9 rounded object-cover flex-shrink-0" />
                <button onClick={() => playItem(v)} className="flex-1 text-left text-xs text-[#d4e4fa] truncate hover:text-[#00f2ff] transition-colors">
                  {v.id}
                </button>
                <button onClick={() => removeFromQueue(v.id)} className="text-[#7090b0] hover:text-[#ef4444] flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
