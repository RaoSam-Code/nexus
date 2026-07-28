'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROOM_TEMPLATES, ACTIVITIES, type RoomTemplate } from '@/lib/constants'
import NexusLogo from '@/components/layout/NexusLogo'
import { ArrowRight, Loader2, Globe, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function CreateRoomPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [template, setTemplate] = useState<RoomTemplate>(ROOM_TEMPLATES[0])
  const [roomName, setRoomName] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  const activityConfig = ACTIVITIES.find(a => a.id === template.defaultActivity)!

  const handleCreate = async () => {
    setCreating(true)
    const roomId = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    const name = roomName.trim() || template.name
    // Persist room name in sessionStorage for the room page to pick up
    sessionStorage.setItem(`room_name_${roomId}`, name)
    sessionStorage.setItem(`room_template_${roomId}`, template.id)
    sessionStorage.setItem(`room_public_${roomId}`, String(isPublic))
    router.push(`/room/play?id=${roomId}`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,242,255,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(188,19,254,0.07) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex"><NexusLogo size={30} showText /></Link>
          <p className="mt-3 text-[#7090b0] text-sm">Set up your room</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 justify-center mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                step >= s
                  ? 'bg-[#00f2ff] text-[#010f1f]'
                  : 'bg-white/8 text-[#7090b0]'
              )}>{s}</div>
              {s < 2 && <div className={cn('w-12 h-px', step >= 2 ? 'bg-[#00f2ff]' : 'bg-white/10')} />}
            </div>
          ))}
        </div>

        <div className="glass-card p-8">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-[#d4e4fa]">Choose a template</h2>
                <p className="text-sm text-[#7090b0] mt-1">Pick the vibe for your hangout</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ROOM_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t)}
                    className={cn(
                      'glass-card p-4 text-left transition-all duration-200 rounded-xl',
                      template.id === t.id
                        ? 'border-[#00f2ff]/40 bg-[#00f2ff]/5 neon-glow-cyan'
                        : 'hover:border-white/16 hover:bg-white/4'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="badge-cyan text-[10px]">{t.badge}</span>
                      {template.id === t.id && (
                        <div className="w-4 h-4 rounded-full bg-[#00f2ff] flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1 4l2 2 4-4" stroke="#010f1f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-[#d4e4fa]">{t.name}</p>
                    <p className="text-xs text-[#7090b0] mt-0.5 leading-relaxed">{t.description}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="btn-primary w-full">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-[#d4e4fa]">Name your room</h2>
                <p className="text-sm text-[#7090b0] mt-1">Starting with: <span style={{ color: activityConfig.color }}>{activityConfig.label}</span></p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#d4e4fa]">Room name (optional)</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    placeholder={template.name}
                    maxLength={40}
                    className="input-nexus"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#d4e4fa]">Visibility</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: true, Icon: Globe, label: 'Public', desc: 'Anyone can find & join' },
                      { value: false, Icon: Lock, label: 'Private', desc: 'Link-only access' },
                    ].map(({ value, Icon, label, desc }) => (
                      <button
                        key={label}
                        onClick={() => setIsPublic(value)}
                        className={cn(
                          'glass-card p-4 text-left transition-all rounded-xl',
                          isPublic === value
                            ? 'border-[#00f2ff]/40 bg-[#00f2ff]/5'
                            : 'hover:border-white/16'
                        )}
                      >
                        <Icon className="w-4 h-4 mb-2" style={{ color: isPublic === value ? '#00f2ff' : '#7090b0' }} />
                        <p className="font-semibold text-sm text-[#d4e4fa]">{label}</p>
                        <p className="text-xs text-[#7090b0] mt-0.5">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-subtle flex-1">Back</button>
                <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Room'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-[#7090b0] mt-6">
          Already have a code?{' '}
          <Link href="/room/join" className="text-[#00f2ff] hover:underline">Join a room</Link>
        </p>
      </div>
    </main>
  )
}
