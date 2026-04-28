import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />

      <main className="z-10 flex flex-col items-center text-center max-w-4xl w-full">
        <div className="glass-card p-12 rounded-3xl w-full flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-8 pb-4 text-glow bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 leading-tight">
            Elevate Your <br /> Teaching Mastery
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
            Experience next-generation AI evaluation. Analyze your speech patterns, confidence, and clarity in real-time to become the perfect tutor.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md justify-center">
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(100,50,255,0.4)]"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-card hover:bg-accent/10 border border-border text-foreground rounded-full font-semibold text-lg transition-all hover:scale-105 active:scale-95"
            >
              Join the Beta
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {[
            { title: "Voice Analysis", desc: "Real-time filler word & hesitation detection." },
            { title: "AI Feedback", desc: "Granular scoring on clarity and patience." },
            { title: "Progress Tracking", desc: "Beautiful dashboards to track your growth." }
          ].map((feature, i) => (
            <div key={i} className="glass p-6 rounded-2xl flex flex-col items-start hover:-translate-y-2 transition-transform duration-300">
              <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
