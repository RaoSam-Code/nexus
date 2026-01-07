'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/getUser'
import { Play, Pause, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

type PlayerState = {
    videoId: string | null
    isPlaying: boolean
    currentTime: number
    lastUpdate: number
}

export default function WatchParty({ roomId }: { roomId: string }) {
    const [videoUrl, setVideoUrl] = useState('')
    const [playerState, setPlayerState] = useState<PlayerState>({
        videoId: null,
        isPlaying: false,
        currentTime: 0,
        lastUpdate: Date.now(),
    })
    const [isHost, setIsHost] = useState(false)

    useEffect(() => {
        const setupSync = async () => {
            const user = await getCurrentUser()

            const channel = supabase.channel(`watchparty:${roomId}`)
            channel
                .on('broadcast', { event: 'video_change' }, ({ payload }) => {
                    setPlayerState({
                        videoId: payload.videoId,
                        isPlaying: false,
                        currentTime: 0,
                        lastUpdate: Date.now(),
                    })
                })
                .on('broadcast', { event: 'play_state' }, ({ payload }) => {
                    setPlayerState((prev) => ({
                        ...prev,
                        isPlaying: payload.isPlaying,
                        currentTime: payload.currentTime,
                        lastUpdate: Date.now(),
                    }))
                })
                .on('broadcast', { event: 'seek' }, ({ payload }) => {
                    setPlayerState((prev) => ({
                        ...prev,
                        currentTime: payload.currentTime,
                        lastUpdate: Date.now(),
                    }))
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        setupSync()
    }, [roomId])

    const extractYouTubeId = (url: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
            /youtube\.com\/embed\/([^&\s]+)/,
        ]

        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match) return match[1]
        }
        return null
    }

    const handleLoadVideo = async () => {
        const videoId = extractYouTubeId(videoUrl)
        if (!videoId) return

        setPlayerState({
            videoId,
            isPlaying: false,
            currentTime: 0,
            lastUpdate: Date.now(),
        })
        setIsHost(true)

        await supabase.channel(`watchparty:${roomId}`).send({
            type: 'broadcast',
            event: 'video_change',
            payload: { videoId },
        })
    }

    const handlePlayPause = async () => {
        const newState = !playerState.isPlaying
        setPlayerState((prev) => ({
            ...prev,
            isPlaying: newState,
            lastUpdate: Date.now(),
        }))

        await supabase.channel(`watchparty:${roomId}`).send({
            type: 'broadcast',
            event: 'play_state',
            payload: {
                isPlaying: newState,
                currentTime: playerState.currentTime,
            },
        })
    }

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Header */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 rounded-full z-10">
                <h2 className="text-xl font-bold">Watch Party</h2>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
                {!playerState.videoId ? (
                    <div className="w-full max-w-2xl space-y-4">
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold">Load a YouTube Video</h3>
                            <p className="text-muted-foreground">Paste a YouTube URL to watch together</p>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="flex-1 px-4 py-3 rounded-md bg-black/20 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                                onClick={handleLoadVideo}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                            >
                                Load Video
                            </button>
                        </div>

                        <div className="glass-panel p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">How it works:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Paste any YouTube video URL</li>
                                <li>• Everyone in the room will see the same video</li>
                                <li>• Play/pause syncs across all viewers</li>
                                <li>• Perfect for watching together!</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl space-y-4">
                        {/* Video Player */}
                        <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                            <iframe
                                src={`https://www.youtube.com/embed/${playerState.videoId}?autoplay=${playerState.isPlaying ? 1 : 0}&start=${Math.floor(playerState.currentTime)}&enablejsapi=1`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>

                        {/* Controls */}
                        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handlePlayPause}
                                    className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    {playerState.isPlaying ? (
                                        <Pause className="h-5 w-5" />
                                    ) : (
                                        <Play className="h-5 w-5 ml-0.5" />
                                    )}
                                </button>
                                <div className="text-sm">
                                    <p className="font-medium">Synced Playback</p>
                                    <p className="text-muted-foreground text-xs">
                                        {playerState.isPlaying ? 'Playing' : 'Paused'}
                                    </p>
                                </div>
                            </div>

                            <a
                                href={`https://www.youtube.com/watch?v=${playerState.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Open in YouTube
                            </a>
                        </div>

                        {/* Change Video */}
                        {isHost && (
                            <button
                                onClick={() => {
                                    setPlayerState({
                                        videoId: null,
                                        isPlaying: false,
                                        currentTime: 0,
                                        lastUpdate: Date.now(),
                                    })
                                    setVideoUrl('')
                                }}
                                className="w-full px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm"
                            >
                                Change Video
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Sync Indicator */}
            <div className="absolute bottom-4 right-4 glass-panel px-3 py-2 rounded-full text-xs">
                <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Synced
                </span>
            </div>
        </div>
    )
}
