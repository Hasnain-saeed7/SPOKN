import React from 'react';
import { Bot } from 'lucide-react';

interface AIAvatarProps {
  isThinking: boolean;
  isSpeaking: boolean;
}

export default function AIAvatar({ isThinking, isSpeaking }: AIAvatarProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`relative flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-200 border-4 border-white shadow-xl transition-all duration-300
        ${isSpeaking ? 'ring-4 ring-purple-400 ring-offset-4 scale-105' : ''}
      `}>
        {isSpeaking && (
           <span className="absolute inset-0 rounded-full bg-purple-400 animate-pulse opacity-20"></span>
        )}
        <Bot className={`w-16 h-16 text-indigo-600 ${isThinking ? 'animate-bounce' : ''}`} />
      </div>

      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-800">Spokn AI Partner</h3>
        <p className="text-sm text-gray-500">
          {isThinking ? 'Typing...' : isSpeaking ? 'Speaking...' : 'Listening actively'}
        </p>
      </div>
    </div>
  );
}