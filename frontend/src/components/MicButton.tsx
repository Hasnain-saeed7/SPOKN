import React from 'react';
import { Mic, MicOff, Loader2, Send } from 'lucide-react';

interface MicButtonProps {
  isRecording: boolean;
  isThinking: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function MicButton({ isRecording, isThinking, onStart, onStop }: MicButtonProps) {
  const handleClick = () => {
    if (isThinking) return;
    if (isRecording) {
      onStop(); // second click → stop and send
    } else {
      onStart(); // first click → start recording
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 my-8">
      <button
        onClick={handleClick}
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
        {/* Ping animation while recording */}
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"></span>
        )}

        {isThinking ? (
          <Loader2 className="w-10 h-10 text-gray-500 animate-spin" />
        ) : isRecording ? (
          <Send className="w-10 h-10 text-white" />
        ) : (
          <Mic className="w-10 h-10 text-white" />
        )}
      </button>

      <p className="text-sm font-medium text-gray-600">
        {isThinking
          ? 'AI is thinking...'
          : isRecording
            ? 'Listening... Click to send'
            : 'Click to speak'}
      </p>
    </div>
  );
} 