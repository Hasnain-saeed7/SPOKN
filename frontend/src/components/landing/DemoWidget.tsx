"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PlayCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DemoWidget() {
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [hasFinished, setHasFinished] = useState(false);
  const [message, setMessage] = useState("Press the mic to start your AI demo.");
  
  const recognitionRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false); // ADD THIS
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleTranscript(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
          if (event.error !== 'no-speech') {
             setMessage("Could not hear you well. Try again.");
          }
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        }; 
        setIsReady(true); // SET READY TO TRUE IF SUPPORTED
      }
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !hasFinished) {
      handleDemoEnd();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, hasFinished]);

  // Check localStorage for previous demo usage
  useEffect(() => {
    const used = localStorage.getItem('hasUsedDemo');
    if (used) {
      setHasFinished(true);
      setTimeLeft(0);
    }
  }, []);

  const handleDemoEnd = () => {
    setIsActive(false);
    setIsRecording(false);
    setHasFinished(true);
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
    localStorage.setItem('hasUsedDemo', 'true');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleMicClick = () => {
    if (hasFinished || isThinking) return;

    if (!isActive) {
      setIsActive(true);
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setMessage("Listening...");
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start recording:", err);
      }
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; 
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTranscript = async (transcript: string) => {
    setIsThinking(true);
    setMessage(`You: "${transcript}"`);
    
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/demo/chat`,  {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!res.ok) {
        if (res.status === 429) {
             const errorData = await res.json();
             setMessage(errorData.error || "Rate limit exceeded.");
             if (errorData.error && errorData.error.includes("Daily demo limit")) {
                  handleDemoEnd();
             }
        } else {
            throw new Error('Network response was not ok');
        }
        return;
      }

      const data = await res.json();
      setMessage(`AI: "${data.reply}"`);
      speakText(data.reply);

    } catch (error) {
      console.error("Error communicating with AI:", error);
      setMessage("Oops! Something went wrong communicating with the AI.");
    } finally {
      setIsThinking(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative w-full max-w-md mx-auto bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 shadow-2xl overflow-hidden shadow-cyan-900/20">
      
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center">
        
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 text-cyan-400">
             <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
             <span className="text-sm font-semibold tracking-wider">LIVE DEMO</span>
          </div>
          <div className={`font-mono text-sm font-medium px-3 py-1 rounded-full border ${timeLeft < 30 ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-slate-300 border-slate-700 bg-slate-800/50'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* AI Avatar / Feedback Area */}
        <motion.div 
            animate={{ 
                scale: isSpeaking ? 1.05 : 1,
                boxShadow: isSpeaking ? '0 0 20px rgba(6, 182, 212, 0.4)' : '0 0 0 rgba(0,0,0,0)'
            }}
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center mb-6 relative"
        >
             {!isReady && !hasFinished && (
                  <div className="absolute -top-12 bg-red-500 text-white text-xs px-2 py-1 rounded max-w-xs text-center w-max">
                      Requires Chrome/Edge.
                  </div>
             )}
             {isThinking ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
             ) : (
                <PlayCircle className="w-10 h-10 text-white opacity-80" />
             )}
             
            {isRecording && (
                <div className="absolute -inset-2 border-2 border-cyan-400 rounded-full animate-ping opacity-20"></div>
            )}
        </motion.div>

        {/* Message Log */}
        <div className="h-16 flex items-center justify-center mb-8 w-full">
            <p className="text-slate-300 text-center text-sm font-medium max-w-sm line-clamp-2 italic">
               {message}
            </p>
        </div>

        {/* Mic Button */}
        <button 
           onClick={handleMicClick}
           disabled={hasFinished || isThinking || !isReady}
           className={`relative group w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
              ${hasFinished || !isReady
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : isRecording 
                     ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 hover:bg-red-600'
                     : isThinking
                         ? 'bg-sky-700 cursor-wait text-white/50'
                         : 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/40 hover:bg-cyan-400 hover:scale-105'
              }
           `}
        >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <p className="mt-4 text-xs text-slate-500 font-medium">
            {hasFinished ? 'Demo ended' : 'Tap to speak'}
        </p>
      </div>

      {/* Finished Overlay */}
      <AnimatePresence>
          {hasFinished && (
              <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
              >
                 <div className="text-4xl mb-4">🎉</div>
                 <h3 className="text-2xl font-bold text-white mb-2">Time's Up!</h3>
                 <p className="text-slate-300 text-sm mb-8">
                    You've experienced how natural AI practice can be. Create an account to get unlimited sessions and personalized feedback tracking.
                 </p>
                 <div className="flex flex-col gap-3 w-full">
                    <Link href="/register" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-xl transition-colors">
                        Create Free Account
                    </Link>
                    <Link href="#features" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors border border-slate-700">
                        Learn More
                    </Link>
                 </div>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
}