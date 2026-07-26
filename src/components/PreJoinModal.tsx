import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, X, Upload, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreJoinModalProps {
  onJoin: (isMuted: boolean, isVideoOff: boolean) => void;
  onClose: () => void;
}

export function PreJoinModal({ onJoin, onClose }: PreJoinModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');
  const [selectedAudioInputId, setSelectedAudioInputId] = useState<string>('');
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState<string>('');
  
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [backgroundEffect, setBackgroundEffect] = useState<'none' | 'blur' | 'preset1' | 'preset2' | 'custom'>('none');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    // Enumerate devices
    const getDevices = async () => {
      try {
        const initialStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        // Stop the initial permission stream to prevent hardware leak
        initialStream.getTracks().forEach(track => track.stop());
        
        const video = devices.filter(d => d.kind === 'videoinput');
        const audioIn = devices.filter(d => d.kind === 'audioinput');
        const audioOut = devices.filter(d => d.kind === 'audiooutput');
        
        setVideoDevices(video);
        setAudioInputDevices(audioIn);
        setAudioOutputDevices(audioOut);
        
        if (video.length > 0) setSelectedVideoDeviceId(video[0].deviceId);
        if (audioIn.length > 0) setSelectedAudioInputId(audioIn[0].deviceId);
        if (audioOut.length > 0) setSelectedAudioOutputId(audioOut[0].deviceId);
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    };
    getDevices();
    
    return () => {
      mountedRef.current = false;
      stopMediaTracks();
    };
  }, []);

  useEffect(() => {
    // Restart stream when device changes or toggles change
    startMediaStream();
  }, [selectedVideoDeviceId, selectedAudioInputId, isVideoOff, isMuted]);

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startMediaStream = async () => {
    stopMediaTracks();
    
    try {
      const constraints: MediaStreamConstraints = {
        video: isVideoOff ? false : (selectedVideoDeviceId ? { deviceId: { exact: selectedVideoDeviceId } } : true),
        audio: (selectedAudioInputId ? { deviceId: { exact: selectedAudioInputId } } : true)
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!mountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      // Stop any existing stream that might have been set while we were waiting
      stopMediaTracks();
      streamRef.current = stream;

      if (videoRef.current && !isVideoOff) {
        videoRef.current.srcObject = stream;
      }

      // Audio Analyser Setup
      if (!isMuted && stream.getAudioTracks().length > 0) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const updateVolume = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            setVolumeLevel(average);
          }
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      } else {
        setVolumeLevel(0);
      }

      // Mute audio track natively
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });

    } catch (err) {
      console.error("Error starting media stream", err);
    }
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomBgImage(url);
      setBackgroundEffect('custom');
    }
  };

  const getBackgroundStyles = () => {
    if (backgroundEffect === 'blur') return { backdropFilter: 'blur(10px)' };
    if (backgroundEffect === 'preset1') return { backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80)', backgroundSize: 'cover' };
    if (backgroundEffect === 'preset2') return { backgroundImage: 'url(https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80)', backgroundSize: 'cover' };
    if (backgroundEffect === 'custom' && customBgImage) return { backgroundImage: `url(${customBgImage})`, backgroundSize: 'cover' };
    return {};
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Column: Video Preview */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 relative">
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative shadow-inner mb-6">
            
            {/* Background Effect Layer */}
            <div className="absolute inset-0 z-0 transition-all duration-300" style={getBackgroundStyles()} />
            
            {!isVideoOff ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover -scale-x-100 relative z-10 ${backgroundEffect === 'blur' ? 'backdrop-blur-xl bg-white/10' : ''}`}
                style={backgroundEffect !== 'none' && backgroundEffect !== 'blur' ? { mixBlendMode: 'screen', opacity: 0.8 } : {}}
              />
            ) : (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900">
                <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                  <VideoOff className="w-8 h-8" />
                </div>
              </div>
            )}
            
            {/* Audio Meter Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-3">
              <div className={`p-2 rounded-lg backdrop-blur-md border ${isMuted ? 'bg-red-500/20 border-red-500/30 text-red-500' : 'bg-black/50 border-white/10 text-green-400'}`}>
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </div>
              <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden backdrop-blur-md">
                <div 
                  className="h-full bg-green-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, (volumeLevel / 128) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-xl flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-white/10'}`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-4 rounded-xl flex items-center justify-center transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-white/10'}`}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="w-full md:w-80 p-6 flex flex-col bg-[#070709]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Settings
            </h2>
            <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
            {/* Devices */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Camera</label>
                <select 
                  value={selectedVideoDeviceId}
                  onChange={(e) => setSelectedVideoDeviceId(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.substring(0,5)}`}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Microphone</label>
                <select 
                  value={selectedAudioInputId}
                  onChange={(e) => setSelectedAudioInputId(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {audioInputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.substring(0,5)}`}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  Speaker
                </label>
                <select 
                  value={selectedAudioOutputId}
                  onChange={(e) => setSelectedAudioOutputId(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {audioOutputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.substring(0,5)}`}</option>)}
                </select>
              </div>
            </div>

            {/* Virtual Background */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Background Effect</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setBackgroundEffect('none')}
                  className={`aspect-video rounded-lg flex items-center justify-center text-xs font-medium border transition-colors ${backgroundEffect === 'none' ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-white/10 text-neutral-400 hover:border-white/20'}`}
                >
                  None
                </button>
                <button 
                  onClick={() => setBackgroundEffect('blur')}
                  className={`aspect-video rounded-lg flex items-center justify-center text-xs font-medium border transition-colors ${backgroundEffect === 'blur' ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-white/10 text-neutral-400 hover:border-white/20'}`}
                >
                  Blur
                </button>
                <button 
                  onClick={() => setBackgroundEffect('preset1')}
                  className={`aspect-video rounded-lg border bg-cover bg-center transition-colors ${backgroundEffect === 'preset1' ? 'border-purple-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=200&q=80)' }}
                />
                <button 
                  onClick={() => setBackgroundEffect('preset2')}
                  className={`aspect-video rounded-lg border bg-cover bg-center transition-colors ${backgroundEffect === 'preset2' ? 'border-purple-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=200&q=80)' }}
                />
                <label 
                  className={`aspect-video rounded-lg flex items-center justify-center cursor-pointer border transition-colors ${backgroundEffect === 'custom' ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-white/10 text-neutral-400 bg-neutral-900 hover:border-white/20'}`}
                >
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleCustomBgUpload} />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={() => onJoin(isMuted, isVideoOff)}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors shadow-lg shadow-purple-500/20"
            >
              Join Now
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
