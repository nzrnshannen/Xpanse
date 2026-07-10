import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeatureGrid } from './components/FeatureGrid';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { Compass } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // If user is authenticated, load the dashboard interface
  if (currentUserEmail) {
    return (
      <Dashboard 
        userEmail={currentUserEmail} 
        onLogout={() => setCurrentUserEmail(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex flex-col justify-between selection:bg-purple-500/30 selection:text-white">
      {/* Navigation Header */}
      <Navbar 
        onLoginClick={() => openAuth('login')} 
        onSignupClick={() => openAuth('signup')} 
      />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <Hero 
          onGetStartedClick={() => openAuth('signup')} 
          onJoinInviteClick={() => openAuth('signup')} 
        />

        {/* Feature Preview Section */}
        <FeatureGrid />

        {/* Integration Callout Section - Minimal design focus */}
        <section className="border-t border-white/[0.04] bg-neutral-950/20 py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-indigo-500/[0.01] via-transparent to-transparent pointer-events-none" />
          
          <div className="mx-auto max-w-4xl px-6 text-center sm:px-8">
            <h3 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Powering FastAPI & React Ecosystems
            </h3>
            <p className="mt-4 text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
              Expanse utilizes highly-optimized WebSocket runtimes under FastAPI to coordinate real-time board updates and chat logs instantly to React clients.
            </p>
            <div className="mt-8 flex justify-center items-center gap-6">
              <span className="text-xs text-neutral-500 border border-white/[0.05] rounded-full px-3.5 py-1.5 bg-neutral-900/50">
                🚀 FastAPI backend API ready
              </span>
              <span className="text-xs text-neutral-500 border border-white/[0.05] rounded-full px-3.5 py-1.5 bg-neutral-900/50">
                🔒 OAuth2 with JWT validation
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Modern, Minimalist Footer */}
      <footer className="border-t border-white/[0.05] bg-black py-12 text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <span className="font-display font-bold text-white tracking-tight text-sm">Expanse</span>
          </div>
          
          <div className="flex items-center gap-8">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" aria-label="Twitter" className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.02] text-neutral-400 hover:text-white transition-colors">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" aria-label="GitHub" className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.02] text-neutral-400 hover:text-white transition-colors">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 sm:px-8 mt-8 pt-8 border-t border-white/[0.03] text-center text-[10px]">
          &copy; {new Date().getFullYear()} Expanse Technologies, Inc. All rights reserved.
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        initialMode={authMode} 
        onAuthSuccess={(email) => setCurrentUserEmail(email)}
      />
    </div>
  );
};

export default App;
