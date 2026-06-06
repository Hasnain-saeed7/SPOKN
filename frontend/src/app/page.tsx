import Link from "next/link";
import { Mic, Users, TrendingUp, Sparkles, Activity, Target, MessageSquare } from "lucide-react";
import DemoWidget from "@/components/landing/DemoWidget";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080c10] text-[#f8fafc] font-sans overflow-x-hidden">
      
      {/* Top Navbar */}
      <nav className="border-b border-[#0f1923] bg-[#080c10]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-[#06b6d4] p-2 rounded-xl text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Mic className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-[#67e8f9]">
            SPOKN
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-[#67e8f9] transition-colors">
            Login
          </Link>
          <Link href="/register" className="px-4 py-2 bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/50 rounded-full text-sm font-semibold hover:bg-[#06b6d4] hover:text-slate-900 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className=" mx-auto px-4 pt-16 pb-24 text-center relative bg-white">
        {/* Ambient Glow */}
        <div className="bg-white"></div>

        <div className="relative z-10 space-y-6 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0f1923] border border-[#06b6d4]/20 rounded-full text-xs font-semibold tracking-wider text-[#67e8f9]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#67e8f9] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#06b6d4]"></span>
            </span>
            Built for Pakistan 🇵🇰
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black max-w-4xl mx-auto leading-tight">
            Speak English. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-[#67e8f9]">Confidently.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-black max-w-2xl mx-auto">
            Practice with AI or real partners. Get instant feedback on grammar, pronunciation and fluency without the fear of judgment.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-[#06b6d4] hover:bg-[#0891b2] text-[#080c10] rounded-full font-bold text-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-105 transition-all">
              Start Free Demo
            </Link>
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-black hover:bg-[#06b6d4]/10 text-black rounded-full font-semibold text-lg transition-all">
              Create Account
            </Link>
          </div>
        </div>
      </main>

      {/* Demo Section */}
      <section className="py-20 bg-black border-[#0f1923] relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-12 items-center justify-between">
          <div className="md:w-1/2 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Try it right now — <br/><span className="text-[#06b6d4]">no signup needed.</span></h2>
            <p className="text-white text-lg">
              Press the microphone and speak naturally. Our AI will reply in real-time. Experience 2 minutes of judgment-free conversation practice. 
            </p>
            <ul className="space-y-4 pt-2">
              {[
                "Instant voice-to-text response",
                "Natural conversational flow",
                "Works directly in your browser"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#06b6d4]/20 flex items-center justify-center text-cyan-500">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:w-1/2 w-full flex justify-center">
            <DemoWidget />
          </div>
        </div>
      </section>









      {/* How It Works */}
      <section className="py-24  mx-auto px-4 relative z-10 bg-sky-100">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-black">How SPOKN  Works</h2>
          <p className="text-black text-2xl">Three simple steps to English fluency.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Speak",
              desc: "Press the mic and talk naturally. No typing required. Just use your voice.",
              icon: Mic
            },
            {
              step: "02",
              title: "Get Matched",
              desc: "Instantly connect with a real partner or our 24/7 AI tutor for live practice.",
              icon: Users
            },
            {
              step: "03",
              title: "Improve",
              desc: "Get your fluency score and a detailed report on mistakes and pronunciation.",
              icon: TrendingUp
            }
          ].map((s, i) => (
            <div key={i} className="bg-white border border-white/5 rounded-3xl p-8 hover:-translate-y-2 transition-transform duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#06b6d4] to-[#67e8f9] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-[#06b6d4] font-mono text-sm font-bold mb-4">STEP {s.step}</div>
              <div className="w-14 h-14 rounded-2xl bg-[#0891b2]/20 text-cyan-900 flex items-center justify-center mb-6">
                <s.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-black">{s.title}</h3>
              <p className="text-black leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-olive-600 border-t border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to succeed</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
            <div className="bg-white backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#06b6d4] to-[#67e8f9] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Sparkles className="w-8 h-8 text-[#06b6d4] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-black">AI Speaking Partner</h3>
              <p className="text-black">Available 24/7. Practice everyday scenarios without anxiousness or pressure. Gentle grammar corrections.</p>
            </div>
            
            <div className="bg-white backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#06b6d4] to-[#67e8f9] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <MessageSquare className="w-8 h-8 text-[#06b6d4] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-black">Live Peer Rooms</h3>
              <p className="text-black">Match with English learners across Pakistan. Secure WebRTC p2p encrypted audio calls.</p>
            </div>
            
            <div className="bg-white backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#06b6d4] to-[#67e8f9] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Activity className="w-8 h-8 text-[#06b6d4] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-black">Pronunciation Scorer</h3>
              <p className="text-black">Advanced AI analyzes your speech at the phoneme level. Spot exact sounds you struggle with (e.g., 'v' vs 'w').</p>
            </div>
            
            <div className="bg-white backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#06b6d4] to-[#67e8f9] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Target className="w-8 h-8 text-[#06b6d4] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-black">Progress Dashboard</h3>
              <p className="text-black">Track your daily streaks, fluency score growth, and review past transcripts to measure improvement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-emerald-200 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-black">Loved by learners in Pakistan</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Ahmed from Lahore", role: "Software Engineer", text: "I could write code in English perfectly but struggled in interviews. BolEnglish gave me the confidence to speak up in daily standups." },
              { name: "Sara from Karachi", role: "University Student", text: "The AI partner feels so real. I practice every night for 15 minutes before sleeping. My pronunciation score has gone from 60 to 85!" },
              { name: "Usman from Islamabad", role: "Freelancer", text: "Having a safe space to make mistakes is game changing. The peer rooms connect me with people who are also learning." }
            ].map((t, i) => (
              <div key={i} className="bg-white border border-white/5 p-6 rounded-3xl  hover:-translate-y-2 transition-transform duration-300 relative group overflow-hidden  ">
                <div className="text-[#06b6d4] mb-4">★★★★★</div>
                <p className="text-black mb-6 italic">"{t.text}"</p>
                <div>
                  <h4 className="font-bold text-black">{t.name}</h4>
                  <p className="text-xs text-black">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t bg-fuchsia-100 py-12 text-center text-slate-500 z-10 relative">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Mic className="w-5 h-5 text-[#06b6d4]" />
          <span className="text-xl font-bold text-black">SPOKN</span>
        </div>
        <p className="mb-8 text-sm">Empowering communication everywhere.</p>
        <div className="flex justify-center gap-6 text-sm mb-8">
          <Link href="#" className="hover:text-black transition-colors">About</Link>
          <Link href="#" className="hover:text-black transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-black transition-colors">Contact</Link>
        </div>
        <div className="text-[#06b6d4] bg-[#06b6d4]/10 inline-block px-4 py-1.5 rounded-full text-xs font-semibold">
           Made in Pakistan 🇵🇰
        </div>
      </footer>

    </div>
  );
}