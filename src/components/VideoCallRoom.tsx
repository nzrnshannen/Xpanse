import { useState, useRef, useEffect } from 'react';
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Handle Local Video Stream
  useEffect(() => {
    let mounted = true;

    const startLocalVideo = async () => {
      try {
        if (!isVideoOff) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (mounted) {
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          } else {
            // Clean up if unmounted before stream resolves
            stream.getTracks().forEach(track => track.stop());
          }
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    const stopLocalVideo = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };

    if (isVideoOff) {
      stopLocalVideo();
    } else {
      startLocalVideo();
    }

    return () => {
      mounted = false;
      stopLocalVideo();
    };
  }, [isVideoOff]);

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        streamRef.current = stream;
        setIsScreenSharing(true);
        
        // Handle native stop sharing button
        stream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScreenSharing(false);
  };

  useEffect(() => {
    if (isScreenSharing && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isScreenSharing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, []);
  
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

      {/* Video Grid / Presentation Layout */}
      <div className={`flex-1 p-4 flex ${isScreenSharing ? 'flex-row' : 'flex-col'} gap-4 overflow-hidden`}>
        {isScreenSharing ? (
          <>
            {/* Main Presentation Stage */}
            <div className="flex-1 bg-black rounded-2xl border border-white/[0.05] overflow-hidden flex items-center justify-center relative">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-medium text-white shadow-lg">
                You are sharing your screen
              </div>
            </div>
            
            {/* Participants Sidebar */}
            <div className="w-64 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {participants.map(p => (
                <div key={p.id} className="relative bg-neutral-900 rounded-2xl border border-white/[0.05] overflow-hidden flex items-center justify-center aspect-video flex-shrink-0 shadow-lg">
                  {p.isMe && !isVideoOff ? (
                    <video 
                      ref={localVideoRef}
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover -scale-x-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-neutral-500" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white">
                    {p.name}
                  </div>
                  {(p.isMe && isMuted) && (
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/20 text-red-500">
                      <MicOff className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-fr">
            {participants.map(p => (
              <div key={p.id} className="relative bg-neutral-900 rounded-2xl border border-white/[0.05] overflow-hidden flex items-center justify-center shadow-lg">
                {p.isMe && !isVideoOff ? (
                  <video 
                    ref={localVideoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center">
                    <User className="w-8 h-8 text-neutral-500" />
                  </div>
                )}
                
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
        )}
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
          onClick={handleToggleScreenShare}
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
