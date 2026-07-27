import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Construction } from 'lucide-react';

export function DevNoticeModal() {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 border border-purple-500/20">
                <Construction className="w-8 h-8 text-purple-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                System Under Active Development
              </h2>
              
              <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
                Welcome to Xpanse! Please note that our platform is currently in active development. You may encounter incomplete features, testing data, or occasional instability as we prepare for our official release.
              </p>
              
              <button
                onClick={handleDismiss}
                className="w-full py-3 px-6 bg-white text-black hover:bg-neutral-200 font-bold rounded-xl transition-colors"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
