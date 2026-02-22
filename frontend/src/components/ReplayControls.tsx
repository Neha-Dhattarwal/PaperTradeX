
import React from 'react';

interface ReplayProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
  currentIndex: number;
  maxIndex: number;
  onSeek: (index: number) => void;
}

const ReplayControls: React.FC<ReplayProps> = ({ isPlaying, onTogglePlay, speed, setSpeed, currentIndex, maxIndex, onSeek }) => {
  return (
    <div className="flex flex-col items-center gap-3 bg-slate-900/90 backdrop-blur-2xl border border-slate-700 p-4 rounded-3xl shadow-2xl min-w-[400px]">
      
      {/* Timeline Scrubber */}
      <div className="w-full flex items-center gap-3">
        <span className="text-[9px] font-black text-slate-500 font-mono">0</span>
        <input 
          type="range" 
          min="0" 
          max={maxIndex > 0 ? maxIndex - 1 : 0} 
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="flex-1 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-[9px] font-black text-slate-500 font-mono">{maxIndex}</span>
      </div>

      <div className="flex items-center gap-8 w-full justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onTogglePlay}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-xl active:scale-90 ${isPlaying ? 'bg-slate-800 text-amber-500 border border-slate-700' : 'bg-blue-600 text-white shadow-blue-900/20'}`}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>
          
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            {[1, 2, 5].map(s => (
              <button 
                key={s}
                onClick={() => setSpeed(s)}
                className={`w-9 h-9 rounded-lg text-[10px] font-black transition-all ${speed === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="text-right">
           <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest flex items-center justify-end gap-1.5">
             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
             Simulator Active
           </div>
           <div className="text-[8px] text-slate-500 font-bold uppercase mt-1">Practice Mode: Historical Feed</div>
        </div>
      </div>
    </div>
  );
};

export default ReplayControls;
