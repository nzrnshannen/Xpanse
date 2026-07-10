import React from 'react';
import { ArrowRight, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroProps {
  onGetStartedClick: () => void;
  onJoinInviteClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStartedClick, onJoinInviteClick }) => {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
      {/* Decorative Grid & Glow Mesh backgrounds */}
      <div className="grid-bg" />
      <div className="glow-mesh" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center sm:px-8">
        {/* Release Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-1.5 text-xs text-purple-200 backdrop-blur-sm mb-6"
        >
          <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          Introducing Expanse 1.0 — Unified Team Horizons
        </motion.div>

        {/* Main Title & Tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-5xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl"
        >
          <span className="bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Expanse
          </span>
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-display mt-4 text-2xl font-semibold tracking-tight text-purple-300 sm:text-4xl bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent"
        >
          One Space. Infinite Ways to Collaborate.
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg"
        >
          Bring your project boards and team group chats under a single, unified horizon. 
          Grant full access to your entire space, or pinpoint permissions down to a single room.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onGetStartedClick}
            className="group relative inline-flex h-12 items-center justify-center gap-1.5 overflow-hidden rounded-full bg-white px-6 font-semibold text-black transition-all hover:bg-neutral-200 w-full sm:w-auto cursor-pointer"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          
          <button
            onClick={onJoinInviteClick}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-6 text-sm font-medium text-neutral-300 backdrop-blur-sm transition-all hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white w-full sm:w-auto cursor-pointer"
          >
            <KeyRound className="h-4 w-4 text-purple-400 transition-transform group-hover:-rotate-12" />
            Join via Invite Link
          </button>
        </motion.div>

        {/* Workspace Visual Preview Frame */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative mt-16 sm:mt-20 mx-auto max-w-4xl rounded-2xl border border-white/[0.08] bg-neutral-900/20 p-2 backdrop-blur-3xl"
        >
          <div className="overflow-hidden rounded-xl border border-white/[0.05] bg-black/60 aspect-[16/9] shadow-2xl flex flex-col">
            {/* Header window control UI */}
            <div className="flex h-10 items-center justify-between border-b border-white/[0.05] bg-neutral-950/40 px-4">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-neutral-800" />
                <span className="h-3 w-3 rounded-full bg-neutral-800" />
                <span className="h-3 w-3 rounded-full bg-neutral-800" />
              </div>
              <div className="text-[10px] text-neutral-500 font-mono tracking-wider">workspace.expanse.app</div>
              <div className="w-12" />
            </div>
            
            {/* Content area: Minimal dashboard mock layout */}
            <div className="flex-1 flex flex-col justify-center items-center text-left p-8 relative">
              {/* Subtle background graphics */}
              <div className="absolute inset-0 bg-radial-gradient from-purple-500/5 via-transparent to-transparent pointer-events-none" />
              
              <div className="max-w-md text-center z-10 flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/20 mb-4">
                  E
                </div>
                <h3 className="text-white text-lg font-medium tracking-tight">Your Infinite Collaboration Workspace</h3>
                <p className="text-neutral-500 text-xs mt-2 px-6">
                  Interactive boards, real-time channels, and workspace boundaries. Experience how everything connects.
                </p>
                <div className="mt-6 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <span className="inline-block h-6 w-6 rounded-full ring-2 ring-black bg-neutral-800 text-[9px] flex items-center justify-center font-bold">JD</span>
                    <span className="inline-block h-6 w-6 rounded-full ring-2 ring-black bg-neutral-700 text-[9px] flex items-center justify-center font-bold">AS</span>
                    <span className="inline-block h-6 w-6 rounded-full ring-2 ring-black bg-purple-950 text-purple-300 text-[9px] flex items-center justify-center font-bold">+4</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">6 team members online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative glowing gradient stripes on bottom */}
          <div className="absolute -bottom-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent blur-sm" />
          <div className="absolute -bottom-px left-20 right-20 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};
