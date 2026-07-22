import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Plus, CheckCircle2 } from 'lucide-react';

interface MeetingMinutesModalProps {
  onClose: () => void;
  onConvertToTask: (title: string, assignee: string) => void;
}

export function MeetingMinutesModal({ onClose, onConvertToTask }: MeetingMinutesModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [convertedItems, setConvertedItems] = useState<Set<number>>(new Set());

  // Mock AI MoM data
  const mockMoM = {
    summary: "The team discussed the upcoming Q3 product launch. Key focus areas were stabilizing the new WebSocket architecture and finalizing the real-time AI Minutes feature. Everyone agreed on the release timeline for next Friday.",
    decisions: [
      "We will prioritize the WebRTC feature over the new themes.",
      "The release candidate will be deployed to staging by Tuesday.",
      "Marketing will hold off on the newsletter until the final QA sign-off."
    ],
    actionItems: [
      { id: 1, title: "Implement WebRTC signaling endpoints", assignee: "Sarah Connor" },
      { id: 2, title: "Write end-to-end tests for MoM extraction", assignee: "John Doe" },
      { id: 3, title: "Draft release notes for Q3 update", assignee: "Unassigned" }
    ]
  };

  useEffect(() => {
    // Simulate AI generation delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleConvert = (id: number, title: string, assignee: string) => {
    onConvertToTask(title, assignee);
    setConvertedItems(prev => new Set(prev).add(id));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#0c0c0e] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-4 border-b border-white/[0.05] flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-white">Meeting Minutes</h2>
          </div>
          {!isLoading && (
            <button 
              onClick={onClose}
              className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Close
            </button>
          )}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
              <h3 className="text-sm font-semibold text-white mb-2">Generating Minutes...</h3>
              <p className="text-xs text-neutral-400">Xpanse AI is generating your Meeting Minutes...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <section>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Executive Summary</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {mockMoM.summary}
                </p>
              </section>

              <section>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Key Decisions</h3>
                <ul className="space-y-2">
                  {mockMoM.decisions.map((decision, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-neutral-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Action Items</h3>
                <div className="space-y-2">
                  {mockMoM.actionItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{item.title}</span>
                          <span className="text-xs text-neutral-500">Assignee: {item.assignee}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleConvert(item.id, item.title, item.assignee)}
                        disabled={convertedItems.has(item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          convertedItems.has(item.id) 
                            ? 'bg-emerald-500/10 text-emerald-500 cursor-not-allowed'
                            : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                        }`}
                      >
                        {convertedItems.has(item.id) ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Converted
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Convert to Kanban Card
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
