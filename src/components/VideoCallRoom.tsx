import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, User, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoCallRoomProps {
  roomId: string;
  onEndCall: (endForAll?: boolean) => void;
  initialIsMuted?: boolean;
  initialIsVideoOff?: boolean;
  isHost?: boolean;
}

export function VideoCallRoom({ onEndCall, initialIsMuted = false, initialIsVideoOff = false, isHost = true }: VideoCallRoomProps) {
  const [isMuted, setIsMuted] = useState(initialIsMuted);
  const [isVideoOff, setIsVideoOff] = useState(initialIsVideoOff);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState<number>(9);
  const [currentPage, setCurrentPage] = useState<number>(1);

  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Handle Local Media Stream
  useEffect(() => {
    let mounted = true;

    const initLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        if (mounted) {
          // Apply initial states
          stream.getVideoTracks().forEach(track => {
            track.enabled = !isVideoOff;
          });
          stream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
          });

          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(e => console.log("Play failed", e));
          }
        } else {
          // Clean up if unmounted before stream resolves
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    initLocalMedia();

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Sync Video Toggle
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff]);

  // Sync Audio Toggle
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

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
  
  // Mock participants (expanded for testing pagination)
  const participants = [
    { id: 1, name: "You", isMe: true },
    { id: 2, name: "Sarah Connor", isMe: false },
    { id: 3, name: "John Doe", isMe: false },
    ...Array.from({ length: 25 }).map((_, i) => ({ id: i + 4, name: `User ${i + 4}`, isMe: false })),
  ];

  const totalPages = Math.ceil(participants.length / itemsPerPage);
  
  // Ensure currentPage is valid if itemsPerPage changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [itemsPerPage, totalPages, currentPage]);

  const activeParticipants = participants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getGridColsClass = () => {
    if (itemsPerPage <= 9) return 'grid-cols-2 md:grid-cols-3';
    if (itemsPerPage <= 16) return 'grid-cols-3 md:grid-cols-4';
    if (itemsPerPage <= 25) return 'grid-cols-4 md:grid-cols-5';
    return 'grid-cols-5 md:grid-cols-7'; // 49
  };

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
        
        {/* Layout Selector */}
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-neutral-400" />
          <select 
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-neutral-900 border border-white/[0.05] text-xs text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value={9}>9 per page</option>
            <option value={16}>16 per page</option>
            <option value={25}>25 per page</option>
            <option value={49}>49 per page</option>
          </select>
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
              {activeParticipants.map(p => (
                <div key={p.id} className="relative bg-neutral-900 rounded-2xl border border-white/[0.05] overflow-hidden flex items-center justify-center aspect-video flex-shrink-0 shadow-lg">
                  {p.isMe && (
                    <video 
                      ref={localVideoRef}
                      autoPlay 
                      playsInline 
                      muted 
                      className={`w-full h-full object-cover -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
                    />
                  )}
                  {(!p.isMe || isVideoOff) && (
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-neutral-500" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white truncate max-w-[100px]">
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
          <div className="flex-1 relative flex items-center justify-center">
            {/* Pagination Prev */}
            {totalPages > 1 && (
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="absolute left-2 md:left-4 z-10 p-2 md:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-md"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className={`w-full h-full grid ${getGridColsClass()} gap-2 md:gap-4 auto-rows-fr`}>
              {activeParticipants.map(p => (
                <div key={p.id} className="relative bg-neutral-900 rounded-2xl border border-white/[0.05] overflow-hidden flex items-center justify-center shadow-lg">
                  {p.isMe && (
                    <video 
                      ref={localVideoRef}
                      autoPlay 
                      playsInline 
                      muted 
                      className={`w-full h-full object-cover -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
                    />
                  )}
                  {(!p.isMe || isVideoOff) && (
                    <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-neutral-800 flex items-center justify-center">
                      <User className="w-6 h-6 md:w-8 md:h-8 text-neutral-500" />
                    </div>
                  )}
                  
                  <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 flex items-center gap-2">
                    <div className="px-2 py-1 md:px-3 md:py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] md:text-xs font-medium text-white truncate max-w-[100px] md:max-w-[150px]">
                      {p.name}
                    </div>
                  </div>
                  {(p.isMe && isMuted) && (
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 p-1.5 md:p-2 rounded-full bg-red-500/20 text-red-500">
                      <MicOff className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Next */}
            {totalPages > 1 && (
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="absolute right-2 md:right-4 z-10 p-2 md:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-md"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Pagination Indicator */}
            {totalPages > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-medium text-white z-10">
                Page {currentPage} of {totalPages}
              </div>
            )}
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
          onClick={() => setShowEndCallModal(true)}
          className="px-6 py-4 rounded-2xl bg-red-600 text-white hover:bg-red-500 font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-600/20"
        >
          <PhoneOff className="w-5 h-5" />
          End Call
        </button>
      </div>

      {/* End Call Modal */}
      <AnimatePresence>
        {showEndCallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">Leave Video Call</h3>
              <p className="text-neutral-400 mb-8 text-sm">
                {isHost 
                  ? "You are the host. Do you want to end the meeting for everyone or just leave?"
                  : "Are you sure you want to leave this video call?"}
              </p>
              
              <div className="flex flex-col gap-3">
                {isHost && (
                  <button 
                    onClick={() => onEndCall(true)}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors shadow-lg shadow-red-600/20"
                  >
                    End Meeting for All
                  </button>
                )}
                
                <button 
                  onClick={() => onEndCall(false)}
                  className={`w-full py-3 rounded-xl font-bold transition-colors ${isHost ? 'bg-neutral-800 text-white hover:bg-neutral-700 border border-white/10' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'}`}
                >
                  Leave Call
                </button>
                
                <button 
                  onClick={() => setShowEndCallModal(false)}
                  className="w-full py-3 rounded-xl bg-transparent text-neutral-400 hover:text-white font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
