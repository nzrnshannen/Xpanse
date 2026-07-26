import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, X, Settings2 } from 'lucide-react';

interface PreJoinModalProps {
  onJoin: () => void;
  onCancel: () => void;
}

export function PreJoinModal({ onJoin, onCancel }: PreJoinModalProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [volume, setVolume] = useState<number>(0);
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = allDevices.filter(device => device.kind === 'audioinput');
        setDevices(audioInputDevices);
        if (audioInputDevices.length > 0) {
          setSelectedDeviceId(audioInputDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error fetching devices', err);
      }
    };
    getDevices();
  }, []);

  useEffect(() => {
    if (!selectedDeviceId) return;

    const startAudioTest = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { deviceId: { exact: selectedDeviceId } } 
        });
        streamRef.current = stream;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setVolume(average);
          animationRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();

      } catch (err) {
        console.error('Error starting audio test', err);
      }
    };

    startAudioTest();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [selectedDeviceId]);

  const volumePercentage = Math.min(100, (volume / 128) * 100);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-neutral-950 p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-purple-400" />
            Audio Settings & Test
          </h2>
          <button onClick={onCancel} className="text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">Microphone</label>
            <select 
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full bg-neutral-900 border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
                </option>
              ))}
              {devices.length === 0 && (
                <option value="" disabled>No microphones found</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">Input Level</label>
            <div className="flex items-center gap-3 bg-neutral-900 border border-white/[0.05] p-3 rounded-lg">
              <Mic className="w-5 h-5 text-neutral-500 flex-shrink-0" />
              <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-75 ease-linear"
                  style={{ width: `${volumePercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/[0.05]">
            <button 
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onJoin}
              className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
            >
              Join Meeting
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
