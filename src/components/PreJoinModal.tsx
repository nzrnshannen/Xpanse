import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, X, Upload, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Using any for Results since we don't have the type imported anymore
type Results = any;

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const mountedRef = useRef(true);
  
  const selfieSegmentationRef = useRef<any>(null);
  const videoFrameRef = useRef<number>(0);
  const isVideoProcessingRef = useRef(false);
  
  const bgEffectRef = useRef(backgroundEffect);
  const customBgRef = useRef(customBgImage);
  const preset1Img = useRef(new Image());
  const preset2Img = useRef(new Image());
  const customImg = useRef(new Image());

  useEffect(() => {
    bgEffectRef.current = backgroundEffect;
  }, [backgroundEffect]);

  useEffect(() => {
    customBgRef.current = customBgImage;
    if (customBgImage) {
      customImg.current.src = customBgImage;
    }
  }, [customBgImage]);

  useEffect(() => {
    preset1Img.current.crossOrigin = 'anonymous';
    preset1Img.current.src = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80';
    
    preset2Img.current.crossOrigin = 'anonymous';
    preset2Img.current.src = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80';
  }, []);

  const onResults = (results: Results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = results.image.width;
    canvas.height = results.image.height;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentEffect = bgEffectRef.current;

    if (currentEffect === 'none') {
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      return;
    }

    // Draw the segmentation mask
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
    
    // Draw the video over the mask
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Draw the background behind the mask
    ctx.globalCompositeOperation = 'destination-over';

    if (currentEffect === 'blur') {
      ctx.filter = 'blur(10px)';
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    } else {
      let bgImg = null;
      if (currentEffect === 'preset1') bgImg = preset1Img.current;
      else if (currentEffect === 'preset2') bgImg = preset2Img.current;
      else if (currentEffect === 'custom') bgImg = customImg.current;

      if (bgImg && bgImg.complete && bgImg.src) {
        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgRatio > canvasRatio) {
           drawHeight = canvas.height;
           drawWidth = bgImg.width * (canvas.height / bgImg.height);
           drawX = (canvas.width - drawWidth) / 2;
           drawY = 0;
        } else {
           drawWidth = canvas.width;
           drawHeight = bgImg.height * (canvas.width / bgImg.width);
           drawX = 0;
           drawY = (canvas.height - drawHeight) / 2;
        }
        ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight);
      } else {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    ctx.restore();
  };

  useEffect(() => {
    const windowSelfie = (window as any).SelfieSegmentation;

    if (!windowSelfie) {
      console.error("MediaPipe SelfieSegmentation not loaded from CDN yet.");
      return;
    }

    selfieSegmentationRef.current = new windowSelfie({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      }
    });
    
    selfieSegmentationRef.current.setOptions({
      modelSelection: 1, // landscape mode
    });
    
    selfieSegmentationRef.current.onResults(onResults);

    return () => {
      if (selfieSegmentationRef.current) {
        selfieSegmentationRef.current.close();
      }
      if (videoFrameRef.current) {
        cancelAnimationFrame(videoFrameRef.current);
      }
      isVideoProcessingRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const getDevices = async () => {
      try {
        const initialStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        
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
    startMediaStream();
  }, [selectedVideoDeviceId, selectedAudioInputId, isVideoOff, isMuted]);

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    isVideoProcessingRef.current = false;
    if (videoFrameRef.current) {
      cancelAnimationFrame(videoFrameRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
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
      
      stopMediaTracks();
      streamRef.current = stream;

      if (videoRef.current && !isVideoOff) {
        videoRef.current.srcObject = stream;
        
        // Start manual frame processing loop for MediaPipe
        if (selfieSegmentationRef.current) {
          isVideoProcessingRef.current = true;
          
          const processFrame = async () => {
            if (!isVideoProcessingRef.current || !videoRef.current || !selfieSegmentationRef.current) return;
            
            try {
              if (videoRef.current.readyState >= 2) {
                await selfieSegmentationRef.current.send({ image: videoRef.current });
              }
            } catch (err) {
              console.error("Error processing video frame", err);
            }
            
            if (isVideoProcessingRef.current) {
              if ('requestVideoFrameCallback' in videoRef.current) {
                (videoRef.current as any).requestVideoFrameCallback(processFrame);
              } else {
                videoFrameRef.current = requestAnimationFrame(processFrame);
              }
            }
          };
          
          videoRef.current.onloadeddata = () => {
            processFrame();
          };
        }
      } else if (isVideoOff) {
        isVideoProcessingRef.current = false;
      }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row"
      >
        <div className="flex-1 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 relative">
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative shadow-inner mb-6">
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="hidden" 
            />

            <canvas 
              ref={canvasRef}
              className={`w-full h-full object-cover -scale-x-100 relative z-10 ${isVideoOff ? 'hidden' : 'block'}`}
            />
            
            {isVideoOff && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-neutral-900">
                <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500">
                  <VideoOff className="w-8 h-8" />
                </div>
              </div>
            )}
            
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
