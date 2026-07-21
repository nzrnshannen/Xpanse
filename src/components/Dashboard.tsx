import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Layers,
  FileText,
  Trash2,
  Edit2,
  GripVertical,
  X,
  CheckCircle2,
  Filter,
  CheckSquare
} from 'lucide-react';

import { Notes } from './Notes';
import { TaskModal } from './TaskModal';

interface DashboardProps {
  onLogout: () => void;
  userEmail: string;
}

interface BoardColumn {
  id: string;
  name: string;
  position: number;
}

export interface Task {
  id: string;
  title: string;
  column_id: string;
  category: string;
  position: number;
  description?: string;
  assignee?: string;
  labels?: { name: string; color: string; is_custom?: boolean }[];
  due_date?: string;
  created_at?: string;
}

interface MockBoard {
  id: string;
  name: string;
  columns: BoardColumn[];
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
  createdBy?: string;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Main Active Area view state
  const [currentView, setCurrentView] = useState<'home' | 'boards_list' | 'kanban' | 'chats' | 'notes'>('home');
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Modal control states
  const [activeActionModal, setActiveActionModal] = useState<'create_space' | 'join_space' | 'add_board' | 'add_chat' | 'add_column' | 'edit_column' | 'delete_column' | 'delete_chat' | null>(null);

  // Form states
  const [newSpaceName, setNewSpaceName] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnError, setNewColumnError] = useState('');
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const [columnToEdit, setColumnToEdit] = useState<{id: string, name: string} | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Interactive UI Inputs
  const [newMessage, setNewMessage] = useState('');
  const [newFeedPost, setNewFeedPost] = useState('');

  // Undo State
  const [deletedTaskState, setDeletedTaskState] = useState<{task: Task, timeoutId: number} | null>(null);

  // Draft Task State
  const [draftTask, setDraftTask] = useState<Task | null>(null);

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);
  const [previewTaskContext, setPreviewTaskContext] = useState<{boardId: string, taskId: string} | null>(null);

  // Success Modal State
  const [showTaskSuccessModal, setShowTaskSuccessModal] = useState(false);
  const [showTaskUpdatedModal, setShowTaskUpdatedModal] = useState(false);
  const [showChatDeleteSuccessModal, setShowChatDeleteSuccessModal] = useState(false);

  // Sort State
  type SortOption = 'alpha_az' | 'alpha_za' | 'date_newest' | 'date_oldest';
  const [columnSortOptions, setColumnSortOptions] = useState<Record<string, SortOption>>({});
  const [openSortColumnId, setOpenSortColumnId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.column-sort-dropdown')) {
        setOpenSortColumnId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeSpace = spaces.find(s => s.id === activeSpaceId);
  const activeBoard = activeSpace?.boards.find(b => b.id === activeBoardId);
  const activeChannel = activeSpace?.channels.find(c => c.id === activeChannelId);
  const activeTask = activeBoard?.tasks.find(t => t.id === activeTaskId);

  // Get all tasks across all boards in the active space for mentions
  const spaceTasks = activeSpace ? activeSpace.boards.flatMap(b => b.tasks.map(t => ({...t, board_id: b.id}))) : [];
  const mentionSuggestions = spaceTasks.filter(t => 
    mentionQuery === null || 
    t.title.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Filter state
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Compute available labels from active tasks
  const availableLabels = useMemo(() => {
    if (!activeBoard) return { labels: [], hasTasksWithoutLabels: false, totalTasks: 0 };
    
    const labelMap = new Map<string, { name: string, color: string }>();
    let hasTasksWithoutLabels = false;

    activeBoard.tasks.forEach(task => {
      if (task.labels && task.labels.length > 0) {
        task.labels.forEach(lbl => {
          if (!labelMap.has(lbl.name)) {
            labelMap.set(lbl.name, lbl);
          }
        });
      } else {
        hasTasksWithoutLabels = true;
      }
    });

    return {
      labels: Array.from(labelMap.values()),
      hasTasksWithoutLabels,
      totalTasks: activeBoard.tasks.length
    };
  }, [activeBoard]);

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
          columns: [
            { id: 'c1', name: 'To Do', position: 0 },
            { id: 'c2', name: 'In Progress', position: 1 },
            { id: 'c3', name: 'Done', position: 2 }
          ],
          tasks: [
            { id: 't1', title: 'Plan core workspace routes', column_id: 'c1', category: 'Dev', position: 0, labels: [{ name: 'Dev', color: '#A855F7' }], created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
            { id: 't2', title: 'Write FastAPI WebSocket models', column_id: 'c2', category: 'Backend', position: 0, labels: [{ name: 'Backend', color: '#3B82F6' }], created_at: new Date(Date.now() - 86400000).toISOString() },
            { id: 't3', title: 'Finalize Tailwind design tokens', column_id: 'c3', category: 'Design', position: 0, labels: [{ name: 'Design', color: '#EC4899' }], created_at: new Date().toISOString() }
          ]
        },
        {
          id: 'b2',
          name: 'Marketing Launch Strategy',
          columns: [
            { id: 'c4', name: 'To Do', position: 0 },
            { id: 'c5', name: 'In Progress', position: 1 },
            { id: 'c6', name: 'Done', position: 2 }
          ],
          tasks: [
            { id: 't4', title: 'Set up Google Analytics', column_id: 'c4', category: 'Marketing', position: 0, labels: [{ name: 'Marketing', color: '#F97316' }] }
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
          columns: [
            { id: 'cj1', name: 'To Do', position: 0 },
            { id: 'cj2', name: 'In Progress', position: 1 },
            { id: 'cj3', name: 'Done', position: 2 }
          ],
          tasks: [
            { id: 'tj1', title: 'Review Tailwind v4 build guidelines', column_id: 'cj1', category: 'Design', position: 0, labels: [{ name: 'Design', color: '#EC4899' }] }
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
      id: Date.now().toString(),
      name: newBoardName,
      columns: [
        { id: Date.now().toString() + 'c1', name: 'To Do', position: 0 },
        { id: Date.now().toString() + 'c2', name: 'In Progress', position: 1 },
        { id: Date.now().toString() + 'c3', name: 'Done', position: 2 }
      ],
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
      createdBy: userEmail,
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

  // 4b. Action Handler: Delete Group Chat
  const handleDeleteChannel = () => {
    if (!activeSpaceId || !activeChannelId) return;

    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return {
          ...s,
          channels: s.channels.filter(c => c.id !== activeChannelId)
        };
      }
      return s;
    }));

    // Find general or AI channel to switch to
    const defaultChan = activeSpace?.channels.find(c => c.id !== activeChannelId);
    if (defaultChan) {
      setActiveChannelId(defaultChan.id);
    } else {
      setActiveChannelId(null);
      setCurrentView('home');
    }
    setActiveActionModal(null);
    setShowChatDeleteSuccessModal(true);
  };

  // Mention Handlers
  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    
    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    
    const match = textBeforeCursor.match(/[@#]([\w\s-]*)$/);
    if (match) {
      setShowMentionPopup(true);
      setMentionQuery(match[1]);
      setMentionTriggerIndex(match.index || 0);
      setMentionSelectedIndex(0);
    } else {
      setShowMentionPopup(false);
      setMentionQuery(null);
    }
  };

  const insertMention = (task: Task & { board_id: string }) => {
    if (mentionTriggerIndex === -1) return;
    const prefix = newMessage.slice(0, mentionTriggerIndex);
    const suffix = newMessage.slice(mentionTriggerIndex + (mentionQuery ? mentionQuery.length : 0) + 1);
    
    const tag = `[[task:${task.board_id}:${task.id}:${task.title}]] `;
    
    setNewMessage(prefix + tag + suffix);
    setShowMentionPopup(false);
    setMentionQuery(null);
    setMentionTriggerIndex(-1);
  };

  const handleChatInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMentionPopup) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionSelectedIndex(prev => Math.min(prev + 1, Math.max(0, mentionSuggestions.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (mentionSuggestions[mentionSelectedIndex]) {
        e.preventDefault();
        insertMention(mentionSuggestions[mentionSelectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowMentionPopup(false);
    }
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

  // 7. Kanban Handlers
  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewColumnError('');
    if (!newColumnName.trim() || !activeBoard) return;

    // Check for duplicates
    const isDuplicate = activeBoard.columns.some(
      c => c.name.toLowerCase() === newColumnName.trim().toLowerCase()
    );

    if (isDuplicate) {
      setNewColumnError(`A column named "${newColumnName.trim()}" already exists.`);
      return;
    }

    handleAddColumn(newColumnName.trim());
    setNewColumnName('');
    setActiveActionModal(null);
  };

  const handleEditColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewColumnError('');
    if (!columnToEdit || !activeBoard) return;

    // Check for duplicates ignoring itself
    const isDuplicate = activeBoard.columns.some(
      c => c.id !== columnToEdit.id && c.name.toLowerCase() === columnToEdit.name.trim().toLowerCase()
    );

    if (isDuplicate) {
      setNewColumnError(`A column named "${columnToEdit.name.trim()}" already exists.`);
      return;
    }

    handleUpdateColumn(columnToEdit.id, columnToEdit.name.trim());
    setColumnToEdit(null);
    setActiveActionModal(null);
  };

  const handleConfirmDeleteColumn = () => {
    if (columnToDelete) {
      handleDeleteColumn(columnToDelete);
    }
    setColumnToDelete(null);
    setActiveActionModal(null);
  };

  const handleAddColumn = (columnName: string) => {
    if (!activeSpaceId || !activeBoardId || !columnName.trim()) return;
    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return {
          ...s,
          boards: s.boards.map(b => {
            if (b.id === activeBoardId) {
              const newPos = b.columns.length > 0 ? Math.max(...b.columns.map(c => c.position)) + 1 : 0;
              const newCol: BoardColumn = {
                id: Date.now().toString(),
                name: columnName,
                position: newPos
              };
              return { ...b, columns: [...b.columns, newCol].sort((x, y) => x.position - y.position) };
            }
            return b;
          })
        };
      }
      return s;
    }));
  };

  const handleUpdateColumn = (colId: string, newName: string) => {
    if (!activeSpaceId || !activeBoardId) return;
    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return {
          ...s,
          boards: s.boards.map(b => {
            if (b.id === activeBoardId) {
              return {
                ...b,
                columns: b.columns.map(c => c.id === colId ? { ...c, name: newName } : c)
              };
            }
            return b;
          })
        };
      }
      return s;
    }));
  };

  const handleDeleteColumn = (colId: string) => {
    if (!activeSpaceId || !activeBoardId) return;
    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return {
          ...s,
          boards: s.boards.map(b => {
            if (b.id === activeBoardId) {
              const remaining = b.columns.filter(c => c.id !== colId).sort((x, y) => x.position - y.position);
              const firstColId = remaining.length > 0 ? remaining[0].id : null;
              
              const updatedTasks = b.tasks.map(t => {
                if (t.column_id === colId) {
                  return { ...t, column_id: firstColId || '' };
                }
                return t;
              });

              return { ...b, columns: remaining, tasks: updatedTasks };
            }
            return b;
          })
        };
      }
      return s;
    }));
  };

  const handleColumnReorder = (draggedColumnId: string, targetIndex: number) => {
    if (!activeSpaceId || !activeBoardId) return;
    console.log(`Mocking PUT /reorder payload: { column_id: ${draggedColumnId}, new_position: ${targetIndex} }`);
    
    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return {
          ...s,
          boards: s.boards.map(b => {
            if (b.id === activeBoardId) {
              const currentCols = [...b.columns].sort((x, y) => x.position - y.position);
              const draggedColIndex = currentCols.findIndex(c => c.id === draggedColumnId);
              if (draggedColIndex === -1) return b;
              
              const [draggedCol] = currentCols.splice(draggedColIndex, 1);
              currentCols.splice(targetIndex, 0, draggedCol);
              
              const newCols = currentCols.map((c, idx) => ({ ...c, position: idx }));
              return { ...b, columns: newCols };
            }
            return b;
          })
        };
      }
      return s;
    }));
  };

  const handleTaskDrop = (taskId: string, targetColumnId: string, targetTaskId?: string) => {
    if (!activeSpaceId || !activeBoardId) return;
    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return {
          ...s,
          boards: s.boards.map(b => {
            if (b.id === activeBoardId) {
              const taskToMove = b.tasks.find(t => t.id === taskId);
              if (!taskToMove) return b;

              // Filter out the task being moved
              let newTasks = b.tasks.filter(t => t.id !== taskId);

              // Get tasks in target column sorted by position
              const targetColTasks = newTasks
                .filter(t => t.column_id === targetColumnId)
                .sort((x, y) => x.position - y.position);

              if (targetTaskId) {
                // Find index of target task and insert before it
                const targetIndex = targetColTasks.findIndex(t => t.id === targetTaskId);
                if (targetIndex !== -1) {
                  targetColTasks.splice(targetIndex, 0, { ...taskToMove, column_id: targetColumnId });
                } else {
                  targetColTasks.push({ ...taskToMove, column_id: targetColumnId });
                }
              } else {
                // Append to end
                targetColTasks.push({ ...taskToMove, column_id: targetColumnId });
              }
              
              // Normalize positions
              targetColTasks.forEach((t, i) => t.position = i);

              // Merge back
              const otherTasks = newTasks.filter(t => t.column_id !== targetColumnId);
              return {
                ...b,
                tasks: [...otherTasks, ...targetColTasks]
              };
            }
            return b;
          })
        };
      }
      return s;
    }));
  };

  const handleUpdateTask = (updatedTask: Task) => {
    if (!activeSpaceId || !activeBoardId) return;

    if (draftTask && updatedTask.id === draftTask.id) {
      if (!updatedTask.title.trim() && !updatedTask.description?.trim()) {
        setDraftTask(null);
        return;
      }
      if (!updatedTask.title.trim()) updatedTask.title = 'New Task';
      
      setSpaces(prev => prev.map(s => {
        if (s.id === activeSpaceId) {
          return {
            ...s,
            boards: s.boards.map(b => {
              if (b.id === activeBoardId) {
                return {
                  ...b,
                  tasks: [...b.tasks, updatedTask]
                };
              }
              return b;
            })
          };
        }
        return s;
      }));
      setDraftTask(null);
      setShowTaskSuccessModal(true);
      return;
    }

    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return {
          ...s,
          boards: s.boards.map(b => {
            if (b.id === activeBoardId) {
              return {
                ...b,
                tasks: b.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
              };
            }
            return b;
          })
        };
      }
      return s;
    }));
    setShowTaskUpdatedModal(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!activeSpaceId || !activeBoardId) return;

    let taskToDelete: Task | undefined;

    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return {
          ...s,
          boards: s.boards.map(b => {
            if (b.id === activeBoardId) {
              taskToDelete = b.tasks.find(t => t.id === taskId);
              return {
                ...b,
                tasks: b.tasks.filter(t => t.id !== taskId)
              };
            }
            return b;
          })
        };
      }
      return s;
    }));

    if (taskToDelete) {
      if (deletedTaskState?.timeoutId) clearTimeout(deletedTaskState.timeoutId);
      
      const timeoutId = window.setTimeout(() => {
        setDeletedTaskState(null);
      }, 5000);

      setDeletedTaskState({ task: taskToDelete, timeoutId });
      setActiveTaskId(null);
    }
  };

  const handleUndoDeleteTask = () => {
    if (!deletedTaskState || !activeSpaceId || !activeBoardId) return;
    
    clearTimeout(deletedTaskState.timeoutId);
    
    setSpaces(prev => prev.map(s => {
      if (s.id === activeSpaceId) {
        return {
          ...s,
          boards: s.boards.map(b => {
            if (b.id === activeBoardId) {
              return {
                ...b,
                tasks: [...b.tasks, deletedTaskState.task]
              };
            }
            return b;
          })
        };
      }
      return s;
    }));
    
    setDeletedTaskState(null);
  };

  const handleCreateDraftTask = (columnId: string) => {
    if (!activeSpaceId || !activeBoardId) return;
    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newTaskId,
      title: '',
      column_id: columnId,
      category: 'Task',
      position: activeBoard?.tasks.filter(t => t.column_id === columnId).length || 0,
      created_at: new Date().toISOString(),
    };
    setDraftTask(newTask);
  };

  const renderMessageText = (text: string) => {
    const parts = text.split(/(\[\[task:[^:]+:[^:]+:.*?\]\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[\[task:([^:]+):([^:]+):(.*?)]]/);
      if (match) {
        const [, boardId, taskId, taskTitle] = match;
        return (
          <button 
            key={i}
            onClick={() => {
              setPreviewTaskContext({ boardId, taskId });
              setActiveActionModal('task_preview');
            }}
            className="inline-flex items-center gap-1.5 mx-1 px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-medium hover:bg-purple-500/30 transition-colors"
          >
            <KanbanSquare className="w-3 h-3" />
            {taskTitle}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
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
          <div className="flex items-center justify-center w-10 h-10 mt-1">
            <img src="/logo.svg" alt="XE Logo" className="w-full h-full drop-shadow-md" />
          </div>

          <div className="h-px bg-white/[0.05] w-8" />

          {/* Quick Space Selector Avatars */}
          <div className="flex flex-col gap-2 w-full items-center max-h-[320px] overflow-y-auto overflow-x-hidden pr-0.5">
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
          {/* Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          
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
      <aside 
        className={`border-r border-white/[0.05] bg-[#070709] flex flex-col justify-between flex-shrink-0 z-10 transition-all duration-300 ease-in-out relative ${isSidebarOpen ? 'w-60 opacity-100' : 'w-0 opacity-0 border-none'}`}
      >
        <div className="w-60 flex flex-col h-full overflow-hidden">
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


                {/* 4. Notes sub-menu */}
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentView('notes')}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentView === 'notes' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/15' : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'}`}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="flex-grow text-left">Notes</span>
                  </button>
                </div>

              </nav>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
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
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-neutral-500 font-medium hidden sm:inline-block">
                        💡 Drag columns or tasks to move them
                      </span>

                      {/* Filter Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${selectedLabels.length > 0 ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-neutral-900 border-white/[0.1] text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
                        >
                          <Filter className="w-3.5 h-3.5" />
                          Filter
                          {selectedLabels.length > 0 && (
                            <span className="bg-purple-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                              {selectedLabels.length}
                            </span>
                          )}
                        </button>

                        {showFilterDropdown && (
                          <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-white/[0.1] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                            <div className="p-3 border-b border-white/[0.05]">
                              <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Filter by Label</h4>
                            </div>
                            
                            <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                              {availableLabels.totalTasks === 0 || (availableLabels.labels.length === 0 && !availableLabels.hasTasksWithoutLabels) ? (
                                <div className="px-2 py-3 text-xs text-neutral-500 italic text-center">
                                  No labels currently on the tasks
                                </div>
                              ) : (
                                <>
                                  {availableLabels.labels.map(lbl => {
                                    const isSelected = selectedLabels.includes(lbl.name);
                                    return (
                                      <label key={lbl.name} className="flex items-center gap-3 px-2 py-1.5 hover:bg-white/[0.05] rounded-lg cursor-pointer transition-colors group">
                                        <input 
                                          type="checkbox" 
                                          className="hidden"
                                          checked={isSelected}
                                          onChange={() => {
                                            if (isSelected) {
                                              setSelectedLabels(prev => prev.filter(l => l !== lbl.name));
                                            } else {
                                              setSelectedLabels(prev => [...prev, lbl.name]);
                                            }
                                          }}
                                        />
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/[0.2] group-hover:border-white/[0.4]'}`}>
                                          {isSelected && <CheckSquare className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lbl.color }} />
                                          <span className="text-xs text-neutral-200 font-medium">{lbl.name}</span>
                                        </div>
                                      </label>
                                    );
                                  })}
                                  
                                  {availableLabels.hasTasksWithoutLabels && (
                                    <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-white/[0.05] rounded-lg cursor-pointer transition-colors group mt-1 border-t border-white/[0.05] pt-2">
                                      <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={selectedLabels.includes('__NO_LABELS__')}
                                        onChange={() => {
                                          if (selectedLabels.includes('__NO_LABELS__')) {
                                            setSelectedLabels(prev => prev.filter(l => l !== '__NO_LABELS__'));
                                          } else {
                                            setSelectedLabels(prev => [...prev, '__NO_LABELS__']);
                                          }
                                        }}
                                      />
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedLabels.includes('__NO_LABELS__') ? 'bg-purple-500 border-purple-500' : 'border-white/[0.2] group-hover:border-white/[0.4]'}`}>
                                        {selectedLabels.includes('__NO_LABELS__') && <CheckSquare className="w-3 h-3 text-white" />}
                                      </div>
                                      <span className="text-xs text-neutral-400 font-medium italic">No Labels</span>
                                    </label>
                                  )}
                                </>
                              )}
                            </div>

                            {selectedLabels.length > 0 && (
                              <div className="p-2 border-t border-white/[0.05] bg-black/20">
                                <button
                                  onClick={() => setSelectedLabels([])}
                                  className="w-full py-1.5 text-[10px] font-bold text-neutral-400 hover:text-white hover:bg-white/[0.05] rounded-md transition-colors cursor-pointer"
                                >
                                  Clear Filters
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => {
                          setNewColumnName('');
                          setNewColumnError('');
                          setActiveActionModal('add_column');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition-colors border border-purple-500/20"
                      >
                        + Add Column
                      </button>
                    </div>
                  </div>

                  {/* Task Columns */}
                  {/* Task Columns */}
                  <div className="flex-1 flex gap-4 overflow-x-auto pb-4 pr-1 snap-x no-scrollbar">
                    {activeBoard.columns.sort((a, b) => a.position - b.position).map((column, idx) => (
                      <div 
                        key={column.id} 
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('type', 'column');
                          e.dataTransfer.setData('id', column.id);
                        }}
                        onDragEnd={() => setDragOverColId(null)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverColId !== column.id) setDragOverColId(column.id);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverColId(null);
                          const type = e.dataTransfer.getData('type');
                          const draggedId = e.dataTransfer.getData('id');
                          if (type === 'column' && draggedId && draggedId !== column.id) {
                            handleColumnReorder(draggedId, idx);
                          } else if (type === 'task' && draggedId) {
                            handleTaskDrop(draggedId, column.id);
                          }
                        }}
                        className={`snap-start flex-shrink-0 w-80 rounded-xl border bg-black/40 p-4 flex flex-col gap-3 h-full min-h-[300px] transition-colors ${dragOverColId === column.id ? 'border-purple-500/50 bg-purple-500/[0.02]' : 'border-white/[0.05]'}`}
                      >
                        <div className="group flex justify-between items-center border-b border-white/[0.04] pb-2 mb-1 cursor-grab active:cursor-grabbing relative">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">
                              {column.name}
                            </span>
                            <span className="h-5 w-5 text-[9px] bg-white/[0.04] rounded-full flex items-center justify-center font-bold text-neutral-500">
                              {activeBoard.tasks.filter(t => t.column_id === column.id).length}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenSortColumnId(openSortColumnId === column.id ? null : column.id);
                              }}
                              className={`p-1 rounded transition-colors column-sort-dropdown ${openSortColumnId === column.id ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/10 text-neutral-500 hover:text-white'}`}
                              title="Sort Column"
                            >
                              <span className="font-serif text-[10px] px-0.5">⇅</span>
                            </button>
                            <button 
                              onClick={() => {
                                setColumnToEdit({ id: column.id, name: column.name });
                                setNewColumnError('');
                                setActiveActionModal('edit_column');
                              }}
                              className="p-1 hover:bg-white/10 rounded text-neutral-500 hover:text-white"
                              title="Rename Column"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                setColumnToDelete(column.id);
                                setActiveActionModal('delete_column');
                              }}
                              className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded text-neutral-500 transition-colors"
                              title="Delete Column"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {openSortColumnId === column.id && (
                            <div className="column-sort-dropdown absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-white/[0.1] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col cursor-default" onClick={e => e.stopPropagation()}>
                              <div className="p-2 border-b border-white/[0.05]">
                                <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Sort Column</h4>
                              </div>
                              <div className="p-1 flex flex-col gap-0.5">
                                {[
                                  { id: 'alpha_az', label: 'Alphabetical (A-Z)' },
                                  { id: 'alpha_za', label: 'Alphabetical (Z-A)' },
                                  { id: 'date_newest', label: 'Date (Newest)' },
                                  { id: 'date_oldest', label: 'Date (Oldest)' },
                                ].map(option => {
                                  const currentSort = columnSortOptions[column.id] || 'date_newest';
                                  return (
                                    <button
                                      key={option.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setColumnSortOptions(prev => ({ ...prev, [column.id]: option.id as SortOption }));
                                        setOpenSortColumnId(null);
                                      }}
                                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${currentSort === option.id ? 'bg-purple-500/20 text-purple-400' : 'text-neutral-300 hover:bg-white/[0.05]'}`}
                                    >
                                      <div className="w-4 h-4 flex items-center justify-center">
                                        {currentSort === option.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                                      </div>
                                      {option.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 flex-grow overflow-y-auto max-h-[500px] pr-0.5">
                          {activeBoard.tasks
                            .filter(t => {
                              if (t.column_id !== column.id) return false;
                              if (selectedLabels.length === 0) return true;
                              if (selectedLabels.includes('__NO_LABELS__')) {
                                if (!t.labels || t.labels.length === 0) return true;
                              }
                              if (t.labels && t.labels.length > 0) {
                                return t.labels.some(l => selectedLabels.includes(l.name));
                              }
                              return false;
                            })
                            .sort((a,b) => {
                              const currentSort = columnSortOptions[column.id] || 'date_newest';
                              if (currentSort === 'alpha_az') return a.title.localeCompare(b.title);
                              if (currentSort === 'alpha_za') return b.title.localeCompare(a.title);
                              if (currentSort === 'date_newest') return new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime();
                              if (currentSort === 'date_oldest') return new Date(a.created_at || Date.now()).getTime() - new Date(b.created_at || Date.now()).getTime();
                              return a.position - b.position;
                            })
                            .map(task => (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                e.dataTransfer.setData('type', 'task');
                                e.dataTransfer.setData('id', task.id);
                              }}
                              onDragEnd={() => setDragOverColId(null)}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (dragOverColId !== column.id) setDragOverColId(column.id);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverColId(null);
                                const type = e.dataTransfer.getData('type');
                                const draggedId = e.dataTransfer.getData('id');
                                if (type === 'task' && draggedId && draggedId !== task.id) {
                                  handleTaskDrop(draggedId, column.id, task.id);
                                } else if (type === 'column' && draggedId) {
                                  const currentIdx = activeBoard.columns.findIndex(c => c.id === column.id);
                                  handleColumnReorder(draggedId, currentIdx);
                                }
                              }}
                              onMouseUp={() => setActiveTaskId(task.id)}
                              className="p-3.5 rounded-lg bg-neutral-900 border border-white/[0.06] hover:border-purple-500/40 hover:bg-neutral-800 transition-all cursor-grab active:cursor-grabbing group/card relative flex flex-col gap-2"
                            >
                              <div className="flex items-start justify-between">
                                {task.labels && task.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {task.labels.map((lbl, i) => (
                                      <span 
                                        key={i}
                                        className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded"
                                        style={{ backgroundColor: `${lbl.color}20`, color: lbl.color, border: `1px solid ${lbl.color}30` }}
                                      >
                                        {lbl.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs font-medium text-neutral-200 leading-tight">{task.title}</p>
                              
                              {/* Card Footer: Metadata Indicators */}
                              {(task.description || task.due_date || task.assignee || task.created_at) && (
                                <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center gap-3 text-[10px] text-neutral-500 font-medium">
                                  {task.description && (
                                    <div className="flex items-center gap-1" title="Has description">
                                      <FileText className="w-3 h-3" />
                                    </div>
                                  )}
                                  {task.due_date && (
                                    <div className="flex items-center gap-1" title={`Due: ${task.due_date}`}>
                                      <Calendar className="w-3 h-3" />
                                      <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                  )}
                                  {task.created_at && (
                                    <div className="flex items-center gap-1" title={`Created: ${new Date(task.created_at).toLocaleDateString()}`}>
                                      <span>Created: {new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                  )}
                                  {task.assignee && (
                                    <div className="flex items-center gap-1 ml-auto" title={`Assignee: ${task.assignee}`}>
                                      <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[8px] font-bold border border-purple-500/30">
                                        {task.assignee.charAt(0).toUpperCase()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                          {activeBoard.tasks.filter(t => t.column_id === column.id).length === 0 && (
                            <div className={`flex-1 border border-dashed rounded-lg flex items-center justify-center text-[10px] italic py-8 transition-colors ${dragOverColId === column.id ? 'border-purple-500/50 text-purple-400 bg-purple-500/[0.02]' : 'border-white/[0.03] text-neutral-600'}`}>
                              Drop tasks here
                            </div>
                          )}
                        </div>

                        {/* Add Task Button */}
                        <button
                          onClick={() => handleCreateDraftTask(column.id)}
                          className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-white/[0.03] bg-white/[0.02] hover:bg-white/[0.05] text-neutral-400 hover:text-white text-xs font-semibold transition-colors"
                        >
                          + Add Task
                        </button>
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
                    {activeChannel.createdBy === userEmail && (
                      <button 
                        onClick={() => setActiveActionModal('delete_chat')}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-neutral-500 hover:text-red-400 transition-colors"
                        title="Delete Chat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
                          <p className="mt-1 text-neutral-400 bg-white/[0.02] border border-white/[0.03] p-3 rounded-xl leading-relaxed self-start break-words whitespace-pre-wrap">
                            {renderMessageText(msg.text)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-white/[0.05] bg-[#070709]/30 flex gap-2 flex-shrink-0 relative">
                    
                    {/* Mention Popup */}
                    {showMentionPopup && (
                      <div className="absolute bottom-full left-4 mb-2 w-72 bg-neutral-900 border border-white/[0.1] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-64">
                        <div className="p-2 border-b border-white/[0.05]">
                          <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Mention Task</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-0.5">
                          {mentionSuggestions.length > 0 ? (
                            mentionSuggestions.map((task, idx) => (
                              <button
                                key={task.id}
                                type="button"
                                onClick={() => insertMention(task)}
                                className={`flex flex-col items-start gap-1 px-3 py-2 rounded-lg text-xs transition-colors text-left ${mentionSelectedIndex === idx ? 'bg-purple-500/20 text-white border border-purple-500/30' : 'text-neutral-300 hover:bg-white/[0.05] border border-transparent'}`}
                              >
                                <span className="font-bold">{task.title || 'Untitled Task'}</span>
                                <span className="text-[9px] text-neutral-500">
                                  {activeSpace?.boards.find(b => b.id === task.board_id)?.name}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-xs text-neutral-500 text-center">No tasks found</div>
                          )}
                        </div>
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder={activeChannel.isAI ? "Ask Xpanse AI anything..." : `Message #${activeChannel.name}...`}
                      value={newMessage}
                      onChange={handleChatInputChange}
                      onKeyDown={handleChatInputKeyDown}
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

              {/* ========================================== */}
              {/* IF 'notes' VIEW                            */}
              {/* ========================================== */}
              {currentView === 'notes' && (
                <Notes />
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

              {/* D. Add Column Dialog */}
              {activeActionModal === 'add_column' && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-1.5">Create a Column</h3>
                  <p className="text-[11px] text-neutral-400 mb-4">Add a new Kanban status column to {activeBoard?.name}.</p>
                  <form onSubmit={handleAddColumnSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        required
                        value={newColumnName}
                        onChange={(e) => {
                          setNewColumnName(e.target.value);
                          setNewColumnError('');
                        }}
                        placeholder="e.g. Backlog, Testing"
                        className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                      {newColumnError && (
                        <p className="text-[10px] text-red-400 mt-1.5">{newColumnError}</p>
                      )}
                    </div>
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
                        Add Column
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* E. Edit Column Dialog */}
              {activeActionModal === 'edit_column' && columnToEdit && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-1.5">Rename Column</h3>
                  <p className="text-[11px] text-neutral-400 mb-4">Rename this Kanban column.</p>
                  <form onSubmit={handleEditColumnSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        required
                        value={columnToEdit.name}
                        onChange={(e) => {
                          setColumnToEdit({ ...columnToEdit, name: e.target.value });
                          setNewColumnError('');
                        }}
                        placeholder="e.g. Backlog, Testing"
                        className="w-full rounded-lg border border-white/[0.08] bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                      {newColumnError && (
                        <p className="text-[10px] text-red-400 mt-1.5">{newColumnError}</p>
                      )}
                    </div>
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
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* F. Delete Column Dialog */}
              {activeActionModal === 'delete_column' && columnToDelete && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-1.5">Delete Column</h3>
                  <p className="text-[11px] text-neutral-400 mb-4">Are you sure you want to delete this column? Any tasks inside will automatically be moved to another column.</p>
                  <div className="flex gap-2 justify-end text-[11px] font-semibold mt-4">
                    <button 
                      type="button" 
                      onClick={() => setActiveActionModal(null)}
                      className="px-3.5 py-2 rounded-lg text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleConfirmDeleteColumn}
                      className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                    >
                      Yes, delete it
                    </button>
                  </div>
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

              {/* Delete Group Chat Dialog */}
              {activeActionModal === 'delete_chat' && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-1.5">Delete Group Chat</h3>
                  <p className="text-[11px] text-neutral-400 mb-4">
                    Are you sure you want to delete <span className="font-bold text-white">#{activeChannel?.name}</span>? 
                    This action cannot be undone and all messages will be lost. This group chat will be permanently deleted.
                  </p>
                  <div className="flex gap-2 justify-end text-[11px] font-semibold mt-4">
                    <button 
                      type="button" 
                      onClick={() => setActiveActionModal(null)}
                      className="px-3.5 py-2 rounded-lg text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleDeleteChannel}
                      className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                    >
                      Yes, delete it
                    </button>
                  </div>
                </div>
              )}

              {/* Task Preview Dialog */}
              {activeActionModal === 'task_preview' && previewTaskContext && (() => {
                const previewTask = spaceTasks.find(t => t.id === previewTaskContext.taskId);
                if (!previewTask) return null;
                
                return (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2 line-clamp-1">{previewTask.title || 'Untitled Task'}</h3>
                    <div className="flex gap-2 flex-wrap mb-4">
                      {previewTask.labels?.map((label, idx) => (
                        <div key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: `${label.color}20`, color: label.color }}>
                          {label.name}
                        </div>
                      ))}
                    </div>
                    {previewTask.description && (
                      <p className="text-xs text-neutral-400 mb-4 line-clamp-3 leading-relaxed">
                        {previewTask.description}
                      </p>
                    )}
                    <div className="flex gap-2 justify-end text-[11px] font-semibold mt-4 border-t border-white/[0.05] pt-4">
                      <button 
                        type="button" 
                        onClick={() => {
                          setActiveActionModal(null);
                          setPreviewTaskContext(null);
                        }}
                        className="px-3.5 py-2 rounded-lg text-neutral-400 hover:text-white"
                      >
                        Close Preview
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setActiveActionModal(null);
                          setActiveBoardId(previewTaskContext.boardId);
                          setActiveTaskId(previewTaskContext.taskId);
                          setCurrentView('kanban');
                          setPreviewTaskContext(null);
                        }}
                        className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                      >
                        Go to Board
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* G. Task Modal */}
      {((activeTaskId && activeTask) || draftTask) && activeBoard && (
        <TaskModal 
          task={draftTask || activeTask!}
          onClose={() => {
            setActiveTaskId(null);
            setDraftTask(null);
          }}
          onSave={handleUpdateTask}
          onDelete={draftTask ? () => setDraftTask(null) : handleDeleteTask}
        />
      )}

      {/* Task Success Modal */}
      <AnimatePresence>
        {showTaskSuccessModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowTaskSuccessModal(false)}
          >
            <div 
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-neutral-950 p-6 shadow-2xl overflow-hidden text-center flex flex-col items-center"
            >
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Task Created!</h3>
              <p className="text-sm text-neutral-400 mb-6">Your new task has been successfully added to the board.</p>
              <button 
                onClick={() => setShowTaskSuccessModal(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold transition-colors cursor-pointer"
              >
                Awesome
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Updated Modal */}
      <AnimatePresence>
        {showTaskUpdatedModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowTaskUpdatedModal(false)}
          >
            <div 
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-2xl border border-blue-500/30 bg-neutral-950 p-6 shadow-2xl overflow-hidden text-center flex flex-col items-center"
            >
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
              <div className="h-16 w-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Changes Saved!</h3>
              <p className="text-sm text-neutral-400 mb-6">Your edits to this task have been successfully saved.</p>
              <button 
                onClick={() => setShowTaskUpdatedModal(false)}
                className="w-full py-2.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Delete Success Modal */}
      <AnimatePresence>
        {showChatDeleteSuccessModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowChatDeleteSuccessModal(false)}
          >
            <div 
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-neutral-950 p-6 shadow-2xl overflow-hidden text-center flex flex-col items-center"
            >
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Group Chat Deleted!</h3>
              <p className="text-sm text-neutral-400 mb-6">The group chat has been successfully and permanently deleted.</p>
              <button 
                onClick={() => setShowChatDeleteSuccessModal(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold transition-colors cursor-pointer"
              >
                Awesome
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo Toast */}
      <AnimatePresence>
        {deletedTaskState && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-[60] bg-neutral-900 border border-white/[0.1] rounded-lg shadow-xl px-4 py-3 flex items-center gap-4"
          >
            <span className="text-sm font-medium text-neutral-200">Task deleted</span>
            <button
              onClick={handleUndoDeleteTask}
              className="px-3 py-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-md text-xs font-bold transition-colors"
            >
              Undo
            </button>
            <button 
              onClick={() => {
                clearTimeout(deletedTaskState.timeoutId);
                setDeletedTaskState(null);
              }}
              className="text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
