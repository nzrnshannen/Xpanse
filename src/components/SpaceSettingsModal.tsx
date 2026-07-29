import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Settings2, Users, ShieldAlert, KeyRound, Save, 
  UserMinus, Check, Image as ImageIcon, Palette, Upload
} from 'lucide-react';
import type { SpaceMember } from './Dashboard';
import { HexColorPicker } from 'react-colorful';

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#64748b', // Slate
];
interface SpaceSettingsModalProps {
  spaceId: number;
  spaceName: string;
  spaceColor?: string;
  spaceIcon?: string;
  ownerId?: string;
  members: SpaceMember[];
  currentUserEmail: string;
  onClose: () => void;
  onUpdateSpace: (updates: any) => void;
  onUpdateMemberRole: (memberId: string, newRole: SpaceMember['role']) => void;
  onRemoveMember: (memberId: string, message?: string) => void;
  onTransferOwnership: (newOwnerId: string) => void;
}

export const SpaceSettingsModal: React.FC<SpaceSettingsModalProps> = ({
  spaceName: initialName,
  spaceColor = '#3b82f6',
  spaceIcon = '',
  ownerId,
  members,
  currentUserEmail,
  onClose,
  onUpdateSpace,
  onUpdateMemberRole,
  onRemoveMember,
  onTransferOwnership
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'collaborators' | 'ownership'>('profile');
  
  // Profile State
  const isInitialImage = spaceIcon?.startsWith('data:image');
  const [profileMode, setProfileMode] = useState<'color' | 'image'>(isInitialImage ? 'image' : 'color');
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(spaceColor);
  const [hexInput, setHexInput] = useState(spaceColor);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setHexInput(newColor);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setColor(val);
    }
  };
  const [profileImage, setProfileImage] = useState(isInitialImage ? spaceIcon : '');
  const [showToast, setShowToast] = useState('');
  const [showNameChangeConfirm, setShowNameChangeConfirm] = useState(false);

  // Collaborator State
  const [kickMemberId, setKickMemberId] = useState<string | null>(null);
  const [kickMessage, setKickMessage] = useState('');

  // Ownership State
  const [newOwnerId, setNewOwnerId] = useState('');
  const [transferPhrase, setTransferPhrase] = useState('');

  const isOwner = ownerId === currentUserEmail;
  const currentUserMember = members.find(m => m.email === currentUserEmail);
  const isAdmin = isOwner || currentUserMember?.role === 'admin';

  const triggerToast = (message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(''), 4000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (name !== initialName) {
      setShowNameChangeConfirm(true);
    } else {
      commitProfileChanges();
    }
  };

  const commitProfileChanges = () => {
    const finalIcon = profileMode === 'image' ? profileImage : '';
    const finalColor = profileMode === 'color' ? color : '';
    const updates: any = { color: finalColor, icon: finalIcon };
    if (name !== initialName) {
      updates.name = name;
      triggerToast('Email notifications dispatched to all members regarding Space Name change.');
    } else {
      triggerToast('Profile updated successfully.');
    }
    onUpdateSpace(updates);
    setShowNameChangeConfirm(false);
  };

  const handleKickMember = () => {
    if (kickMemberId) {
      onRemoveMember(kickMemberId, kickMessage);
      setKickMemberId(null);
      setKickMessage('');
      triggerToast(`Member removed. Notification sent${kickMessage ? ' with custom message' : ''}.`);
    }
  };

  const handleTransferOwnership = () => {
    if (transferPhrase === 'change ownership' && newOwnerId) {
      onTransferOwnership(newOwnerId);
      triggerToast('Ownership transferred and automated invite sent to the new owner.');
      setTransferPhrase('');
      setNewOwnerId('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl h-[600px] flex flex-col rounded-2xl border border-white/[0.08] bg-neutral-950 shadow-2xl overflow-hidden"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.05]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-purple-400" />
            Space Settings
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-white/[0.05] p-4 space-y-2 bg-neutral-900/30">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'profile' ? 'bg-purple-500/10 text-purple-300' : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'}`}
            >
              <Palette className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('collaborators')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'collaborators' ? 'bg-purple-500/10 text-purple-300' : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'}`}
            >
              <Users className="w-4 h-4" />
              Collaborators
            </button>
            {isOwner && (
              <button
                onClick={() => setActiveTab('ownership')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'ownership' ? 'bg-orange-500/10 text-orange-400' : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'}`}
              >
                <KeyRound className="w-4 h-4" />
                Ownership
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 relative">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-white border-b border-white/[0.05] pb-2">Space Profile</h3>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">Live Preview</label>
                  <div className="w-full h-32 rounded-xl border border-white/[0.1] overflow-hidden relative transition-colors duration-200" style={{ backgroundColor: color }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-3">
                      {profileImage ? (
                        <img src={profileImage} alt="Avatar" className="w-12 h-12 rounded-lg border-2 border-white/20 object-cover shadow-lg" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg border-2 border-white/20 flex items-center justify-center bg-black/20 backdrop-blur-sm text-white font-bold text-xl shadow-lg">
                          {name ? name.charAt(0).toUpperCase() : 'S'}
                        </div>
                      )}
                      <div className="text-white font-bold text-lg drop-shadow-md">{name || 'Space Name'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">Space Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Changing the name will notify all members via email.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 border-b border-white/[0.05] pb-2">
                    <button 
                      onClick={() => setProfileMode('color')}
                      className={`text-xs font-semibold pb-1 ${profileMode === 'color' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-neutral-500'}`}
                    >
                      Theme Color
                    </button>
                    <button 
                      onClick={() => setProfileMode('image')}
                      className={`text-xs font-semibold pb-1 ${profileMode === 'image' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-neutral-500'}`}
                    >
                      Profile Picture
                    </button>
                  </div>

                  {profileMode === 'color' ? (
                    <div className="space-y-4">
                      <label className="block text-xs font-medium text-neutral-400 mb-2">Theme Color</label>
                      <div className="space-y-5 bg-neutral-900/50 border border-white/[0.1] rounded-xl p-5">
                        <div>
                          <div className="text-xs font-medium text-neutral-400 mb-3">Preset Colors</div>
                          <div className="flex flex-wrap gap-2.5">
                            {PRESET_COLORS.map(preset => (
                              <button
                                key={preset}
                                onClick={() => handleColorChange(preset)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  color.toLowerCase() === preset.toLowerCase() 
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' 
                                    : 'hover:scale-110 opacity-90 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: preset }}
                              >
                                {color.toLowerCase() === preset.toLowerCase() && (
                                  <Check className="w-4 h-4 text-white drop-shadow-md" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="border-t border-white/[0.05]" />

                        <div className="flex flex-col sm:flex-row gap-6">
                           <div className="flex-1">
                             <div className="text-xs font-medium text-neutral-400 mb-3">Custom Color</div>
                             <HexColorPicker 
                               color={color} 
                               onChange={handleColorChange} 
                               style={{ width: '100%', height: '160px' }}
                             />
                           </div>
                           <div className="w-full sm:w-48 space-y-4 pt-1 sm:pt-7">
                             <div>
                               <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5">Hex Code</label>
                               <div className="flex items-center gap-3 bg-neutral-950 border border-white/[0.1] rounded-lg px-3 py-2.5 focus-within:border-purple-500 transition-colors">
                                 <div className="w-4 h-4 rounded-full border border-white/[0.2] shadow-sm flex-shrink-0" style={{ backgroundColor: color }} />
                                 <input
                                   type="text"
                                   value={hexInput}
                                   onChange={handleHexInputChange}
                                   className="w-full bg-transparent text-sm text-white focus:outline-none font-mono"
                                   placeholder="#000000"
                                   maxLength={7}
                                 />
                               </div>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-2">Upload Profile Picture</label>
                      <div className="flex items-center gap-4">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile preview" className="w-12 h-12 rounded object-cover border border-white/[0.1]" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-neutral-900 border border-white/[0.1] flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-neutral-600" />
                          </div>
                        )}
                        <label className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-white/[0.1] rounded-lg text-xs font-medium text-white cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          Choose Image
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload}
                          />
                        </label>
                        {profileImage && (
                          <button onClick={() => setProfileImage('')} className="text-xs text-red-400 hover:text-red-300">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>

                {/* Name Change Confirmation Modal Overlay */}
                <AnimatePresence>
                  {showNameChangeConfirm && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        className="bg-neutral-900 border border-white/[0.1] rounded-xl p-5 w-full max-w-sm shadow-2xl"
                      >
                        <h3 className="text-sm font-bold text-white mb-2">Confirm Name Change</h3>
                        <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                          Are you sure you want to change the space name to <strong className="text-white">{name}</strong>? This will notify all active members.
                        </p>
                        
                        <div className="flex justify-end gap-2 mt-2">
                          <button 
                            onClick={() => setShowNameChangeConfirm(false)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={commitProfileChanges}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Yes, change it
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {activeTab === 'collaborators' && (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-white border-b border-white/[0.05] pb-2">Manage Collaborators</h3>
                
                <div className="border border-white/[0.05] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-900 text-neutral-400">
                      <tr>
                        <th className="px-4 py-2 font-medium">User</th>
                        <th className="px-4 py-2 font-medium">Role</th>
                        <th className="px-4 py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {members.map(member => (
                        <tr key={member.id} className="hover:bg-white/[0.01]">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-neutral-200">{member.name} {member.email === ownerId && <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded ml-1">Owner</span>}</div>
                            <div className="text-[10px] text-neutral-500">{member.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={member.role}
                              disabled={!isAdmin || member.email === ownerId || (member.role === 'admin' && !isOwner && member.email !== currentUserEmail)}
                              onChange={(e) => onUpdateMemberRole(member.id, e.target.value as any)}
                              className="bg-neutral-900 border border-white/[0.1] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                            >
                              <option value="admin">Admin</option>
                              <option value="edit-only">Edit-Only</option>
                              <option value="post-only">Post-Only</option>
                              <option value="view-only">View-Only</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            {isAdmin && member.email !== ownerId && member.email !== currentUserEmail && (
                              <button
                                onClick={() => setKickMemberId(member.id)}
                                className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/10 rounded transition-colors"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <AnimatePresence>
                  {kickMemberId && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute inset-0 z-10 bg-neutral-950/95 p-6 flex flex-col justify-center"
                    >
                      <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
                      <h4 className="text-lg font-bold text-white mb-2">Remove Member?</h4>
                      <p className="text-xs text-neutral-400 mb-4">
                        Are you sure you want to remove this member? They will immediately lose access to this workspace.
                      </p>
                      
                      <label className="block text-xs font-medium text-neutral-400 mb-2">Optional Notification Message</label>
                      <textarea
                        value={kickMessage}
                        onChange={(e) => setKickMessage(e.target.value)}
                        placeholder="Reason for removal..."
                        className="w-full h-24 bg-neutral-900 border border-white/[0.1] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500 mb-6 resize-none"
                      />

                      <div className="flex gap-3">
                        <button 
                          onClick={handleKickMember}
                          className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Confirm Removal
                        </button>
                        <button 
                          onClick={() => setKickMemberId(null)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {activeTab === 'ownership' && isOwner && (
              <div className="space-y-6">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4" />
                    Transfer Ownership
                  </h3>
                  <p className="text-xs text-orange-400/80 leading-relaxed">
                    Transferring ownership gives full administrative control of this Space to another member. 
                    You will be demoted to an <strong>Edit-Only</strong> role and will lose the ability to manage collaborators or delete the space.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">Select New Owner</label>
                  <select
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="" disabled>Select a member...</option>
                    {members.filter(m => m.email !== ownerId).map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">
                    Type <strong>change ownership</strong> to confirm
                  </label>
                  <input
                    type="text"
                    value={transferPhrase}
                    onChange={(e) => setTransferPhrase(e.target.value)}
                    placeholder="change ownership"
                    className="w-full bg-neutral-900 border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    disabled={transferPhrase !== 'change ownership' || !newOwnerId}
                    onClick={handleTransferOwnership}
                    className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Initiate Transfer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 shadow-xl backdrop-blur-md"
            >
              <Check className="w-3.5 h-3.5" />
              {showToast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
