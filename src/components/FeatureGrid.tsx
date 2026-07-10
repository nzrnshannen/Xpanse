import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  KanbanSquare, 
  MessageSquareCode, 
  Lock, 
  Globe, 
  ChevronRight, 
  Plus, 
  Send, 
  ThumbsUp, 
  Flame, 
  Heart 
} from 'lucide-react';

export const FeatureGrid: React.FC = () => {
  // Card 1: Unified Spaces state
  const [activeSpace, setActiveSpace] = useState<string>('eng');
  const [rooms, setRooms] = useState([
    { id: 'general', name: 'General Horizon', access: 'public', active: true },
    { id: 'core-dev', name: 'Core Engine (dev)', access: 'private', active: true },
    { id: 'launch-pad', name: 'Launch Strategy', access: 'private', active: false },
  ]);

  // Card 2: Kanban state
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Initialize GraphQL Client', column: 'todo', category: 'Dev' },
    { id: 't2', title: 'Design landing page dark mode', column: 'progress', category: 'Design' },
    { id: 't3', title: 'Secure websocket handshakes', column: 'done', category: 'Security' },
  ]);

  const moveTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        const nextCol = task.column === 'todo' ? 'progress' : task.column === 'progress' ? 'done' : 'todo';
        return { ...task, column: nextCol };
      }
      return task;
    }));
  };

  const addTask = () => {
    const title = prompt('Enter task name:') || 'New Task';
    const newTask = {
      id: `t${Date.now()}`,
      title,
      column: 'todo',
      category: 'Task'
    };
    setTasks(prev => [...prev, newTask]);
  };

  // Card 3: Chat state
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Sarah K.', initial: 'SK', text: 'Hey team, did the new API gateway deploy?', time: '10:02 AM' },
    { id: 2, sender: 'Alex M.', initial: 'AM', text: 'Yes, running health checks now. Looks solid!', time: '10:03 AM' }
  ]);
  const [inputText, setInputText] = useState('');
  const [reactions, setReactions] = useState({ thumbs: 4, fire: 2, heart: 5 });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const newMessage = {
      id: Date.now(),
      sender: 'You',
      initial: 'ME',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate auto response after a second
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'Expanse Bot',
        initial: 'EB',
        text: '🚀 Message broadcast successfully across Unified Space.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1200);
  };

  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 relative">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Engineered for Modern Teams
        </h2>
        <p className="mt-4 text-neutral-400">
          Everything you need to collaborate fluidly, without the overhead of switching browser tabs.
        </p>
      </div>

      {/* 3-Column Feature Preview Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Card 1: Unified Spaces */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-neutral-900/10 p-6 backdrop-blur-sm transition-all hover:border-white/[0.12] hover:bg-neutral-900/20">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] to-transparent pointer-events-none" />
          
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight">Unified Spaces</h3>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              The macro-container for the entire organization. Bring your departments and external contractors into sandboxed rooms.
            </p>
          </div>

          {/* Interactive Unified Space Mockup */}
          <div className="mt-8 rounded-xl border border-white/[0.05] bg-black/50 p-4 h-64 flex flex-col justify-between text-xs">
            <div>
              {/* Space Selectors */}
              <div className="flex gap-2 border-b border-white/[0.05] pb-3 mb-3">
                <button 
                  onClick={() => setActiveSpace('eng')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${activeSpace === 'eng' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  Engineering
                </button>
                <button 
                  onClick={() => setActiveSpace('mkt')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${activeSpace === 'mkt' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  Marketing
                </button>
              </div>

              {/* Room Tree */}
              <div className="space-y-1.5">
                {activeSpace === 'eng' ? (
                  rooms.map(room => (
                    <div 
                      key={room.id}
                      onClick={() => {
                        setRooms(prev => prev.map(r => r.id === room.id ? { ...r, active: !r.active } : r))
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${room.active ? 'bg-white/[0.04] text-white border border-white/[0.04]' : 'text-neutral-500 hover:text-neutral-400'}`}
                    >
                      <div className="flex items-center gap-2">
                        {room.access === 'private' ? (
                          <Lock className={`h-3 w-3 ${room.active ? 'text-purple-400' : 'text-neutral-600'}`} />
                        ) : (
                          <Globe className={`h-3 w-3 ${room.active ? 'text-blue-400' : 'text-neutral-600'}`} />
                        )}
                        <span># {room.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${room.active ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`} />
                        <span className="text-[10px] text-neutral-500">{room.active ? 'Online' : 'Muted'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-neutral-500">
                    <span className="block italic"># design-system</span>
                    <span className="block italic mt-1"># ad-campaigns</span>
                    <span className="text-[10px] text-purple-400/80 mt-2 block">Click Engineering to view main rooms</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-neutral-500 text-center border-t border-white/[0.05] pt-2">
              💡 Click rooms to toggle active status.
            </div>
          </div>
        </div>

        {/* Card 2: Project Boards */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-neutral-900/10 p-6 backdrop-blur-sm transition-all hover:border-white/[0.12] hover:bg-neutral-900/20">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none" />
          
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/5 text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <KanbanSquare className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight">Project Boards</h3>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Interactive Kanban task tracking built natively into the space. Assign tickets, drag to update states, and sync chat references.
            </p>
          </div>

          {/* Interactive Kanban Board Widget */}
          <div className="mt-8 rounded-xl border border-white/[0.05] bg-black/50 p-3 h-64 flex flex-col justify-between text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-2 mb-2">
              <span className="font-semibold text-neutral-300">Sprint Board</span>
              <button 
                onClick={addTask}
                className="flex items-center gap-1 text-[10px] bg-white text-black px-2 py-0.5 rounded-full hover:bg-neutral-200 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto pr-1">
              {/* Columns */}
              {['todo', 'progress', 'done'].map((col) => (
                <div key={col} className="flex flex-col gap-1.5">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-1 text-center">
                    {col === 'todo' ? 'To Do' : col === 'progress' ? 'In Dev' : 'Done'}
                  </div>
                  
                  <AnimatePresence mode="popLayout">
                    {tasks.filter(t => t.column === col).map(task => (
                      <motion.div
                        layout
                        key={task.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={() => moveTask(task.id)}
                        className="group/card p-2 rounded-lg bg-neutral-900 border border-white/[0.05] cursor-pointer hover:border-blue-500/40 hover:bg-neutral-800 transition-all text-left relative"
                      >
                        <span className="inline-block text-[8px] font-semibold text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded mb-1">
                          {task.category}
                        </span>
                        <div className="text-[10px] font-medium text-neutral-200 line-clamp-2 leading-tight">
                          {task.title}
                        </div>
                        <div className="absolute right-1 bottom-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <ChevronRight className="h-3 w-3 text-neutral-400" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-neutral-500 text-center border-t border-white/[0.05] pt-2 mt-2">
              ⚡ Click cards to shift them forward.
            </div>
          </div>
        </div>

        {/* Card 3: Real-Time Chats */}
        <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-neutral-900/10 p-6 backdrop-blur-sm transition-all hover:border-white/[0.12] hover:bg-neutral-900/20">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.02] to-transparent pointer-events-none" />
          
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <MessageSquareCode className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight">Real-Time Chats</h3>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Instant Group Channels and secure Direct Messages with rich threads, code snippets, and active workspace integrations.
            </p>
          </div>

          {/* Interactive Chat Window Widget */}
          <div className="mt-8 rounded-xl border border-white/[0.05] bg-black/50 p-3 h-64 flex flex-col justify-between text-xs">
            {/* Messages Display */}
            <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-40 mb-2 pr-1">
              {chatMessages.map(msg => (
                <div key={msg.id} className="flex gap-2 text-[10px] items-start">
                  <div className="h-5 w-5 rounded bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 text-[8px] flex-shrink-0">
                    {msg.initial}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-neutral-200">{msg.sender}</span>
                      <span className="text-[8px] text-neutral-500">{msg.time}</span>
                    </div>
                    <div className="text-neutral-400 mt-0.5 leading-tight">{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reactions and Form Input */}
            <div>
              {/* Emojis bar */}
              <div className="flex gap-1.5 mb-2 border-t border-white/[0.05] pt-2 justify-start">
                <button 
                  onClick={() => setReactions(r => ({ ...r, thumbs: r.thumbs + 1 }))}
                  className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.05] rounded-full px-2 py-0.5 hover:bg-white/[0.06] text-neutral-400 hover:text-white"
                >
                  <ThumbsUp className="h-2.5 w-2.5" />
                  <span>{reactions.thumbs}</span>
                </button>
                <button 
                  onClick={() => setReactions(r => ({ ...r, fire: r.fire + 1 }))}
                  className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.05] rounded-full px-2 py-0.5 hover:bg-white/[0.06] text-neutral-400 hover:text-white"
                >
                  <Flame className="h-2.5 w-2.5 text-amber-500" />
                  <span>{reactions.fire}</span>
                </button>
                <button 
                  onClick={() => setReactions(r => ({ ...r, heart: r.heart + 1 }))}
                  className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.05] rounded-full px-2 py-0.5 hover:bg-white/[0.06] text-neutral-400 hover:text-white"
                >
                  <Heart className="h-2.5 w-2.5 text-rose-500" />
                  <span>{reactions.heart}</span>
                </button>
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="flex gap-1">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-white/[0.08] rounded-md px-2 py-1 text-[10px] text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white rounded-md p-1 px-2 hover:bg-indigo-500 flex items-center justify-center"
                >
                  <Send className="h-3 w-3" />
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
