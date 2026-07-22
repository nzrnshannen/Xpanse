import { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoCallRoomProps {
  roomId: string;
  onEndCall: () => void;
}

export function VideoCallRoom({ onEndCall }: VideoCallRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Mock participants
  const participants = [
    { id: 1, name: "You", isMe: true },
    { id: 2, name: "Sarah Connor", isMe: false },
    { id: 3, name: "John Doe", isMe: false },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-40 bg-[#0a0a0c] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.05] bg-black/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-500">Live</span>
          </div>
          <h2 className="text-sm font-bold text-white">Video Call</h2>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-2 gap-4 auto-rows-fr">
        {participants.map(p => (
          <div key={p.id} className="relative bg-neutral-900 rounded-2xl border border-white/[0.05] overflow-hidden flex items-center justify-center">
            {/* Fallback avatar if video is off */}
            <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center">
              <User className="w-8 h-8 text-neutral-500" />
            </div>
            
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-medium text-white">
                {p.name}
              </div>
            </div>
            {(p.isMe && isMuted) && (
              <div className="absolute top-4 right-4 p-2 rounded-full bg-red-500/20 text-red-500">
                <MicOff className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Toolbar */}
      <div className="p-6 bg-black/40 border-t border-white/[0.05] flex items-center justify-center gap-4">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-2xl transition-colors ${isMuted ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-white/[0.05]'}`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button 
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`p-4 rounded-2xl transition-colors ${isVideoOff ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-white/[0.05]'}`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>
        <button 
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={`p-4 rounded-2xl transition-colors ${isScreenSharing ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-white/[0.05]'}`}
        >
          <MonitorUp className="w-5 h-5" />
        </button>
        
        <div className="w-px h-8 bg-white/10 mx-2" />
        
        <button 
          onClick={onEndCall}
          className="px-6 py-4 rounded-2xl bg-red-600 text-white hover:bg-red-500 font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-600/20"
        >
          <PhoneOff className="w-5 h-5" />
          End Call
        </button>
      </div>
    </motion.div>
  );
}
