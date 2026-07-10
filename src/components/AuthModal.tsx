import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'signup';
  onAuthSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Update state if initialMode changes while opened
  useEffect(() => {
    setMode(initialMode);
    // Reset form states
    setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
  }, [initialMode, isOpen]);

  // Escape key event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear errors for this input field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'signup' && !formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API request to backend (FastAPI proxy mock)
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Auto close modal after successful mockup authentication
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
        onAuthSuccess(formData.email);
      }, 1500);
    }, 1200);
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOutsideClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-950 p-8 shadow-2xl"
          >
            {/* Background glowing gradients */}
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 hover:bg-white/[0.05] hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {submitSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-12"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 animate-bounce">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {mode === 'login' ? 'Welcome Back!' : 'Account Created!'}
                </h3>
                <p className="text-sm text-neutral-400 mt-2">
                  {mode === 'login' ? 'Redirecting to your workspace...' : 'Setting up your space horizon...'}
                </p>
              </motion.div>
            ) : (
              <div>
                {/* Header */}
                <div className="mb-8">
                  <h3 className="font-display text-2xl font-bold text-white">
                    {mode === 'login' ? 'Welcome back to Expanse' : 'Create your Space'}
                  </h3>
                  <p className="text-sm text-neutral-400 mt-2">
                    {mode === 'login' 
                      ? 'Access your unified horizons and project boards.' 
                      : 'Bring your group chats and Kanban cards together.'}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <label htmlFor="fullName" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className={`w-full rounded-lg border bg-neutral-900/50 py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors ${errors.fullName ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-purple-500'}`}
                          placeholder="Jane Doe"
                        />
                      </div>
                      {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border bg-neutral-900/50 py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-purple-500'}`}
                        placeholder="jane@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border bg-neutral-900/50 py-3 pl-11 pr-12 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors ${errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-purple-500'}`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 rounded p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <label htmlFor="confirmPassword" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-500" />
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full rounded-lg border bg-neutral-900/50 py-3 pl-11 pr-12 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors ${errors.confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-white/[0.08] focus:border-purple-500'}`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 rounded p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full relative inline-flex items-center justify-center h-12 rounded-lg bg-white text-black font-semibold hover:bg-neutral-200 transition-colors duration-200 mt-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Authentication...
                      </span>
                    ) : (
                      <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                    )}
                  </button>
                </form>

                {/* Switch Login/Signup button */}
                <div className="mt-6 text-center text-xs">
                  <span className="text-neutral-400">
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  </span>{' '}
                  <button
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      setErrors({});
                    }}
                    className="text-purple-400 font-semibold hover:underline bg-transparent border-0 cursor-pointer pl-1"
                  >
                    {mode === 'login' ? 'Sign up' : 'Log in'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
