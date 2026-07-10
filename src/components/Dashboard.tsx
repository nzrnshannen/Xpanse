import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Compass, 
  LogOut, 
  ChevronRight, 
  Link as LinkIcon, 
  MessageSquare, 
  KanbanSquare, 
  Send, 
  Home, 
  ChevronLeft, 
  Sparkles, 
  Hash, 
  MessageCircle, 
  Layers 
} from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
  userEmail: string;
}

interface Task {
  id: string;
  title: string;
  column: 'todo' | 'progress' | 'done';
  category: string;
}

interface MockBoard {
  id: string;
  name: string;
  tasks: Task[];
}

interface Message {
  sender: string;
  text: string;
  time: string;
}

interface MockChannel {
  id: string;
  name: string;
  isAI?: boolean;
  messages: Message[];
}

interface FeedItem {
  id: number;
  author: string;
  text: string;
  time: string;
}

interface MockSpace {
  id: number;
  name: string;
  boards: MockBoard[];
  channels: MockChannel[];
  feed: FeedItem[];
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, userEmail }) => {
  // Base State for Spaces
  const [hasSpaces, setHasSpaces] = useState(false);
  const [spaces, setSpaces] = useState<MockSpace[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<number | null>(null);

  // Main Active Area view state
  const [currentView, setCurrentView] = useState<'home' | 'boards_list' | 'kanban' | 'chats'>('home');
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  // Modal control states
  const [activeActionModal, setActiveActionModal] = useState<'create_space' | 'join_space' | 'add_board' | 'add_chat' | null>(null);

  // Form states
  const [newSpaceName, setNewSpaceName] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [newChatName, setNewChatName] = useState('');

  // Interactive UI Inputs
  const [newMessage, setNewMessage] = useState('');
  const [newFeedPost, setNewFeedPost] = useState('');

  const activeSpace = spaces.find(s => s.id === activeSpaceId);
  const activeBoard = activeSpace?.boards.find(b => b.id === activeBoardId);
  const activeChannel = activeSpace?.channels.find(c => c.id === activeChannelId);

  // 1. Action Handler: Create Space
  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    const initialSpace: MockSpace = {
      id: Date.now(),
      name: newSpaceName,
      boards: [
        {
          id: 'b1',
          name: 'Sprint 1 Core Board',
          tasks: [
            { id: 't1', title: 'Plan core workspace routes', column: 'todo', category: 'Dev' },
            { id: 't2', title: 'Write FastAPI WebSocket models', column: 'progress', category: 'Backend' },
            { id: 't3', title: 'Finalize Tailwind design tokens', column: 'done', category: 'Design' }
          ]
        },
        {
          id: 'b2',
          name: 'Marketing Launch Strategy',
          tasks: [
            { id: 't4', title: 'Set up Google Analytics', column: 'todo', category: 'Marketing' }
          ]
        }
      ],
      channels: [
        {
          id: 'ai-assist',
          name: 'Xpanse AI Assistant',
          isAI: true,
          messages: [
            { sender: 'Xpanse AI', text: 'Hello! I am your native workspace co-pilot. I can analyze sprint statuses, draft messages, or answer technical questions. How can I help you today?', time: 'Just now' }
          ]
        },
        {
          id: 'c-general',
          name: 'general',
          messages: [
            { sender: 'Sarah K.', text: 'Hey team, did the new API gateway deploy?', time: '10:02 AM' },
            { sender: 'Alex M.', text: 'Yes, running health checks now. Looks solid!', time: '10:03 AM' }
          ]
        },
        {
          id: 'c-engineering',
          name: 'engineering-sync',
          messages: [
            { sender: 'Dev Bot', text: 'Pipeline build #142 passed successfully in 4m 12s.', time: '11:15 AM' }
          ]
        }
      ],
      feed: [
        {
          id: 1,
          author: 'Alex M. (Workspace Owner)',
          text: 'Welcome to our new unified Xpanse! Use this space to map out our Kanban tickets and hold chats. Pinpoint permissions inside specific channels to secure our environment.',
          time: '2 hours ago'
        }
      ]
    };

    setSpaces(prev => [...prev, initialSpace]);
    setActiveSpaceId(initialSpace.id);
    setHasSpaces(true);
    setNewSpaceName('');
    setActiveActionModal(null);
    setCurrentView('home');
  };

  // 2. Action Handler: Join Space
  const handleJoinSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;

    const joinedSpace: MockSpace = {
      id: Date.now(),
      name: 'Shared Contractor Space',
      boards: [
        {
          id: 'bj1',
          name: 'Frontend Assets Sync',
          tasks: [
            { id: 'tj1', title: 'Review Tailwind v4 build guidelines', column: 'todo', category: 'Design' }
          ]
        }
      ],
      channels: [
        {
          id: 'ai-assist',
          name: 'Xpanse AI Assistant',
          isAI: true,
          messages: [
            { sender: 'Xpanse AI', text: 'Joined shared space workspace. I can help coordinate notes.', time: 'Just now' }
          ]
        },
        {
          id: 'c-announcements',
          name: 'announcements',
          messages: [
            { sender: 'Admin', text: 'Welcome contractors to the project sync board.', time: '1 day ago' }
          ]
        }
      ],
      feed: [
        {
          id: 1,
          author: 'System',
          text: 'Welcome to Shared Contractor Space. Make sure to update task columns daily.',
          time: '1 day ago'
        }
      ]
    };

    setSpaces(prev => [...prev, joinedSpace]);
    setActiveSpaceId(joinedSpace.id);
    setHasSpaces(true);
    setInviteToken('');
    setActiveActionModal(null);
    setCurrentView('home');
  };

  // 3. Action Handler: Add Board
  const handleAddBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim() || !activeSpaceId) return;

    const newBoard: MockBoard = {
      id: `b-${Date.now()}`,
      name: newBoardName,
      tasks: []
    };

    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return { ...s, boards: [...s.boards, newBoard] };
      }
      return s;
    }));

    setNewBoardName('');
    setActiveActionModal(null);
  };

  // 4. Action Handler: Add Group Chat Channel
  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatName.trim() || !activeSpaceId) return;

    const cleanName = newChatName.toLowerCase().replace(/\s+/g, '-');
    const newChan: MockChannel = {
      id: `c-${Date.now()}`,
      name: cleanName,
      messages: [{ sender: 'System', text: `Welcome to the #${cleanName} chat channel.`, time: 'Just now' }]
    };

    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return { ...s, channels: [...s.channels, newChan] };
      }
      return s;
    }));

    setNewChatName('');
    setActiveActionModal(null);
  };

  // 5. Action Handler: Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSpaceId || !activeChannelId) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'You', text: newMessage, time };

    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return {
          ...s,
          channels: s.channels.map(c => {
            if (c.id === activeChannelId) {
              return { ...c, messages: [...c.messages, userMsg] };
            }
            return c;
          })
        };
      }
      return s;
    }));

    setNewMessage('');

    // Trigger Mock AI response or Bot return
    if (activeChannel?.isAI) {
      setTimeout(() => {
        const aiMsg = {
          sender: 'Xpanse AI',
          text: `Analyzing: "${newMessage}". I will process this once our FastAPI endpoint is wired. Let me know if you would like me to draft a task instead.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setSpaces(prev => prev.map(s => {
          if (s.id === activeSpaceId) {
            return {
              ...s,
              channels: s.channels.map(c => {
                if (c.id === activeChannelId) {
                  return { ...c, messages: [...c.messages, aiMsg] };
                }
                return c;
              })
            };
          }
          return s;
        }));
      }, 1000);
    }
  };

  // 6. Action Handler: Add Feed Announcement Post
  const handleAddFeedPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedPost.trim() || !activeSpaceId) return;

    const newPost = {
      id: Date.now(),
      author: 'You',
      text: newFeedPost,
      time: 'Just now'
    };

    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return { ...s, feed: [newPost, ...s.feed] };
      }
      return s;
    }));

    setNewFeedPost('');
  };

  // 7. Action Handler: Move Kanban Task
  const handleMoveTask = (taskId: string) => {
    if (!activeSpaceId || !activeBoardId) return;

    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return {
          ...s,
          boards: s.boards.map(b => {
            if (b.id === activeBoardId) {
              return {
                ...b,
                tasks: b.tasks.map(t => {
                  if (t.id === taskId) {
                    const nextCol = t.column === 'todo' ? 'progress' : t.column === 'progress' ? 'done' : 'todo';
                    return { ...t, column: nextCol };
                  }
                  return t;
                })
              };
            }
            return b;
          })
        };
      }
      return s;
    }));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050505] text-neutral-200">
      
      {/* ========================================================================= */}
      {/* PANE 1: Leftmost Spaces Bar (64px width)                                   */}
      {/* ========================================================================= */}
      <aside className="w-16 border-r border-white/[0.05] bg-black/80 flex flex-col justify-between items-center py-4 flex-shrink-0 z-20">
        
        {/* Spaces list container */}
        <div className="flex flex-col gap-4 items-center w-full">
          {/* Logo Brand */}
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
            E
          </div>

          <div className="h-px bg-white/[0.05] w-8" />

          {/* Quick Space Selector Avatars */}
          <div className="flex flex-col gap-2 w-full items-center max-h-[320px] overflow-y-auto pr-0.5">
            {spaces.map(space => (
              <button
                key={space.id}
                onClick={() => {
                  setActiveSpaceId(space.id);
                  setCurrentView('home');
                }}
                className={`relative group flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm transition-all cursor-pointer ${space.id === activeSpaceId ? 'bg-purple-600 text-white rounded-lg' : 'bg-neutral-900 border border-white/[0.05] text-neutral-400 hover:text-white hover:border-white/[0.1] hover:rounded-lg'}`}
                title={space.name}
              >
                {space.name.substring(0, 2).toUpperCase()}
                
                {/* Active space glowing dot indicator */}
                {space.id === activeSpaceId && (
                  <span className="absolute left-0 top-3 w-1 h-4 bg-purple-500 rounded-r-md" />
                )}

                {/* Tooltip */}
                <div className="absolute left-16 bg-neutral-950 border border-white/[0.08] text-white text-[10px] font-semibold px-2 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                  {space.name}
                </div>
              </button>
            ))}

            {/* Action: Add new Space */}
            <button
              onClick={() => setActiveActionModal('create_space')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] text-neutral-500 hover:text-purple-400 hover:border-purple-500/40 transition-all cursor-pointer"
              title="Create a Space"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Profile Avatar & Logout */}
        <div className="flex flex-col gap-4 items-center w-full">
          <button
            onClick={() => setActiveActionModal('join_space')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02] text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Join Space via Link"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          
          <div className="h-px bg-white/[0.05] w-8" />
          
          {/* Avatar badge */}
          <div 
            className="h-9 w-9 rounded-full bg-indigo-600 border border-white/[0.1] flex items-center justify-center text-[10px] font-bold text-white uppercase"
            title={userEmail}
          >
            {userEmail.substring(0, 2)}
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* PANE 2: Internal Navigation Sidebar (240px width)                          */}
      {/* ========================================================================= */}
      <aside className="w-60 border-r border-white/[0.05] bg-[#070709] flex flex-col justify-between flex-shrink-0 z-10">
        <AnimatePresence mode="wait">
          {!hasSpaces ? (
            
            /* No Spaces Empty State menu */
            <motion.div
              key="empty-menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-center items-center p-6 text-center"
            >
              <Compass className="h-6 w-6 text-neutral-600 mb-2" />
              <h4 className="text-xs font-semibold text-neutral-400">Empty Workspace</h4>
              <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                Create a space to initialize navigation logs.
              </p>
            </motion.div>

          ) : (
            
            /* Active Space internal sub-menu */
            <motion.div
              key="active-menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col py-4"
            >
              {/* Space profile banner */}
              <div className="px-4 pb-4 border-b border-white/[0.04]">
                <h3 className="text-xs font-bold text-white tracking-wide truncate">{activeSpace?.name}</h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wider">Workspace active</span>
                </div>
              </div>

              {/* Navigation List */}
              <nav className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto">
                
                {/* 1. Space Home */}
                <button
                  onClick={() => setCurrentView('home')}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${currentView === 'home' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/15' : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'}`}
                >
                  <Home className="h-4 w-4" />
                  <span>Space Home</span>
                </button>

                {/* 2. Boards sub-menu list */}
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentView('boards_list')}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${currentView === 'boards_list' || currentView === 'kanban' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/15' : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'}`}
                  >
                    <KanbanSquare className="h-4 w-4" />
                    <span className="flex-grow text-left">Boards</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveActionModal('add_board');
                      }}
                      className="p-0.5 rounded text-neutral-500 hover:text-white hover:bg-white/[0.05]"
                      title="Add Board"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </button>

                  {/* Nested Active boards list */}
                  {(currentView === 'boards_list' || currentView === 'kanban') && activeSpace && (
                    <div className="mt-1 pl-6 space-y-1 border-l border-white/[0.04] ml-5">
                      {activeSpace.boards.map(board => (
                        <button
                          key={board.id}
                          onClick={() => {
                            setActiveBoardId(board.id);
                            setCurrentView('kanban');
                          }}
                          className={`flex items-center gap-2 w-full text-left py-1.5 px-2 rounded text-[11px] font-medium transition-colors truncate ${currentView === 'kanban' && activeBoardId === board.id ? 'text-purple-300 font-bold bg-white/[0.03]' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                          <Layers className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{board.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Group Chats & Channels sub-menu */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      // Default to general channel
                      const firstChan = activeSpace?.channels.find(c => !c.isAI) || activeSpace?.channels[0];
                      if (firstChan) setActiveChannelId(firstChan.id);
                      setCurrentView('chats');
                    }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${currentView === 'chats' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/15' : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'}`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="flex-grow text-left">Group Chats</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveActionModal('add_chat');
                      }}
                      className="p-0.5 rounded text-neutral-500 hover:text-white hover:bg-white/[0.05]"
                      title="Add Channel"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </button>

                  {/* Chats Inner Sub-menu: AI Assistant & Channels list */}
                  {currentView === 'chats' && activeSpace && (
                    <div className="mt-2.5 space-y-2">
                      
                      {/* Permanent AI assistant button at top of chat sidebar */}
                      {activeSpace.channels.filter(c => c.isAI).map(aiChan => (
                        <button
                          key={aiChan.id}
                          onClick={() => setActiveChannelId(aiChan.id)}
                          className={`flex items-center gap-2.5 w-full py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${activeChannelId === aiChan.id ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/30' : 'bg-neutral-900/40 border-white/[0.04] text-neutral-400 hover:text-white'}`}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
                          <span>Xpanse AI Assistant</span>
                        </button>
                      ))}

                      {/* Channels divider */}
                      <div className="h-px bg-white/[0.04] mx-2" />

                      {/* Standard channels */}
                      <div className="pl-6 space-y-1 border-l border-white/[0.04] ml-5">
                        {activeSpace.channels.filter(c => !c.isAI).map(chan => (
                          <button
                            key={chan.id}
                            onClick={() => setActiveChannelId(chan.id)}
                            className={`flex items-center gap-2 w-full text-left py-1.5 px-2 rounded text-[11px] font-medium transition-colors truncate ${activeChannelId === chan.id ? 'text-purple-300 font-bold bg-white/[0.03]' : 'text-neutral-500 hover:text-neutral-300'}`}
                          >
                            <Hash className="h-3 w-3 flex-shrink-0 text-neutral-600" />
                            <span className="truncate">{chan.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Add Chat short link */}
                      <button
                        onClick={() => setActiveActionModal('add_chat')}
                        className="flex items-center gap-1.5 pl-8 text-[10px] text-neutral-500 hover:text-purple-400 font-medium transition-colors cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Group Chat</span>
                      </button>

                    </div>
                  )}

                </div>

              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* ========================================================================= */}
      {/* PANE 3: Main Active Canvas (Right)                                         */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col bg-[#09090b] overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!hasSpaces ? (
            
            /* EMPTY STATE: Welcoming Page */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex-1 flex flex-col justify-center items-center px-6 text-center max-w-2xl mx-auto"
            >
              <div className="h-12 w-12 rounded-2xl bg-neutral-900 border border-white/[0.05] flex items-center justify-center text-purple-400 mb-6 shadow-xl shadow-black/40">
                <Compass className="h-6 w-6 animate-pulse" />
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-white">
                Welcome to your Xpanse.
              </h2>
              <p className="mt-4 text-sm text-neutral-400 leading-relaxed max-w-md">
                Every great project starts with a single space. Create a workspace for your team or enter an invitation link to collaborate.
              </p>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* Action Card 1: Create */}
                <div
                  onClick={() => setActiveActionModal('create_space')}
                  className="group p-5 rounded-xl border border-white/[0.05] bg-neutral-900/20 hover:border-purple-500/40 hover:bg-purple-500/[0.02] cursor-pointer transition-all hover:scale-[1.02] text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-500/25 bg-purple-500/5 text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                    <Plus className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Create a Space</h3>
                  <p className="mt-1.5 text-[11px] text-neutral-500 leading-relaxed">
                    Start a fresh hub for your project boards and team group chats.
                  </p>
                </div>

                {/* Action Card 2: Join */}
                <div
                  onClick={() => setActiveActionModal('join_space')}
                  className="group p-5 rounded-xl border border-white/[0.05] bg-neutral-900/20 hover:border-indigo-500/40 hover:bg-indigo-500/[0.02] cursor-pointer transition-all hover:scale-[1.02] text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/5 text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Join with a Link</h3>
                  <p className="mt-1.5 text-[11px] text-neutral-500 leading-relaxed">
                    Paste an invite token to instantly access an existing workspace.
                  </p>
                </div>
              </div>
            </motion.div>

          ) : (
            
            /* VIEW STATE RENDERING */
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col h-full"
            >
              
              {/* ========================================== */}
              {/* IF 'home' VIEW                             */}
              {/* ========================================== */}
              {currentView === 'home' && (
                <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto max-w-4xl w-full mx-auto">
                  {/* Space Welcome Banner */}
                  <div className="relative rounded-2xl border border-white/[0.06] bg-neutral-950 p-6 md:p-8 overflow-hidden mb-8 shadow-xl">
                    <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />
                    
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md">
                      Space Dashboard
                    </span>
                    <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white mt-4">
                      Welcome to {activeSpace?.name}
                    </h2>
                    <p className="text-xs text-neutral-400 mt-2 max-w-xl leading-relaxed">
                      Every channel, task, and discussion in {activeSpace?.name} is anchored under this central space feed. Use the sub-menus to access sprint boards or channel communications.
                    </p>
                  </div>

                  {/* Announcement wall */}
                  <div className="flex-1 flex flex-col bg-black/20 border border-white/[0.04] rounded-2xl p-6">
                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-purple-400" />
                      Team Discussion & Announcements
                    </h3>

                    {/* Quick Post Box */}
                    <form onSubmit={handleAddFeedPost} className="mb-6">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Publish a space-wide update..."
                          value={newFeedPost}
                          onChange={(e) => setNewFeedPost(e.target.value)}
                          className="flex-grow bg-neutral-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        <button
                          type="submit"
                          className="bg-white text-black text-xs font-bold px-4 rounded-xl hover:bg-neutral-200 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" /> Post
                        </button>
                      </div>
                    </form>

                    {/* Announcement Feed Items */}
                    <div className="flex-grow space-y-4 overflow-y-auto max-h-[360px] pr-2">
                      {activeSpace?.feed.map(post => (
                        <div key={post.id} className="p-4 rounded-xl border border-white/[0.04] bg-neutral-900/30 text-xs relative">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-neutral-300">{post.author}</span>
                            <span className="text-[9px] text-neutral-500">{post.time}</span>
                          </div>
                          <p className="text-neutral-400 leading-relaxed">{post.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* IF 'boards_list' VIEW                      */}
              {/* ========================================== */}
              {currentView === 'boards_list' && (
                <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl w-full mx-auto">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white">Project Boards</h2>
                      <p className="text-xs text-neutral-500 mt-1">Select a board to manage tasks or create a new sprint container.</p>
                    </div>
                  </div>

                  {/* Boards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {activeSpace?.boards.map(board => (
                      <div
                        key={board.id}
                        onClick={() => {
                          setActiveBoardId(board.id);
                          setCurrentView('kanban');
                        }}
                        className="group p-5 rounded-xl border border-white/[0.06] bg-neutral-900/10 hover:border-purple-500/40 hover:bg-purple-500/[0.02] cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-36"
                      >
                        <div>
                          <div className="h-8 w-8 rounded-lg bg-neutral-800 border border-white/[0.04] flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                            <KanbanSquare className="h-4 w-4" />
                          </div>
                          <h3 className="text-xs font-bold text-white truncate">{board.name}</h3>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-medium">
                          {board.tasks.length} active tasks
                        </span>
                      </div>
                    ))}

                    {/* "+ Add New Board" Card */}
                    <div
                      onClick={() => setActiveActionModal('add_board')}
                      className="flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-white/[0.08] hover:border-purple-500/40 hover:bg-purple-500/[0.02] cursor-pointer transition-all h-36 group"
                    >
                      <Plus className="h-6 w-6 text-neutral-500 group-hover:text-purple-400 transition-colors" />
                      <span className="text-xs text-neutral-400 group-hover:text-white transition-colors mt-2 font-medium">Add New Board</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* IF 'kanban' VIEW                           */}
              {/* ========================================== */}
              {currentView === 'kanban' && activeBoard && (
                <div className="flex-1 flex flex-col h-full p-6 overflow-hidden">
                  
                  {/* Kanban Header */}
                  <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentView('boards_list')}
                        className="p-1 rounded-lg border border-white/[0.05] hover:bg-white/[0.05] hover:text-white text-neutral-400 transition-all cursor-pointer"
                        title="Back to Boards"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <KanbanSquare className="h-4 w-4 text-purple-400" />
                        {activeBoard.name}
                      </h3>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      💡 Click a card to advance columns
                    </span>
                  </div>

                  {/* Task Columns */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto pr-1">
                    {['todo', 'progress', 'done'].map((column) => (
                      <div key={column} className="rounded-xl border border-white/[0.05] bg-black/40 p-4 flex flex-col gap-3 h-full min-h-[300px]">
                        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wide border-b border-white/[0.04] pb-2 mb-1 flex justify-between items-center">
                          <span>{column === 'todo' ? 'To Do' : column === 'progress' ? 'In Progress' : 'Done'}</span>
                          <span className="h-5 w-5 text-[9px] bg-white/[0.04] rounded-full flex items-center justify-center font-bold text-neutral-500">
                            {activeBoard.tasks.filter(t => t.column === column).length}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 flex-grow overflow-y-auto max-h-[420px] pr-0.5">
                          {activeBoard.tasks.filter(t => t.column === column).map(task => (
                            <div
                              key={task.id}
                              onClick={() => handleMoveTask(task.id)}
                              className="p-3.5 rounded-lg bg-neutral-900 border border-white/[0.06] hover:border-purple-500/40 hover:bg-neutral-800 transition-all cursor-pointer group/card relative"
                            >
                              <span className="inline-block text-[8px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded mb-2">
                                {task.category}
                              </span>
                              <p className="text-xs font-medium text-neutral-200 leading-tight">{task.title}</p>
                              <div className="absolute right-2.5 bottom-2.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <ChevronRight className="h-3 w-3 text-neutral-400" />
                              </div>
                            </div>
                          ))}
                          {activeBoard.tasks.filter(t => t.column === column).length === 0 && (
                            <div className="flex-1 border border-dashed border-white/[0.03] rounded-lg flex items-center justify-center text-neutral-600 text-[10px] italic py-8">
                              No tasks
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* ========================================== */}
              {/* IF 'chats' VIEW                            */}
              {/* ========================================== */}
              {currentView === 'chats' && activeChannel && (
                <div className="flex-1 flex flex-col h-full bg-black/10 overflow-hidden">
                  
                  {/* Chat channel header */}
                  <header className="h-14 border-b border-white/[0.05] bg-[#070709]/30 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      {activeChannel.isAI ? (
                        <Sparkles className="h-4 w-4 text-purple-400" />
                      ) : (
                        <Hash className="h-4 w-4 text-neutral-500" />
                      )}
                      <span>{activeChannel.name}</span>
                    </div>
                  </header>

                  {/* Messages container */}
                  <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 pr-4">
                    {activeChannel.messages.map((msg, idx) => (
                      <div key={idx} className="flex gap-3 text-xs items-start max-w-2xl">
                        <div className="h-7 w-7 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-[9px] flex-shrink-0 uppercase">
                          {msg.sender.substring(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-300">{msg.sender}</span>
                            <span className="text-[9px] text-neutral-500">{msg.time}</span>
                          </div>
                          <p className="mt-1 text-neutral-400 bg-white/[0.02] border border-white/[0.03] p-3 rounded-xl leading-relaxed self-start">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-white/[0.05] bg-[#070709]/30 flex gap-2 flex-shrink-0">
                    <input
                      type="text"
                      placeholder={activeChannel.isAI ? "Ask Xpanse AI anything..." : `Message #${activeChannel.name}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-grow bg-neutral-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                      type="submit"
                      className="bg-purple-600 text-white rounded-xl px-4 py-2.5 hover:bg-purple-500 transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>

                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ========================================================================= */}
      {/* ACTION OVERLAY MODALS                                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeActionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveActionModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-xl border border-white/[0.08] bg-neutral-950 p-6 shadow-2xl overflow-hidden"
            >
              {/* Decorator glow */}
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

              {/* A. Create Space Dialog */}
              {activeActionModal === 'create_space' && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-1.5">Create a new Space</h3>
                  <p className="text-[11px] text-neutral-400 mb-4">Initialize a unified space for tasks and chat channels.</p>
                  <form onSubmit={handleCreateSpace} className="space-y-4">
                    <input
                      type="text"
                      required
                      value={newSpaceName}
                      onChange={(e) => setNewSpaceName(e.target.value)}
                      placeholder="e.g. engineering, acme-corps"
                      className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex gap-2 justify-end text-[11px] font-semibold">
                      <button 
                        type="button" 
                        onClick={() => setActiveActionModal(null)}
                        className="px-3.5 py-2 rounded-lg text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200"
                      >
                        Create Space
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* B. Join Space Dialog */}
              {activeActionModal === 'join_space' && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-1.5">Join Space via invite</h3>
                  <p className="text-[11px] text-neutral-400 mb-4">Paste the link key generated by your administrator.</p>
                  <form onSubmit={handleJoinSpace} className="space-y-4">
                    <input
                      type="text"
                      required
                      value={inviteToken}
                      onChange={(e) => setInviteToken(e.target.value)}
                      placeholder="e.g. space_1_key_xyz"
                      className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex gap-2 justify-end text-[11px] font-semibold">
                      <button 
                        type="button" 
                        onClick={() => setActiveActionModal(null)}
                        className="px-3.5 py-2 rounded-lg text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200"
                      >
                        Join Space
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* C. Add Project Board Dialog */}
              {activeActionModal === 'add_board' && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-1.5">Create a Project Board</h3>
                  <p className="text-[11px] text-neutral-400 mb-4">Add a new Kanban tracking board inside this space.</p>
                  <form onSubmit={handleAddBoard} className="space-y-4">
                    <input
                      type="text"
                      required
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      placeholder="e.g. Sprint 2 Board, QA backlog"
                      className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex gap-2 justify-end text-[11px] font-semibold">
                      <button 
                        type="button" 
                        onClick={() => setActiveActionModal(null)}
                        className="px-3.5 py-2 rounded-lg text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200"
                      >
                        Add Board
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* D. Add Chat Channel Dialog */}
              {activeActionModal === 'add_chat' && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-1.5">Create Group Chat</h3>
                  <p className="text-[11px] text-neutral-400 mb-4">Add a text communication channel inside this space.</p>
                  <form onSubmit={handleAddChannel} className="space-y-4">
                    <input
                      type="text"
                      required
                      value={newChatName}
                      onChange={(e) => setNewChatName(e.target.value)}
                      placeholder="e.g. design-sync, general"
                      className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex gap-2 justify-end text-[11px] font-semibold">
                      <button 
                        type="button" 
                        onClick={() => setActiveActionModal(null)}
                        className="px-3.5 py-2 rounded-lg text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200"
                      >
                        Add Channel
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
