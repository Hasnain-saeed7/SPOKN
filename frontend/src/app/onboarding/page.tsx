"use client";

import React, { useState, useEffect } from "react";
import { Mic, ArrowRight, CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const router = useRouter();

  // Mock checking level flow
  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsThinking(true);
      setTimeout(() => {
        setIsThinking(false);
        if (questionsAnswered < 2) {
          setQuestionsAnswered(prev => prev + 1);
        } else {
          setStep(2);
        }
      }, 1500);
    } else {
      setIsRecording(true);
    }
  };

  const currentQuestion = 
    questionsAnswered === 0 ? "1. What is your favorite hobby and why?" :
    questionsAnswered === 1 ? "2. Describe a challenging situation you overcame recently." :
    "3. Where do you see yourself in 5 years?";

  return (
    <div className="min-h-screen bg-[#080c10] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0f1923] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#080c10]">
           <motion.div 
             className="h-full bg-gradient-to-r from-[#06b6d4] to-[#67e8f9]"
             initial={{ width: '33%' }}
             animate={{ width: `${(step / 3) * 100}%` }}
           />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center text-center space-y-8 py-8"
            >
              <h1 className="text-3xl font-bold text-white">Welcome! Let's check your level</h1>
              <p className="text-slate-400 max-w-md">
                We'll determine your English proficiency to personalize your AI partner. Please answer 3 quick questions.
              </p>

              <div className="bg-[#080c10] border border-[#06b6d4]/20 p-6 rounded-2xl w-full max-w-md">
                <p className="text-lg font-medium text-[#67e8f9] mb-6 min-h-[60px]">
                  {currentQuestion}
                </p>

                <div className="flex flex-col items-center gap-4">
                  <button 
                    onClick={handleMicClick}
                    disabled={isThinking}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all
                      ${isRecording 
                        ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
                        : isThinking 
                          ? 'bg-[#0891b2] opacity-50 cursor-wait'
                          : 'bg-[#06b6d4] hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.3)]'}
                    `}
                  >
                    {isRecording ? (
                      <span className="w-6 h-6 rounded bg-white animate-pulse"></span>
                    ) : isThinking ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Mic className="w-8 h-8 text-[#080c10]" />
                    )}
                  </button>
                  <p className="text-sm text-slate-500 font-medium">
                    {isRecording ? "Listening... click to stop" : isThinking ? "Analyzing grammar..." : "Click to speak"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center text-center space-y-8 py-12"
            >
              <div className="w-24 h-24 rounded-full bg-[#06b6d4]/10 flex items-center justify-center border-4 border-[#06b6d4]">
                 <span className="text-4xl">🌿</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Great job!</h1>
                <p className="text-xl text-[#06b6d4] font-semibold">Your detected level is <span className="text-white">Intermediate</span></p>
              </div>
              <p className="text-slate-400 max-w-md">
                We noticed you have a good grasp of basic grammar, but we can work on vocabulary expansion and fluency.
              </p>
              <button 
                onClick={() => setStep(3)}
                className="bg-[#06b6d4] text-[#080c10] font-bold px-8 py-3 rounded-xl hover:bg-[#0891b2] transition-colors flex items-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center text-center space-y-8 py-12"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                 <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">You're all set!</h1>
                <p className="text-slate-400">Your custom learning plan has been generated.</p>
              </div>
              <button 
                onClick={() => router.push('/dashboard')}
                className="bg-[#06b6d4] text-[#080c10] font-bold px-8 py-3 rounded-xl hover:bg-[#0891b2] transition-colors flex items-center gap-2 w-full max-w-xs justify-center"
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}