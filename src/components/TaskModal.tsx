import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  CheckSquare,   
  Calendar, 
  Tag, 
  User,
  Eye,
  Edit3
} from 'lucide-react';
import type { Task } from './Dashboard'; // We'll need to export Task from Dashboard

import { Trash2 } from 'lucide-react';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave, onDelete }) => {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [savedTask, setSavedTask] = useState<Task>(task);
  const [isPreview, setIsPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'preview' | 'close' | null>(null);
  
  const hasUnsavedChanges = JSON.stringify(editedTask) !== JSON.stringify(savedTask);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when switching to edit mode
  useEffect(() => {
    if (!isPreview && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isPreview]);

  // Check for unsaved changes before closing
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setConfirmAction('close');
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    onSave(editedTask);
    setSavedTask(editedTask);
  };

  const handleDiscard = () => {
    setEditedTask(savedTask);
  };

  // Handle Markdown Checklist toggles in Preview mode
  const handleChecklistToggle = (index: number) => {
    const lines = (editedTask.description || '').split('\n');
    let checkboxCount = 0;
    
    const newLines = lines.map(line => {
      if (line.match(/^(\s*)-\s+\[([ xX])\](.*)/)) {
        if (checkboxCount === index) {
          const isChecked = line.includes('[x]') || line.includes('[X]');
          return line.replace(/-\s+\[([ xX])\]/, isChecked ? '- [ ]' : '- [x]');
        }
        checkboxCount++;
      }
      return line;
    });

    const newDesc = newLines.join('\n');
    setEditedTask({ ...editedTask, description: newDesc });
  };

  // Custom Markdown Parser
  const renderMarkdown = (text: string) => {
    if (!text) return <p className="text-neutral-500 italic text-sm">No description provided.</p>;

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let checkboxCount = 0;

    const flushList = () => {
      if (listType === 'ul' && listItems.length > 0) {
        elements.push(<ul key={elements.length} className="list-disc pl-5 mb-4 text-sm text-neutral-300 space-y-1">{listItems}</ul>);
      } else if (listType === 'ol' && listItems.length > 0) {
        elements.push(<ol key={elements.length} className="list-decimal pl-5 mb-4 text-sm text-neutral-300 space-y-1">{listItems}</ol>);
      }
      listItems = [];
      listType = null;
    };

    lines.forEach((line, i) => {
      // Bold/Italic formatting function for inline text
      const formatInline = (str: string) => {
        let res = str;
        res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
        return <span dangerouslySetInnerHTML={{ __html: res }} />;
      };

      // Checklists
      const checkMatch = line.match(/^(\s*)-\s+\[([ xX])\](.*)/);
      if (checkMatch) {
        flushList();
        const isChecked = checkMatch[2].toLowerCase() === 'x';
        const currentIndex = checkboxCount++;
        elements.push(
          <div key={`check-${i}`} className="flex items-start gap-2 mb-2 group">
            <button 
              onClick={() => handleChecklistToggle(currentIndex)}
              className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                isChecked ? 'bg-purple-500 border-purple-500 text-white' : 'border-white/[0.2] hover:border-purple-400'
              }`}
            >
              {isChecked && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </button>
            <span className={`text-sm ${isChecked ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
              {formatInline(checkMatch[3])}
            </span>
          </div>
        );
        return;
      }

      // Unordered Lists
      const ulMatch = line.match(/^(\s*)-\s+(.*)/);
      if (ulMatch && !line.match(/^(\s*)-\s+\[/)) {
        if (listType !== 'ul') flushList();
        listType = 'ul';
        listItems.push(<li key={`ul-${i}`}>{formatInline(ulMatch[2])}</li>);
        return;
      }

      // Ordered Lists
      const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
      if (olMatch) {
        if (listType !== 'ol') flushList();
        listType = 'ol';
        listItems.push(<li key={`ol-${i}`}>{formatInline(olMatch[2])}</li>);
        return;
      }

      // Paragraphs
      flushList();
      if (line.trim() === '') {
        elements.push(<div key={`br-${i}`} className="h-2" />);
      } else {
        elements.push(<p key={`p-${i}`} className="mb-2 text-sm text-neutral-300">{formatInline(line)}</p>);
      }
    });

    flushList();
    return elements;
  };

  // Toolbar actions
  const insertText = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = editedTask.description || '';
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end, text.length);
    
    setEditedTask({
      ...editedTask,
      description: before + prefix + selected + suffix + after
    });
    
    // Reset focus and selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 0);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-[#0c0c0e] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden m-4"
        >
          {/* Unsaved Changes Confirmation Modal Overlay */}
          <AnimatePresence>
            {confirmAction && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-neutral-900 border border-white/[0.08] p-6 rounded-xl shadow-2xl max-w-sm w-full text-center m-4"
                >
                  <h3 className="text-sm font-bold text-white mb-2">Unsaved Changes</h3>
                  <p className="text-xs text-neutral-400 mb-6">
                    You have unsaved changes. Do you want to save or discard them?
                  </p>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        handleSave();
                        if (confirmAction === 'preview') {
                          setIsPreview(true);
                          setConfirmAction(null);
                        } else {
                          onClose();
                        }
                      }}
                      className="w-full py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/20 rounded-lg text-xs font-bold transition-colors"
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={() => {
                        handleDiscard();
                        if (confirmAction === 'preview') {
                          setIsPreview(true);
                          setConfirmAction(null);
                        } else {
                          onClose();
                        }
                      }}
                      className="w-full py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-bold transition-colors"
                    >
                      Discard Changes
                    </button>
                    <button 
                      onClick={() => setConfirmAction(null)}
                      className="w-full py-2 bg-transparent text-neutral-400 hover:text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-white/[0.05]">
            <div className="flex-1 mr-8">
              <span className="inline-block text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded mb-3 uppercase tracking-wider">
                {editedTask.category}
              </span>
              <input 
                type="text"
                value={editedTask.title}
                onChange={e => setEditedTask({ ...editedTask, title: e.target.value })}
                className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none focus:border-b focus:border-purple-500/50 pb-1"
                placeholder="Task Title..."
              />
            </div>
            <div className="flex items-center gap-2">
              {showDeleteConfirm && (
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-xs text-red-400 font-medium">Delete this task?</span>
                  <button onClick={() => onDelete?.(task.id)} className="px-2 py-1 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded text-xs font-bold transition-colors">Yes</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-2 py-1 bg-white/[0.05] text-neutral-300 hover:bg-white/[0.1] rounded text-xs transition-colors">No</button>
                </div>
              )}
              {onDelete && !showDeleteConfirm && (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 hover:bg-red-500/10 rounded-full text-neutral-500 hover:text-red-400 transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-white/[0.05] rounded-full text-neutral-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
            {/* Left Area: Description Editor */}
            <div className="flex-1 flex flex-col p-6 border-r border-white/[0.05] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-neutral-200">Description</h3>
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/[0.05]">
                  <button 
                    onClick={() => setIsPreview(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${!isPreview ? 'bg-white/[0.08] text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={() => {
                      if (!isPreview && hasUnsavedChanges) {
                        setConfirmAction('preview');
                      } else {
                        setIsPreview(true);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${isPreview ? 'bg-white/[0.08] text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                </div>
              </div>

              {!isPreview ? (
                <div className="flex-1 flex flex-col border border-white/[0.05] rounded-xl overflow-hidden bg-black/20 focus-within:border-purple-500/50 transition-colors">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 p-2 border-b border-white/[0.05] bg-white/[0.02]">
                    <button onClick={() => insertText('**', '**')} className="p-1.5 hover:bg-white/[0.08] rounded text-neutral-400 hover:text-white transition-colors"><Bold className="w-4 h-4" /></button>
                    <button onClick={() => insertText('*', '*')} className="p-1.5 hover:bg-white/[0.08] rounded text-neutral-400 hover:text-white transition-colors"><Italic className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-white/[0.1] mx-1" />
                    <button onClick={() => insertText('- ')} className="p-1.5 hover:bg-white/[0.08] rounded text-neutral-400 hover:text-white transition-colors"><List className="w-4 h-4" /></button>
                    <button onClick={() => insertText('1. ')} className="p-1.5 hover:bg-white/[0.08] rounded text-neutral-400 hover:text-white transition-colors"><ListOrdered className="w-4 h-4" /></button>
                    <button onClick={() => insertText('- [ ] ')} className="p-1.5 hover:bg-white/[0.08] rounded text-neutral-400 hover:text-white transition-colors"><CheckSquare className="w-4 h-4" /></button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={editedTask.description || ''}
                    onChange={e => setEditedTask({ ...editedTask, description: e.target.value })}
                    className="flex-1 w-full bg-transparent p-4 text-sm text-neutral-200 focus:outline-none resize-none placeholder-neutral-600 custom-scrollbar leading-relaxed"
                    placeholder="Add a detailed description..."
                  />
                  {/* Save/Discard Actions in Edit Mode */}
                  {hasUnsavedChanges && (
                    <div className="flex items-center justify-end gap-2 p-3 bg-black/40 border-t border-white/[0.05]">
                      <button 
                        onClick={handleDiscard} 
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                      >
                        Discard
                      </button>
                      <button 
                        onClick={handleSave} 
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/20 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 p-4 bg-black/20 rounded-xl border border-white/[0.05] overflow-y-auto custom-scrollbar">
                  {renderMarkdown(editedTask.description || '')}
                </div>
              )}
            </div>

            {/* Right Area: Metadata Sidebar */}
            <div className="w-full md:w-72 bg-black/20 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
              <div>
                <h4 className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Assignee
                </h4>
                <input 
                  type="text"
                  value={editedTask.assignee || ''}
                  onChange={e => setEditedTask({ ...editedTask, assignee: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-neutral-900 border border-white/[0.05] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Label
                </h4>
                <input 
                  type="text"
                  value={editedTask.label || ''}
                  onChange={e => setEditedTask({ ...editedTask, label: e.target.value })}
                  placeholder="e.g. Backend, Bug"
                  className="w-full bg-neutral-900 border border-white/[0.05] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Due Date
                </h4>
                <input 
                  type="date"
                  value={editedTask.due_date || ''}
                  onChange={e => setEditedTask({ ...editedTask, due_date: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/[0.05] rounded-lg px-3 py-2 text-sm text-neutral-300 focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
