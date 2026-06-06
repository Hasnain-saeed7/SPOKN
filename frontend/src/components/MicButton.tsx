import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface MicButtonProps {
  isRecording: boolean;
  isThinking: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function MicButton({ isRecording, isThinking, onStart, onStop }: MicButtonProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 my-8">
      <button
        onMouseDown={onStart}
        onMouseUp={onStop}
        onTouchStart={onStart}
        onTouchEnd={onStop}
        disabled={isThinking}
        className={`relative group flex items-center justify-center w-24 h-24 rounded-full transition-all duration-200 select-none shadow-lg
          ${isThinking 
            ? 'bg-gray-200 cursor-not-allowed shadow-none' 
            : isRecording 
              ? 'bg-red-500 scale-110 shadow-red-500/50' 
              : 'bg-green-500 hover:bg-green-600 hover:scale-105 shadow-green-500/30'
          }
        `}
      >
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30"></span>
        )}
        
        {isThinking ? (
           <Loader2 className="w-10 h-10 text-gray-500 animate-spin" />
        ) : isRecording ? (
          <Mic className="w-10 h-10 text-white" />
        ) : (
          <MicOff className="w-10 h-10 text-white" />
        )}
      </button>
      
      <p className="text-sm font-medium text-gray-600">
        {isThinking 
          ? 'AI is thinking...' 
          : isRecording 
            ? 'Listening... Release to send' 
            : 'Hold spacebar or press to speak'}
      </p>
    </div>
  );
}