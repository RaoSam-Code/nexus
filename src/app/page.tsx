import Link from "next/link";
import { ArrowRight, Users, Zap, MonitorPlay } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="z-10 flex flex-col items-center text-center max-w-4xl space-y-8">
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm text-purple-200 mb-4">
          <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Live Beta
        </div>

        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter">
          Connect through <br />
          <span className="text-gradient">Shared Moments</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl">
          Forget boring text chats. Nexus brings you together with real-time activities.
          Watch, play, and create in sync.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/room/create"
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-primary px-8 font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
          >
            <span className="mr-2">Start a Room</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </Link>

          <Link
            href="/room/join"
            className="inline-flex h-12 items-center justify-center rounded-md border border-white/10 bg-white/5 px-8 font-medium text-white transition-colors hover:bg-white/10 backdrop-blur-sm"
          >
            Join Existing
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full">
          <FeatureCard
            icon={<Users className="h-6 w-6 text-blue-400" />}
            title="Real-time Presence"
            description="See who's with you instantly. Feel the connection."
          />
          <FeatureCard
            icon={<MonitorPlay className="h-6 w-6 text-pink-400" />}
            title="Watch Parties"
            description="Sync YouTube videos perfectly. Laugh together."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6 text-yellow-400" />}
            title="Instant Games"
            description="Jump into Whiteboard or Word Guess in seconds."
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-panel p-6 rounded-xl flex flex-col items-center text-center hover:bg-white/10 transition-colors duration-300">
      <div className="p-3 rounded-full bg-white/5 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
