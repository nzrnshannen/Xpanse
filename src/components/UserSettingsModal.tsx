import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Upload,
  User,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Mail,
  Camera,
  Monitor,
  Eye,
  EyeOff
} from 'lucide-react';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  avatarColor?: string;
}

interface UserSettingsModalProps {
  profile: UserProfile;
  onClose: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onDeleteAccount: () => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
];

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  profile,
  onClose,
  onUpdateProfile,
  onDeleteAccount
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security' | 'danger'>('profile');

  // Appearance State
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('xpanse_font_size') as any) || 'medium';
  });

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large' | 'xlarge') => {
    setFontSize(size);
    localStorage.setItem('xpanse_font_size', size);
    document.documentElement.setAttribute('data-font-size', size);
  };

  // Profile State
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [email, setEmail] = useState(profile.email);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor || PRESET_COLORS[6]);
  const [uploadError, setUploadError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Danger State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setUploadError('Only JPEG and PNG formats are allowed');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    onUpdateProfile({
      firstName,
      lastName,
      email,
      avatarUrl,
      avatarColor
    });
  };

  const handleSavePassword = () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Mock successful password change
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex overflow-hidden max-h-[85vh]"
      >
        {/* Sidebar */}
        <div className="w-48 bg-[#050505] border-r border-white/5 p-4 flex flex-col gap-2">
          <h2 className="text-sm font-bold text-white mb-4 px-2">Account Settings</h2>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'profile' ? 'bg-purple-500/10 text-purple-400' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTab === 'appearance' ? 'bg-purple-500/10 text-purple-400' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
          >
            <Monitor className="w-4 h-4" />
            Appearance
          </button>
          
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'security' ? 'bg-purple-500/10 text-purple-400' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
          >
            <Shield className="w-4 h-4" />
            Security
          </button>
          
          <div className="flex-grow" />
          
          <button
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'danger' ? 'bg-red-500/10 text-red-400' : 'text-neutral-400 hover:text-red-400 hover:bg-red-500/5'}`}
          >
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
          <div className="flex justify-between items-center p-6 border-b border-white/5">
            <h3 className="text-lg font-bold text-white">
              {activeTab === 'profile' && 'Profile Details'}
              {activeTab === 'appearance' && 'Appearance Settings'}
              {activeTab === 'security' && 'Security & Password'}
              {activeTab === 'danger' && 'Danger Zone'}
            </h3>
            <button onClick={onClose} className="p-1 rounded-md text-neutral-500 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                
                {/* Avatar Section */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-3">Avatar</label>
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white overflow-hidden shadow-lg border-2 border-white/10"
                        style={{ backgroundColor: avatarUrl ? 'transparent' : avatarColor }}
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
                        )}
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-1.5 bg-neutral-800 border border-white/10 rounded-full text-white hover:bg-neutral-700 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/jpeg, image/png"
                        onChange={handleImageUpload}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-xs text-neutral-400 mb-2">Upload a custom image (Max 5MB, JPEG/PNG) or pick a preset color.</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {PRESET_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              setAvatarColor(color);
                              setAvatarUrl('');
                            }}
                            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${avatarColor === color && !avatarUrl ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]' : ''}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      
                      {uploadError && <p className="text-xs text-red-400 mt-2">{uploadError}</p>}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* Personal Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">First Name</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-white mb-2">Typography & Display</h4>
                  <p className="text-xs text-neutral-400 mb-6">
                    Adjust the application's font size. This will scale all text and relative spacing appropriately.
                  </p>

                  <div className="space-y-3">
                    {[
                      { id: 'small', label: 'Small', desc: 'Compact view with smaller text.' },
                      { id: 'medium', label: 'Medium', desc: 'Default, recommended reading size.' },
                      { id: 'large', label: 'Large', desc: 'Larger text for better readability.' },
                      { id: 'xlarge', label: 'Extra Large', desc: 'Maximum text size for accessibility.' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleFontSizeChange(option.id as any)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${fontSize === option.id ? 'bg-purple-500/10 border-purple-500/50' : 'bg-neutral-900 border-white/10 hover:border-white/20'}`}
                      >
                        <div className="text-left">
                          <p className={`font-medium ${fontSize === option.id ? 'text-purple-400' : 'text-white'}`}>{option.label}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{option.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${fontSize === option.id ? 'border-purple-500' : 'border-neutral-600'}`}>
                          {fontSize === option.id && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                
                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Password updated successfully.
                  </div>
                )}

                {passwordError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">New Password</label>
                  <div className="relative mb-4">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    onClick={handleSavePassword}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {/* Danger Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-red-400 mb-2">Delete Account</h4>
                  <p className="text-xs text-neutral-400 mb-4">
                    Permanently delete your account, wipe all active sessions, and remove all your data. This action cannot be undone.
                  </p>

                  {!showDeleteConfirm ? (
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors border border-red-500/30 cursor-pointer"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="space-y-4 mt-6 pt-4 border-t border-red-500/10">
                      <div>
                        <label className="block text-xs font-medium text-red-400 mb-1.5">
                          To verify, type <span className="font-bold select-all bg-red-500/20 px-1 rounded">DELETE</span> below:
                        </label>
                        <input 
                          type="text" 
                          value={deleteConfirmText}
                          onChange={e => setDeleteConfirmText(e.target.value)}
                          className="w-full bg-neutral-900 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText('');
                          }}
                          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          disabled={deleteConfirmText !== 'DELETE'}
                          onClick={onDeleteAccount}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Confirm Deletion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </motion.div>
  );
};
