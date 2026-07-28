'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail, Loader2, ArrowRight, User } from 'lucide-react'
import NexusLogo from '@/components/layout/NexusLogo'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  const handleGuest = () => {
    const id = localStorage.getItem('anonymous_user_id') || crypto.randomUUID()
    const guestEmail = `guest_${id.slice(0, 8)}@nexus.local`
    localStorage.setItem('anonymous_user_id', id)
    localStorage.setItem('anonymous_user_email', guestEmail)
    router.push('/room/create')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {/* Bg blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,242,255,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(188,19,254,0.07) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex">
            <NexusLogo size={36} showText />
          </Link>
          <p className="mt-3 text-[#7090b0]">Sign in to save your identity</p>
        </div>

        <div className="glass-card p-8 space-y-6">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-[#00f2ff]/10 border border-[#00f2ff]/20 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-[#00f2ff]" />
              </div>
              <div>
                <p className="font-semibold text-[#d4e4fa]">Check your email</p>
                <p className="text-sm text-[#7090b0] mt-1">We sent a magic link to <strong className="text-[#d4e4fa]">{email}</strong></p>
              </div>
              <button onClick={() => { setSent(false); setEmail('') }} className="btn-subtle text-sm">
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-[#d4e4fa]">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7090b0]" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-nexus pl-10"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      Send Magic Link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/8" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-xs text-[#7090b0] bg-[#051424]">or</span>
                </div>
              </div>

              <button onClick={handleGuest} className="btn-ghost w-full">
                <User className="w-4 h-4" />
                Continue as Guest
              </button>

              <p className="text-center text-xs text-[#7090b0]">
                Guest mode is ephemeral — your progress won't persist across sessions.
              </p>
            </>
          )}
        </div>

        <p className="text-center text-sm text-[#7090b0] mt-6">
          Just want to jump in?{' '}
          <Link href="/room/create" className="text-[#00f2ff] hover:underline">
            Create a room without signing in
          </Link>
        </p>
      </div>
    </main>
  )
}
