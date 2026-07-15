import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, UserPlus, FileText, Share2, Trash2, Bold, Italic, List, ListOrdered, ImageIcon } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

interface Note {
  id: string;
  title: string;
  content: string;
}

interface Collaborator {
  email: string;
  role: 'editor' | 'viewer';
}

export const Notes: React.FC = () => {
  // Mock Data
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', title: 'Product Requirements', content: 'Notes on the new collaboration features...' },
    { id: '2', title: 'Meeting Minutes', content: 'Discussion about the UI updates.' }
  ]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>('1');
  
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

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleCreateNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: '',
      content: ''
    };
    setNotes([...notes, newNote]);
    setActiveNoteId(newNote.id);
  };

  const handleUpdateNote = (field: 'title' | 'content', value: string) => {
    if (userRole === 'viewer') return;
    setNotes(notes.map(n => n.id === activeNoteId ? { ...n, [field]: value } : n));
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
              className={`w-full text-left px-3 py-2.5 rounded-md transition-all truncate text-sm
                ${activeNoteId === note.id 
                  ? 'bg-purple-500/10 text-purple-100 border border-purple-500/20' 
                  : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200 border border-transparent'
                }`}
            >
              {note.title || 'Untitled Note'}
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
                  onChange={(e) => handleUpdateNote('title', e.target.value)}
                  readOnly={userRole === 'viewer'}
                  placeholder="Note Title"
                  className="w-full bg-transparent text-4xl font-bold text-white placeholder-neutral-700 outline-none mb-8"
                />
                {/* TipTap Rich Text Editor */}
                <div className="w-full bg-transparent min-h-[60vh] text-lg text-neutral-300 placeholder-neutral-700 outline-none leading-relaxed prose prose-invert max-w-none">
                  {userRole !== 'viewer' && activeNote && (
                    <TiptapEditor 
                      content={activeNote.content} 
                      onChange={(html) => handleUpdateNote('content', html)} 
                    />
                  )}
                  {userRole === 'viewer' && activeNote && (
                    <div dangerouslySetInnerHTML={{ __html: activeNote.content }} className="min-h-[60vh]" />
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
