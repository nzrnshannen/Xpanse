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
              Xpanse utilizes highly-optimized WebSocket runtimes under FastAPI to coordinate real-time board updates and chat logs instantly to React clients.
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
        <div className="mx-auto max-w-7xl px-6 sm:px-8 flex justify-center items-center gap-8">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
        <div className="mx-auto max-w-7xl px-6 sm:px-8 mt-8 pt-8 border-t border-white/[0.03] flex flex-col sm:flex-row items-center justify-center gap-3 text-center text-[10px]">
          <div className="flex items-center justify-center w-5 h-5">
            <img src="/logo.svg" alt="XE Logo" className="w-full h-full drop-shadow-sm opacity-80" />
          </div>
          <span>&copy; {new Date().getFullYear()} Xpanse Technologies, Inc. All rights reserved.</span>
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
