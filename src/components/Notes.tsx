import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, UserPlus, FileText, Share2, Trash2, Bold, Italic, List, ListOrdered, ImageIcon } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

interface Chapter {
  id: string;
  title: string;
  content: string;
  order_index: number;
}

interface Note {
  id: string;
  title: string;
  chapters: Chapter[];
}

interface Collaborator {
  email: string;
  role: 'editor' | 'viewer';
}

export const Notes: React.FC = () => {
  // Mock Data
  const [notes, setNotes] = useState<Note[]>([
    { 
      id: '1', 
      title: 'Product Requirements', 
      chapters: [
        { id: 'c1', title: 'Overview', content: '<p>Notes on the new collaboration features...</p>', order_index: 0 },
        { id: 'c2', title: 'Design Specs', content: '<p>Figma links and design thoughts.</p>', order_index: 1 }
      ]
    },
    { 
      id: '2', 
      title: 'Meeting Minutes', 
      chapters: [
        { id: 'c3', title: 'Weekly Sync', content: '<p>Discussion about the UI updates.</p>', order_index: 0 }
      ]
    }
  ]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>('1');
  const [activeChapterId, setActiveChapterId] = useState<string | null>('c1');
  
  // Mock Role ('owner', 'editor', 'viewer')
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer'>('owner');
  
  // Modal states
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  // Collaborator states
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { email: 'sarah@example.com', role: 'editor' },
    { email: 'alex@example.com', role: 'viewer' }
  ]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState<'editor' | 'viewer'>('viewer');

  // Delete confirmation states
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  
  // Undo state for tabs
  const [undoData, setUndoData] = useState<{ chapter: Chapter, noteId: string } | null>(null);
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const activeNote = notes.find(n => n.id === activeNoteId);
  const activeChapter = activeNote?.chapters.find(c => c.id === activeChapterId) || activeNote?.chapters[0];

  // Auto-switch to first chapter when active note changes
  React.useEffect(() => {
    if (activeNote && activeNote.chapters.length > 0) {
      if (!activeNote.chapters.find(c => c.id === activeChapterId)) {
        setActiveChapterId(activeNote.chapters[0].id);
      }
    } else {
      setActiveChapterId(null);
    }
  }, [activeNoteId, activeNote, activeChapterId]);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      chapters: [
        { id: Date.now().toString() + 'c', title: 'Untitled Chapter', content: '', order_index: 0 }
      ]
    };
    setNotes([...notes, newNote]);
    setActiveNoteId(newNote.id);
  };

  const handleUpdateNoteTitle = (value: string) => {
    if (userRole === 'viewer') return;
    setNotes(notes.map(n => n.id === activeNoteId ? { ...n, title: value } : n));
  };

  const handleCreateChapter = () => {
    if (userRole === 'viewer' || !activeNote) return;
    const newChapter: Chapter = {
      id: Date.now().toString() + 'c',
      title: 'New Chapter',
      content: '',
      order_index: activeNote.chapters.length
    };
    const updatedNotes = notes.map(n => {
      if (n.id === activeNoteId) {
        return { ...n, chapters: [...n.chapters, newChapter] };
      }
      return n;
    });
    setNotes(updatedNotes);
    setActiveChapterId(newChapter.id);
  };

  const handleUpdateChapter = (field: 'title' | 'content', value: string) => {
    if (userRole === 'viewer' || !activeNote || !activeChapter) return;
    
    // Simulate auto-save logging for content changes
    if (field === 'content') {
      console.log("Saving chapter content...");
    }

    const updatedNotes = notes.map(n => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          chapters: n.chapters.map(c => c.id === activeChapter.id ? { ...c, [field]: value } : c)
        };
      }
      return n;
    });
    setNotes(updatedNotes);
  };

  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userRole === 'viewer') return;
    setNoteToDelete(noteId);
  };

  const confirmDeleteNote = () => {
    if (!noteToDelete) return;
    const updatedNotes = notes.filter(n => n.id !== noteToDelete);
    setNotes(updatedNotes);
    if (activeNoteId === noteToDelete) {
      setActiveNoteId(updatedNotes.length > 0 ? updatedNotes[0].id : null);
    }
    setNoteToDelete(null);
  };

  const handleDeleteChapter = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userRole === 'viewer' || !activeNote) return;
    
    const chapterToDelete = activeNote.chapters.find(c => c.id === chapterId);
    if (!chapterToDelete) return;

    // Remove it immediately
    const updatedChapters = activeNote.chapters.filter(c => c.id !== chapterId);
    const updatedNotes = notes.map(n => {
      if (n.id === activeNoteId) {
        return { ...n, chapters: updatedChapters };
      }
      return n;
    });
    setNotes(updatedNotes);
    
    if (activeChapterId === chapterId) {
      setActiveChapterId(updatedChapters.length > 0 ? updatedChapters[0].id : null);
    }

    // Set up Undo Toast
    setUndoData({ chapter: chapterToDelete, noteId: activeNoteId });
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoData(null);
    }, 5000); // Hide after 5 seconds
  };

  const handleUndoDelete = () => {
    if (!undoData) return;
    
    const updatedNotes = notes.map(n => {
      if (n.id === undoData.noteId) {
        // Insert it back in its original order if possible, or just push and sort
        const newChapters = [...n.chapters, undoData.chapter].sort((a, b) => a.order_index - b.order_index);
        return { ...n, chapters: newChapters };
      }
      return n;
    });
    
    setNotes(updatedNotes);
    
    // Switch back to it if we're on the same note
    if (activeNoteId === undoData.noteId) {
      setActiveChapterId(undoData.chapter.id);
    }
    
    setUndoData(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteEmail.trim()) return;
    
    setCollaborators([...collaborators, { email: newInviteEmail, role: newInviteRole }]);
    setNewInviteEmail('');
  };

  const handleRevokeAccess = (email: string) => {
    setCollaborators(collaborators.filter(c => c.email !== email));
  };

  return (
    <div className="flex h-full w-full bg-[#050505] overflow-hidden text-neutral-200">
      
      {/* LEFT SIDEBAR - Notes List */}
      <div className="w-64 flex-shrink-0 border-r border-white/5 bg-black/40 flex flex-col">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Notes
          </h2>
          <button 
            onClick={handleCreateNote}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-neutral-400 hover:text-white"
            title="New Note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notes.map(note => (
            <button
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className={`w-full text-left px-3 py-2.5 rounded-md transition-all text-sm group flex items-center justify-between
                ${activeNoteId === note.id 
                  ? 'bg-purple-500/10 text-purple-100 border border-purple-500/20' 
                  : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200 border border-transparent'
                }`}
            >
              <span className="truncate">{note.title || 'Untitled Note'}</span>
              {userRole !== 'viewer' && (
                <div 
                  onClick={(e) => handleDeleteNote(note.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md transition-all text-neutral-500 hover:text-red-400"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          ))}
          {notes.length === 0 && (
            <div className="text-center text-sm text-neutral-500 mt-10">
              No notes yet. Create one!
            </div>
          )}
        </div>
      </div>

      {/* RIGHT WORKSPACE - Editor Area */}
      <div className="flex-1 flex flex-col relative bg-transparent">
        {activeNote ? (
          <>
            {/* Header */}
            <div className="h-16 flex-shrink-0 border-b border-white/5 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <div className="text-xs font-medium px-2 py-1 rounded bg-white/5 text-neutral-400 border border-white/10">
                  {userRole.toUpperCase()}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 overflow-y-auto px-10 py-12">
              <div className="max-w-3xl mx-auto">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateNoteTitle(e.target.value)}
                  readOnly={userRole === 'viewer'}
                  placeholder="Note Title"
                  className="w-full bg-transparent text-4xl font-bold text-white placeholder-neutral-700 outline-none mb-6"
                />

                {/* Tab Navigation Bar */}
                <div className="flex items-center gap-1 border-b border-white/10 mb-8 pb-[1px] overflow-x-auto no-scrollbar">
                  {activeNote.chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => setActiveChapterId(chapter.id)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 group
                        ${activeChapter?.id === chapter.id
                          ? 'border-purple-500 text-white bg-white/5 rounded-t-md'
                          : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/5 rounded-t-md'
                        }`}
                    >
                      {activeChapter?.id === chapter.id && userRole !== 'viewer' ? (
                         <input
                           type="text"
                           value={chapter.title}
                           onChange={(e) => handleUpdateChapter('title', e.target.value)}
                           className="bg-transparent outline-none w-auto max-w-[120px]"
                           autoFocus
                         />
                      ) : (
                         <span>{chapter.title || 'Untitled'}</span>
                      )}
                      {userRole !== 'viewer' && (
                        <div 
                          onClick={(e) => handleDeleteChapter(chapter.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-white/10 transition-colors text-neutral-500 hover:text-neutral-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  ))}
                  
                  {userRole !== 'viewer' && (
                    <button 
                      onClick={handleCreateChapter}
                      className="p-2 ml-1 text-neutral-400 hover:text-white hover:bg-white/5 rounded-t-md transition-colors border-b-2 border-transparent"
                      title="Add Chapter/Tab"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* TipTap Rich Text Editor */}
                <div className="w-full bg-transparent min-h-[60vh] text-lg text-neutral-300 placeholder-neutral-700 outline-none leading-relaxed prose prose-invert max-w-none">
                  {userRole !== 'viewer' && activeChapter && (
                    <TiptapEditor 
                      content={activeChapter.content} 
                      onChange={(html) => handleUpdateChapter('content', html)} 
                    />
                  )}
                  {userRole === 'viewer' && activeChapter && (
                    <div dangerouslySetInnerHTML={{ __html: activeChapter.content }} className="min-h-[60vh]" />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500">
            Select a note or create a new one
          </div>
        )}
      </div>

      {/* Collaborator Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsInviteModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-xl shadow-2xl p-6"
            >
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                Share Note
              </h3>

              {userRole === 'owner' ? (
                <form onSubmit={handleInvite} className="mb-8">
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="Email address" 
                      value={newInviteEmail}
                      onChange={e => setNewInviteEmail(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                    <select
                      value={newInviteRole}
                      onChange={e => setNewInviteRole(e.target.value as 'editor' | 'viewer')}
                      className="bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="editor">Can Edit</option>
                      <option value="viewer">Can View</option>
                    </select>
                    <button 
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                    >
                      Invite
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-sm text-neutral-400 mb-6 p-3 bg-white/5 rounded-md border border-white/10">
                  Only the owner of this note can invite new collaborators.
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider">
                  People with access
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {/* Owner */}
                  <div className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-medium">
                        ME
                      </div>
                      <span className="text-sm text-white">Owner (You)</span>
                    </div>
                    <span className="text-xs text-neutral-500">Owner</span>
                  </div>
                  
                  {/* Collaborators */}
                  {collaborators.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-medium">
                          {c.email[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-neutral-200">{c.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400 capitalize">{c.role}</span>
                        {userRole === 'owner' && (
                          <button 
                            onClick={() => handleRevokeAccess(c.email)}
                            className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                            title="Revoke access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal (Only for entire notes now) */}
      <AnimatePresence>
        {noteToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setNoteToDelete(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-[#121212] border border-red-500/20 rounded-xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                Confirm Deletion
              </h3>
              
              <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
                Are you sure you want to delete this note? This action cannot be undone and will delete all chapters inside.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button 
                  onClick={() => setNoteToDelete(null)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteNote}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 transition-colors"
                >
                  Delete Note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Undo Toast */}
      <AnimatePresence>
        {undoData && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-4 bg-[#1e1e1e] border border-white/10 shadow-2xl px-4 py-3 rounded-lg"
          >
            <span className="text-sm text-neutral-300">Chapter deleted</span>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={handleUndoDelete}
              className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              Undo
            </button>
            <button 
              onClick={() => {
                setUndoData(null);
                if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
              }}
              className="ml-2 text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// ==========================================
// TIPTAP EDITOR COMPONENT
// ==========================================

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('URL of the image:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex items-center gap-1 mb-6 pb-4 border-b border-white/5">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-purple-500/20 text-purple-400' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-purple-500/20 text-purple-400' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      
      <div className="w-px h-4 bg-white/10 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-purple-500/20 text-purple-400' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-purple-500/20 text-purple-400' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <button
        onClick={addImage}
        className="p-1.5 rounded transition-colors text-neutral-400 hover:text-white hover:bg-white/5"
        title="Insert Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

const TiptapEditor = ({ content, onChange }: { content: string, onChange: (html: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 focus:outline-none max-w-none',
      },
    },
  });

  // Keep editor content in sync with external changes (like switching notes)
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p></p>');
    }
  }, [content, editor]);

  return (
    <div>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
