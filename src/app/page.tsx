import Link from 'next/link'
import { ArrowRight, PenTool, Clapperboard, BrainCircuit, Users, Zap, Shield } from 'lucide-react'
import NexusLogo from '@/components/layout/NexusLogo'

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Ambient background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,242,255,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(188,19,254,0.08) 0%, transparent 70%)' }} />
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-white/5">
        <NexusLogo size={30} showText />
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-subtle text-sm">Sign In</Link>
          <Link href="/room/create" className="btn-primary text-sm">
            Create Room
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        {/* Badge */}
        <div className="badge-cyan mb-6 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse" />
          Live Beta — No account required
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 animate-slide-up"
          style={{ animationDelay: '0.05s' }}>
          Where your{' '}
          <span className="text-gradient-nexus">hangout</span>
          <br />lives.
        </h1>

        <p className="text-lg md:text-xl text-[#7090b0] max-w-xl mb-10 leading-relaxed animate-slide-up"
          style={{ animationDelay: '0.1s' }}>
          Real-time rooms for drawing, competitive games, watch parties and more.
          Jump in instantly — no download, no account needed.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <Link href="/room/create" className="btn-primary px-8 py-3 text-base">
            Create a Room
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/room/join" className="btn-ghost px-8 py-3 text-base">
            Join with Code
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-sm text-[#7090b0] animate-fade-in" style={{ animationDelay: '0.3s' }}>
          No signup · Instant rooms · Sync across all devices
        </p>
      </section>

      {/* Activities showcase */}
      <section className="px-6 pb-16 md:px-12">
        <h2 className="text-center text-2xl font-bold mb-8 text-[#d4e4fa]">
          8 ways to hang out
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {FEATURE_CARDS.map((card, i) => (
            <div
              key={card.title}
              className="glass-card p-5 flex flex-col gap-3 hover:border-white/16 transition-all duration-200 group animate-slide-up"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}
              >
                <card.Icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#d4e4fa]">{card.title}</p>
                <p className="text-xs text-[#7090b0] mt-0.5 leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature highlight grid */}
      <section className="px-6 pb-20 md:px-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { Icon: Zap, color: '#00f2ff', title: 'Instant rooms', desc: 'Create a room in one click. Share the link. Done.' },
            { Icon: Users, color: '#bc13fe', title: 'Live presence', desc: "See who's in the room, their status, and cursor." },
            { Icon: Shield, color: '#22c55e', title: 'Guest-friendly', desc: 'No login required. Just enter and play.' },
          ].map(({ Icon, color, title, desc }) => (
            <div key={title} className="glass-card p-6 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <h3 className="font-bold text-[#d4e4fa]">{title}</h3>
                <p className="text-sm text-[#7090b0] mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-[#7090b0]">
        <NexusLogo size={20} showText={false} className="inline-flex mr-2" />
        Nexus — built for real-time connection
      </footer>
    </main>
  )
}

const FEATURE_CARDS = [
  { title: 'Whiteboard', desc: 'Draw together live', color: '#00f2ff', Icon: PenTool },
  { title: 'Pictionary', desc: 'Draw & guess rounds', color: '#f59e0b', Icon: PenTool },
  { title: 'Word Guess', desc: 'Shared Wordle', color: '#22c55e', Icon: Zap },
  { title: 'Trivia', desc: '10 timed questions', color: '#a855f7', Icon: BrainCircuit },
  { title: 'Watch Party', desc: 'YouTube in sync', color: '#ef4444', Icon: Clapperboard },
  { title: 'Tic Tac Toe', desc: '2-player classic', color: '#3b82f6', Icon: Shield },
  { title: 'Chess', desc: 'Turn-based match', color: '#e2e8f0', Icon: Zap },
  { title: 'Rock Paper Scissors', desc: 'Best of 5 series', color: '#f97316', Icon: Users },
]
