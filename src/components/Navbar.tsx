import React, { useState } from 'react';
import { Menu, X, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onSignupClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Solutions', href: '#solutions' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Documentation', href: '#docs' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.05] bg-black/40 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6 sm:px-8">
        {/* Left Side: Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 transition-all duration-300 group-hover:border-purple-500/60 group-hover:bg-purple-500/20">
            <Compass className="h-5 w-5 transition-transform duration-500 group-hover:rotate-45" />
            <div className="absolute inset-0 -z-10 rounded-lg bg-purple-500/20 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-purple-300">
            Expanse
          </span>
        </a>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-neutral-400 transition-colors duration-200 hover:text-white"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right Side: Desktop CTA buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={onLoginClick}
            className="text-sm font-medium text-neutral-400 transition-colors duration-200 hover:text-white px-4 py-2"
          >
            Log In
          </button>
          <button
            onClick={onSignupClick}
            className="relative inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-neutral-200 transition-colors duration-200"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-neutral-400 hover:text-white md:hidden"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-white/[0.05] bg-black/95 md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-neutral-400 hover:text-white"
                >
                  {link.name}
                </a>
              ))}
              <div className="h-px bg-white/[0.05] my-2" />
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLoginClick();
                  }}
                  className="w-full text-center py-2.5 text-base font-medium text-neutral-400 hover:text-white border border-white/[0.05] rounded-lg"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignupClick();
                  }}
                  className="w-full text-center py-2.5 text-base font-semibold text-black bg-white rounded-lg hover:bg-neutral-200"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
