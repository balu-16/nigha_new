import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-accent rounded-full animate-pulse-glow delay-150" />
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse-glow delay-300" />
      </div>

      {/* Header */}
      <header className="relative z-10 glass-light dark:glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary neon-glow-cyan" />
            <h1 className="text-2xl font-bold neon-text-cyan">IndustriOS</h1>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#home" className="text-foreground/80 hover:text-primary transition-colors">Home</a>
            <a href="#about" className="text-foreground/80 hover:text-primary transition-colors">About</a>
            <a href="#contact" className="text-foreground/80 hover:text-primary transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-6 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center">
        <div className="space-y-8 max-w-4xl">
          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-bold leading-tight">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] neon-glow-cyan">
              Industrial Smart Dashboard
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Real-time Monitoring of Pressure, Temperature & Distance
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-6 justify-center pt-8">
            <Button
              size="lg"
              onClick={() => navigate('/login')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground neon-glow-cyan px-8 py-6 text-lg font-semibold rounded-xl transition-all hover:scale-105"
            >
              Login
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/signup')}
              className="border-2 border-accent hover:bg-accent/10 neon-border-cyan px-8 py-6 text-lg font-semibold rounded-xl transition-all hover:scale-105"
            >
              Sign Up
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            <div className="glass-light dark:glass p-6 rounded-xl border border-primary/20 hover:border-primary/50 transition-all">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-sm text-muted-foreground">Monitor critical metrics in real-time with advanced visualizations</p>
            </div>
            <div className="glass-light dark:glass p-6 rounded-xl border border-accent/20 hover:border-accent/50 transition-all">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold mb-2">Secure Access</h3>
              <p className="text-sm text-muted-foreground">Enterprise-grade security for your industrial data</p>
            </div>
            <div className="glass-light dark:glass p-6 rounded-xl border border-primary/20 hover:border-primary/50 transition-all">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">Instant updates and responsive interface for critical operations</p>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .delay-150 {
          animation-delay: 150ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
};

export default Landing;
