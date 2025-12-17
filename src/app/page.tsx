import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Target, Briefcase, TrendingUp, Shield, Cpu, Play } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Stratford</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#engine" className="hover:text-white transition-colors">The Engine</a>
            <a href="#pricing" className="hover:text-white transition-colors">Access</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white">
                Log In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" variant="cosmic" className="shadow-lg shadow-primary/20">
                Launch App
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-30 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Quantum Engine Online v2.4
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Wealth Creation <br />
            <span className="text-white">Redefined by Physics</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            Stop managing assets. Start generating them. Stratford combines 
            <span className="text-white font-medium"> Quantum Algorithms</span>, 
            <span className="text-white font-medium"> Predictive AI</span>, and 
            <span className="text-white font-medium"> Arbitrage Engines</span> to identify asymmetric opportunities across Stocks, Sports, and Business Acquisitions.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-zinc-200 w-full sm:w-auto">
                Enter Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/quantum">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10 w-full sm:w-auto">
                View Live Signals
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5 pt-12 animate-in fade-in duration-1000 delay-500">
            {[
              { label: "Active Signals", value: "14/sec" },
              { label: "Prediction Accuracy", value: "87.4%" },
              { label: "Capital Deployed", value: "$4.2M+" },
              { label: "Quantum Qubits", value: "Simulated" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-zinc-500 uppercase tracking-wider font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Multi-Vector Wealth Generation</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              We don't just track the S&P 500. We hunt for alpha in every liquidity pool available.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-black border border-white/5 hover:border-primary/50 transition-colors group">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Cpu className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Quantum Prediction</h3>
              <p className="text-zinc-400 leading-relaxed">
                Utilizes the QAOA algorithm on IBM Qiskit simulators to solve complex portfolio optimization problems, finding the mathematical "ground state" of maximum return for minimal risk.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-black border border-white/5 hover:border-purple-500/50 transition-colors group">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <Target className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Statistical Arbitrage</h3>
              <p className="text-zinc-400 leading-relaxed">
                Scans live sports odds and event markets for "Positive EV" (Expected Value) discrepancies. Identify where the bookmakers are wrong and the math is right.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-black border border-white/5 hover:border-blue-500/50 transition-colors group">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <Briefcase className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Acquisition Scout</h3>
              <p className="text-zinc-400 leading-relaxed">
                Procedurally generates and identifies undervalued business assets, distressed real estate, and high-cashflow turnaround opportunities for direct purchase.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to execute?</h2>
          <p className="text-xl text-zinc-400 mb-10">
            The market waits for no one. Initialize your wealth engine and start receiving high-probability signals today.
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="cosmic" className="h-14 px-10 text-lg shadow-2xl shadow-primary/20">
              <Play className="mr-2 h-5 w-5 fill-current" /> Initialize Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-zinc-500" />
            <span className="font-bold text-zinc-300">Stratford AI</span>
          </div>
          <div className="text-sm text-zinc-600">
            © 2025 Stratford Systems. All rights reserved. Not financial advice.
          </div>
        </div>
      </footer>
    </div>
  );
}
