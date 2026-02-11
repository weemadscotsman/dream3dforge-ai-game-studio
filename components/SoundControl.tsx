import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface SoundControlProps {
  onVolumeChange?: (volume: number) => void;
  onMuteChange?: (muted: boolean) => void;
}

export const SoundControl: React.FC<SoundControlProps> = ({ onVolumeChange, onMuteChange }) => {
  const [muted, setMuted] = useState(() => {
    try {
      const saved = localStorage.getItem('d3f-sound-muted');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('d3f-sound-volume');
      return saved ? parseFloat(saved) : 0.7;
    } catch {
      return 0.7;
    }
  });

  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('d3f-sound-muted', String(muted));
      localStorage.setItem('d3f-sound-volume', String(volume));
    } catch {
      // Ignore storage errors
    }
    
    onMuteChange?.(muted);
    onVolumeChange?.(muted ? 0 : volume);
  }, [muted, volume, onMuteChange, onVolumeChange]);

  const toggleMute = () => {
    setMuted(!muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && muted) {
      setMuted(false);
    }
  };

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        onClick={toggleMute}
        className={`p-2 rounded-lg transition-colors ${
          muted 
            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
        }`}
        title={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? (
          <Icons.SoundOff className="w-4 h-4" />
        ) : volume > 0.5 ? (
          <Icons.Sound className="w-4 h-4" />
        ) : (
          <Icons.SoundLow className="w-4 h-4" />
        )}
      </button>

      {/* Volume Slider */}
      <div 
        className={`absolute left-full ml-2 bg-zinc-900 border border-zinc-700 rounded-lg p-2 transition-all ${
          showSlider ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="text-[10px] text-zinc-500 text-center mt-1">
          {Math.round(volume * 100)}%
        </div>
      </div>
    </div>
  );
};

export default SoundControl;
