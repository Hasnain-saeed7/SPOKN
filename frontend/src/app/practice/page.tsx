// 'use client';

// import React, { useEffect, useRef, useState } from 'react';
// import { connectSocket, getSocket, disconnectSocket } from '../../lib/socket';
// import { createClient } from '@/lib/supabaseClient'
// import MicButton from '../../components/MicButton';
// import AIAvatar from '../../components/AIAvatar';
// import { Globe2, User, Users } from 'lucide-react';

// const ACCENTS = [
//   { value: 'british', label: 'British English', short: 'British', voiceTags: ['en-gb', 'gb', 'uk'] },
//   { value: 'american', label: 'American English', short: 'American', voiceTags: ['en-us', 'us', 'america'] },
//   { value: 'australian', label: 'Australian English', short: 'Australian', voiceTags: ['en-au', 'au', 'australia'] },
//   { value: 'glaswegian', label: 'Glaswegian (Scottish)', short: 'Glaswegian', voiceTags: ['en-gb', 'scotland', 'glasgow'] },
//   { value: 'scouse', label: 'Scouse (Liverpool)', short: 'Scouse', voiceTags: ['en-gb', 'liverpool', 'scouse'] },
//   { value: 'geordie', label: 'Geordie (Newcastle)', short: 'Geordie', voiceTags: ['en-gb', 'newcastle', 'geordie'] },
//   { value: 'cockney', label: 'Cockney (East London)', short: 'Cockney', voiceTags: ['en-gb', 'london', 'cockney'] },
//   { value: 'newzealand', label: 'New Zealand (Kiwi)', short: 'Kiwi', voiceTags: ['en-nz', 'nz', 'new zealand'] },
//   { value: 'bostonian', label: 'Bostonian (US)', short: 'Boston', voiceTags: ['en-us', 'boston'] },
//   { value: 'cajun', label: 'Cajun (Louisiana)', short: 'Cajun', voiceTags: ['en-us', 'louisiana', 'cajun'] },
//   { value: 'newfoundland', label: 'Newfoundland (Canada)', short: 'Newfoundland', voiceTags: ['en-ca', 'newfoundland', 'nl'] },
// ];

// export default function PracticePage() {
//   const [connected, setConnected] = useState(false);
//   const [socketId, setSocketId] = useState<string | null>(null);
//   const [logs, setLogs] = useState<string[]>([]);
//   const [partnerId, setPartnerId] = useState<string | null>(null);
//   const pcRef = useRef<RTCPeerConnection | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
//   const partnerIdRef = useRef<string | null>(null); // To sidestep stale closures
//   const candidateQueueRef = useRef<any[]>([]); // To queue ICE candidates received before remote description
//   const [sessionEnded, setSessionEnded] = useState(false);
//   const [isAiMode, setIsAiMode] = useState(false);
//   const [selectedAccent, setSelectedAccent] = useState('british');
//   const [showAccentPicker, setShowAccentPicker] = useState(false);

//   // --- AI Mode State & Refs ---
//   const [isRecording, setIsRecording] = useState(false);
//   const [isThinking, setIsThinking] = useState(false);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const audioChunksRef = useRef<Blob[]>([]);
//   const sessionStartTimeRef = useRef<number | null>(null);
//   const wordCountRef = useRef<number>(0);
//   const [isSpeaking, setIsSpeaking] = useState(false);

//   useEffect(() => {
//     // Auto-connect on mount so testing is easier
//     handleConnect();
//     return () => {
//       disconnectSocket();
//     };
//   }, []);

//   // Add spacebar logic for mic
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.code === 'Space' && !e.repeat && isAiMode && !isThinking) {
//         startRecording();
//       }
//     };
//     const handleKeyUp = (e: KeyboardEvent) => {
//       if (e.code === 'Space' && isAiMode) {
//         stopRecording();
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     window.addEventListener('keyup', handleKeyUp);
//     return () => {
//       window.removeEventListener('keydown', handleKeyDown);
//       window.removeEventListener('keyup', handleKeyUp);
//     };
//   }, [isAiMode, isThinking, isRecording]);

//   function log(msg: string) {
//     setLogs((l) => [...l, `${new Date().toLocaleTimeString()}: ${msg}`]);
//   }

//   function getAccentLabel(value: string) {
//     return ACCENTS.find((accent) => accent.value === value)?.label || 'British English';
//   }

//   function getAccentVoice(voices: SpeechSynthesisVoice[]) {
//     const accent = ACCENTS.find((item) => item.value === selectedAccent) || ACCENTS[0];
//     const lowered = voices.map((voice) => ({
//       voice,
//       name: `${voice.name} ${voice.lang}`.toLowerCase(),
//     }));

//     for (const tag of accent.voiceTags) {
//       const match = lowered.find(({ name }) => name.includes(tag));
//       if (match) return match.voice;
//     }

//     return lowered.find(({ name }) => name.includes('english'))?.voice || voices[0] || null;
//   }

//   function handleAccentSelect(value: string) {
//     setSelectedAccent(value);
//     setShowAccentPicker(false);
//   }

//   function handleConnect() {
//     const s = connectSocket();
//     s.on('connect', () => {
//       setConnected(true);
//       setSocketId(s.id ?? null);
//       log(`connected ${s.id}`);
//     });
//     s.on('disconnect', () => {
//       setConnected(false);
//       setSocketId(null);
//       log('disconnected');
//     });

//     s.on('match_found', (data: any) => {
//       log('match_found: ' + JSON.stringify(data));
      
//       if (data.role === 'ai_mode') {
//         // Switch entirely to Client-Side AI Mode matching PROJECT.md Architecture
//         setIsAiMode(true);
//         sessionStartTimeRef.current = Date.now();
//         wordCountRef.current = 0;
//         log('Switched to Client-Side AI Mode. WebRTC Disabled for this session.');
//       } else if (data.partnerSocketId) {
//         setPartnerId(data.partnerSocketId);
//         if (data.role === 'offerer') {
//           log('Role is offerer, creating offer...');
//           makeOffer(data.partnerSocketId); 
//         }
//       }
//       if (data.roomId) log('joined room ' + data.roomId);
//     });

//     s.on('offer', async (payload: any) => {
//       log('received offer from ' + payload.from);
//       setPartnerId(payload.from);
//       partnerIdRef.current = payload.from; // update synchronously
//       await ensureLocalStream();
//       await createPeerConnection();
//       const pc = pcRef.current!;
//       await pc.setRemoteDescription(payload.sdp);
//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);
//       s.emit('answer', { target: payload.from, sdp: pc.localDescription });
//       log('sent answer');
//     });

//     s.on('answer', async (payload: any) => {
//       log('received answer from ' + payload.from);
//       const pc = pcRef.current;
//       if (!pc) return;
//       await pc.setRemoteDescription(payload.sdp);
      
//       // Process any ICE candidates that were received early and queued
//       while (candidateQueueRef.current.length > 0) {
//         const candidate = candidateQueueRef.current.shift();
//         try {
//           await pc.addIceCandidate(candidate);
//           log('processed queued ice-candidate');
//         } catch (err) {
//           console.error('error processing queued ice-candidate', err);
//         }
//       }
//     });

//     s.on('ice-candidate', async (payload: any) => {
//       log('received ice-candidate from ' + payload.from);
//       const pc = pcRef.current;
//       if (!pc) return;

//       if (!pc.remoteDescription) {
//         // If we haven't received the answer/offer yet, queue the candidate
//         log('queuing ice-candidate (no remote description yet)');
//         candidateQueueRef.current.push(payload.candidate);
//       } else {
//         try {
//           await pc.addIceCandidate(payload.candidate);
//         } catch (err) {
//           console.error('addIceCandidate error', err);
//         }
//       }
//     });
//   }

//   async function ensureLocalStream() {
//     if (!localStreamRef.current) {
//       try {
//         const s = await navigator.mediaDevices.getUserMedia({ audio: true });
//         localStreamRef.current = s;
//       } catch (err) {
//         log('getUserMedia failed: ' + String(err));
//         throw err;
//       }
//     }
//   }

//   async function createPeerConnection() {
//     if (pcRef.current) return pcRef.current;
//     const pc = new RTCPeerConnection({
//       iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
//     });
//     pcRef.current = pc;

//     pc.onicecandidate = (ev) => {
//       if (ev.candidate) {
//         const s = getSocket();
//         const targetId = partnerIdRef.current;
//         if (s && targetId) {
//           s.emit('ice-candidate', { target: targetId, candidate: ev.candidate });
//           log('sent ice-candidate');
//         } else {
//           log('no target to send ice-candidate to');
//         }
//       }
//     };

//     pc.ontrack = (ev) => {
//       log('remote track received');
//       if (remoteAudioRef.current) {
//         remoteAudioRef.current.srcObject = ev.streams[0];
//         remoteAudioRef.current.play().catch(() => {});
//       }
//     };

//     // add local tracks
//     if (localStreamRef.current) {
//       for (const t of localStreamRef.current.getTracks()) {
//         pc.addTrack(t, localStreamRef.current);
//       }
//     }

//     return pc;
//   }

//   async function joinQueue() {
//     const s = getSocket();
//     if (!s) {
//       log('socket not connected');
//       return;
//     }
//     s.emit('join_queue', { level: 'intermediate', accent: selectedAccent });
//     log('join_queue emitted');
//   }

//   async function makeOffer(targetId: string) {
//     partnerIdRef.current = targetId; // Fix: Set the ref immediately
//     const s = getSocket();
//     if (!s) {
//       log('socket not connected');
//       return;
//     }
//     if (!targetId) {
//       log('makeOffer called without a targetId');
//       return;
//     }
//     await ensureLocalStream();
//     await createPeerConnection();
//     const pc = pcRef.current!;
//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);
//     s.emit('offer', { target: targetId, sdp: pc.localDescription });
//     log(`offer sent to ${targetId}`);
//   }

//   function handlePartnerIdPaste(e: React.ChangeEvent<HTMLInputElement>) {
//     setPartnerId(e.target.value || null);
//   }

//   function hangup() {
//     if (pcRef.current) {
//       pcRef.current.close();
//       pcRef.current = null;
//     }
//     if (localStreamRef.current) {
//       for (const t of localStreamRef.current.getTracks()) t.stop();
//       localStreamRef.current = null;
//     }
//     log('call ended');
//   }
    


  
//     const handleEndSession = async () => {
//   // Stop everything first
//   hangup();
//   window.speechSynthesis.cancel();
//   if (mediaRecorderRef.current && isRecording) {
//     mediaRecorderRef.current.stop();
//   }
//   if (localStreamRef.current) {
//     for (const t of localStreamRef.current.getTracks()) t.stop();
//     localStreamRef.current = null;
//   }

//   // Calculate session duration
//   const durationSeconds = sessionStartTimeRef.current 
//     ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
//     : 0;

//   // Save session to Supabase
//   try {
//     const supabase = createClient()
//     const { data: { user } } = await supabase.auth.getUser()
    
//     if (user) {
//       await supabase.from('sessions').insert({
//         user_id: user.id,
//         session_type: isAiMode ? 'ai' : 'peer',
//         duration_seconds: durationSeconds,
//         fluency_score: 70,        // placeholder until real scoring
//         grammar_score: 70,        // placeholder until real scoring
//         pronunciation_score: 70,  // placeholder until real scoring
//         accuracy_score: 70,       // placeholder until real scoring
//         words_spoken: wordCountRef.current,
//         mistakes: [],
//         suggestions: [],
//         accent_used: selectedAccent,
//       })
//     }
//   } catch (err) {
//     console.error('Failed to save session:', err)
//   }

//   // Reset state
//   setIsAiMode(false);
//   setPartnerId(null);
//   setIsRecording(false);
//   setIsThinking(false);
//   setIsSpeaking(false);
//   setSessionEnded(true);
// };






//   // --- AI Client-Side Logic ---
//   const startRecording = async () => {
//     await ensureLocalStream();
//     if (!localStreamRef.current) return;
    
//     const stream = localStreamRef.current;
    
//     // Choose correct mimetype depending on browser support
//     let mimeType = 'audio/webm';
//     if (!MediaRecorder.isTypeSupported(mimeType)) {
//       mimeType = 'audio/mp4'; // fallback for some Safari versions
//     }
    
//     const mediaRecorder = new MediaRecorder(stream, { mimeType });
//     mediaRecorderRef.current = mediaRecorder;
//     audioChunksRef.current = [];

//     mediaRecorder.ondataavailable = (e) => {
//       if (e.data.size > 0) audioChunksRef.current.push(e.data);
//     };

//     mediaRecorder.onstop = async () => {
//       const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
//       const file = new File([audioBlob], 'audio.webm', { type: mimeType });
//       await sendAudioToAI(file);
//     };

//     mediaRecorder.start();
//     setIsRecording(true);
//     log('recording started... speak now');
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//       log('recording stopped, sending to AI...');
//     }
//   };

//   const sendAudioToAI = async (file: File) => {
//     setIsThinking(true);
//     try {
//       const formData = new FormData();
//       formData.append('audio', file);
//       formData.append('accent', selectedAccent);
      
//       const res = await fetch('/api/ai', {
//         method: 'POST',
//         body: formData,
//       });
//       const data = await res.json();
      
//       if (data.error) {
//         log('AI Error: ' + data.error);
//       } else {
//         log(`You: ${data.userText}`); 
//         const words = data.userText?.trim().split(/\s+/).length || 0;
//         wordCountRef.current += words;
//         log(`AI: ${data.aiText}`);
//         speakText(data.aiText);
//       }
//     } catch (err) {
//       log('Error contacting AI API: ' + String(err));
//     } finally {
//       setIsThinking(false);
//     }
//   };

//   const speakText = (text: string) => {
//     if ('speechSynthesis' in window) {
//       setIsSpeaking(true);
//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.rate = 0.95; 
//       const voices = window.speechSynthesis.getVoices();
//       const accentVoice = getAccentVoice(voices);

//       if (accentVoice) {
//         utterance.voice = accentVoice;
//         utterance.lang = accentVoice.lang;
//       } else {
//         utterance.lang = selectedAccent === 'australian' ? 'en-AU' : selectedAccent === 'american' ? 'en-US' : 'en-GB';
//       }
      
//       utterance.onend = () => setIsSpeaking(false);
//       utterance.onerror = () => setIsSpeaking(false);

//       window.speechSynthesis.speak(utterance);
//     } else {
//       log('Text-to-speech not supported in this browser.');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans">
//       <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
//         {/* Header */}
//         <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-4 md:flex-row md:justify-between md:items-center bg-white">
//           <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
//             Spokn <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Practice Room</span>
//           </h1>
//           <div className="flex flex-wrap items-center gap-3">
//             <div className="relative">
//               <button
//                 onClick={() => setShowAccentPicker(!showAccentPicker)}
//                 className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm hover:shadow-md transition"
//                 aria-haspopup="true"
//                 aria-expanded={showAccentPicker}
//               >
//                 <Globe2 className="w-4 h-4 text-cyan-600" />
//                 <span className="text-sm font-semibold text-gray-800">{ACCENTS.find(a => a.value === selectedAccent)?.short}</span>
//                 <svg className={`w-3 h-3 text-gray-500 transition-transform ${showAccentPicker ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
//                 </svg>
//               </button>

//               {showAccentPicker && (
//                 <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
//                   <div className="grid grid-cols-2 gap-2">
//                     {ACCENTS.map((accent) => (
//                       <button
//                         key={accent.value}
//                         onClick={() => handleAccentSelect(accent.value)}
//                         className={`flex items-center gap-3 p-2 rounded-md text-left transition hover:bg-gray-50 ${selectedAccent === accent.value ? 'ring-2 ring-cyan-300 bg-cyan-50' : ''}`}
//                       >
//                         <div className="w-8 h-8 rounded-md bg-[#0f1923] flex items-center justify-center text-white font-semibold text-xs">
//                           {accent.short.slice(0,2)}
//                         </div>
//                         <div>
//                           <div className="text-sm font-semibold text-gray-800">{accent.label}</div>
//                           <div className="text-xs text-gray-500">{accent.value}</div>
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//             <span className="text-sm font-medium text-gray-500">Status:</span>
//             <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${
//               connected ? 'bg-green-50 text-green-700 border-green-200' 
//               : 'bg-gray-50 text-gray-700 border-gray-200'
//             }`}>
//               {connected ? 'CONNECTED' : 'DISCONNECTED'}
//             </span>
//           </div>
//         </div>

//         {/* Action Bar (Debug) */}
//         {!isAiMode && !partnerId && (
//           <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-2">
//             <span className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-600 flex items-center gap-2">
//               <Globe2 className="w-4 h-4 text-cyan-600" />
//               Practicing with {getAccentLabel(selectedAccent)}
//             </span>
//             {!connected && (
//               <button onClick={handleConnect} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
//                 Connect Socket
//               </button>
//             )}
//             {connected && !partnerId && (
//               <button onClick={joinQueue} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
//                 Start Practice (Join Queue)
//               </button>
//             )}
//           </div>
//         )}

//         {/* Main Content Area */}
//         <div className="p-8">
          
      

//         {/* AI Mode View */}
// {isAiMode && !sessionEnded && (
//   <div className="flex flex-col items-center justify-center py-12 space-y-12">
//     {/* Close button top right */}
//     <div className="w-full flex justify-end -mb-8">
//       <button
//         onClick={handleEndSession}
//         className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
//       >
//         <span>✕</span> End Session
//       </button>
//     </div>

//     <AIAvatar isThinking={isThinking} isSpeaking={isSpeaking} />
//     <div className="text-center -mt-8">
//       <p className="text-sm font-semibold text-gray-600">Accent: {getAccentLabel(selectedAccent)}</p>
//       <p className="text-xs text-gray-500">Your browser voice will try to match this accent.</p>
//     </div>
    
//     <MicButton 
//       isRecording={isRecording}
//       isThinking={isThinking}
//       onStart={startRecording}
//       onStop={stopRecording}
//     />
//   </div>
// )}


//       {/* P2P Mode View */}
// {partnerId && !isAiMode && !sessionEnded && (
//    <div className="flex flex-col items-center py-12 space-y-8">
//      {/* Close button */}
//      <div className="w-full flex justify-end">
//        <button
//          onClick={handleEndSession}
//          className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
//        >
//          <span>✕</span> Disconnect
//        </button>
//      </div>

//      <div className="flex items-center justify-center space-x-12">
//        <div className="flex flex-col items-center space-y-4">
//          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
//            <User className="w-12 h-12 text-gray-400" />
//          </div>
//          <span className="font-medium text-gray-700">You ({socketId?.slice(0, 4)})</span>
//        </div>
//        <div className="flex flex-col items-center">
//          <div className="h-0.5 w-16 bg-green-200 relative">
//            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
//              <Users className="w-6 h-6 text-green-500" />
//            </div>
//          </div>
//          <span className="text-xs text-green-600 mt-2 font-medium bg-green-50 px-2 py-1 rounded">Peer Connected</span>
//        </div>
//        <div className="flex flex-col items-center space-y-4">
//          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center ring-2 ring-indigo-100 shadow-sm relative overflow-hidden">
//            <User className="w-12 h-12 text-indigo-400 relative z-10" />
//            <div className="absolute bottom-0 w-full h-1/3 bg-indigo-100 animate-pulse opacity-50"></div>
//          </div>
//          <span className="font-medium text-indigo-700">Partner ({partnerId.slice(0, 4)})</span>
//        </div>
//      </div>
     
//      <p className="text-gray-500 max-w-md text-center">
//        You are connected via WebRTC. Speak freely. Your audio is transmitted securely peer-to-peer.
//      </p>
//    </div>
// )} 




//      {/* Session Ended View */}
// {sessionEnded && (
//   <div className="flex flex-col items-center justify-center py-24 space-y-6">
//     <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
//       <span className="text-3xl">✓</span>
//     </div>
//     <div className="text-center space-y-2">
//       <h2 className="text-xl font-semibold text-gray-800">Session Ended</h2>
//       <p className="text-gray-500 text-sm">Great work! Ready for another session?</p>
//     </div>
//     <div className="flex gap-3">
//       <button
//         onClick={() => {
//           setSessionEnded(false);
//           joinQueue();
//         }}
//         className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
//       >
//         Practice Again
//       </button>
//       <button
//         onClick={() => window.location.href = '/dashboard'}
//         className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
//       >
//         Go to Dashboard
//       </button>
//     </div>
//   </div>
// )} 






//           {/* Queue View - Waiting for Partner */}
//           {connected && !partnerId && !isAiMode && (
//             <div className="flex flex-col items-center justify-center py-24 space-y-6">
//               <div className="relative">
//                 <div className="w-24 h-24 border-4 border-gray-100 border-t-indigo-500 rounded-full animate-spin"></div>
//                 <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-gray-400" />
//               </div>
//               <div className="text-center space-y-2 max-w-sm">
//                 <h2 className="text-xl font-semibold text-gray-800">Looking for a partner...</h2>
//                 <p className="text-gray-500 text-sm">You have been placed in the queue for {getAccentLabel(selectedAccent)} practice. If no human partner is found within 10 seconds, you will be connected to the AI practice partner.</p>
//               </div>
//             </div>
//           )}

//           {/* Hidden Audio Element for WebRTC */}
//           {!isAiMode && (
//             <div className="hidden">
//               <audio ref={remoteAudioRef} autoPlay controls />
//             </div>
//           )}

//         </div>
        
//         {/* Debug Logs Section */}
//         <div className="bg-slate-900 p-4 border-t border-slate-800 max-h-48 overflow-y-auto">
//           <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">System Logs</h3>
//           <ul className="space-y-1">
//             {logs.map((log, i) => (
//               <li key={i} className="text-slate-300 font-mono text-xs break-words">
//                 <span className="text-slate-500 mr-2">{'>'}</span>{log}
//               </li>
//             ))}
//           </ul>
//         </div>

//       </div>
//     </div>
//   );
// }

 













































'use client';

import React, { useEffect, useRef, useState } from 'react';
import { connectSocket, getSocket, disconnectSocket } from '../../lib/socket';
import { createClient } from '@/lib/supabaseClient'
import MicButton from '../../components/MicButton';
import AIAvatar from '../../components/AIAvatar';
import { Globe2, User, Users } from 'lucide-react';

const ACCENTS = [
  { value: 'british', label: 'British English', short: 'British', lang: 'en-GB', voiceTags: ['en-gb', 'gb', 'uk', 'english (uk)', 'british'] },
  { value: 'american', label: 'American English', short: 'American', lang: 'en-US', voiceTags: ['en-us', 'american', 'english (us)', 'english (united states)'] },
  { value: 'australian', label: 'Australian English', short: 'Australian', lang: 'en-AU', voiceTags: ['en-au', 'australia', 'australian'] },
  { value: 'glaswegian', label: 'Glaswegian (Scottish)', short: 'Glaswegian', lang: 'en-GB', voiceTags: ['en-gb', 'scotland', 'glasgow', 'scottish'] },
  { value: 'scouse', label: 'Scouse (Liverpool)', short: 'Scouse', lang: 'en-GB', voiceTags: ['en-gb', 'liverpool', 'scouse'] },
  { value: 'geordie', label: 'Geordie (Newcastle)', short: 'Geordie', lang: 'en-GB', voiceTags: ['en-gb', 'newcastle', 'geordie'] },
  { value: 'cockney', label: 'Cockney (East London)', short: 'Cockney', lang: 'en-GB', voiceTags: ['en-gb', 'london', 'cockney'] },
  { value: 'newzealand', label: 'New Zealand (Kiwi)', short: 'Kiwi', lang: 'en-NZ', voiceTags: ['en-nz', 'new zealand', 'nz', 'moana'] },
  { value: 'bostonian', label: 'Bostonian (US)', short: 'Boston', lang: 'en-US', voiceTags: ['en-us', 'boston', 'american'] },
  { value: 'cajun', label: 'Cajun (Louisiana)', short: 'Cajun', lang: 'en-US', voiceTags: ['en-us', 'louisiana', 'cajun'] },
  { value: 'newfoundland', label: 'Newfoundland (Canada)', short: 'Newfoundland', lang: 'en-CA', voiceTags: ['en-ca', 'canada', 'newfoundland'] },
];

// Rate/pitch tweaks per accent to make browser TTS sound more distinct
const ACCENT_TTS_PARAMS: Record<string, { rate: number; pitch: number }> = {
  british:      { rate: 0.92, pitch: 1.05 },
  american:     { rate: 1.00, pitch: 1.00 },
  australian:   { rate: 0.97, pitch: 0.95 },
  bostonian:    { rate: 1.05, pitch: 1.00 },
  glaswegian:   { rate: 0.90, pitch: 1.10 },
  scouse:       { rate: 1.08, pitch: 1.15 },
  geordie:      { rate: 0.95, pitch: 1.05 },
  cockney:      { rate: 1.10, pitch: 1.10 },
  newzealand:   { rate: 0.95, pitch: 0.90 },
  cajun:        { rate: 0.88, pitch: 0.95 },
  newfoundland: { rate: 0.90, pitch: 1.00 },
};

export default function PracticePage() {
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const partnerIdRef = useRef<string | null>(null);
  const candidateQueueRef = useRef<any[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [selectedAccent, setSelectedAccent] = useState('british');
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // --- AI Mode State & Refs ---
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sessionStartTimeRef = useRef<number | null>(null);
  const wordCountRef = useRef<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load voices — must wait for voiceschanged event
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => {
    handleConnect();
    return () => { disconnectSocket(); };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && isAiMode && !isThinking) startRecording();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isAiMode) stopRecording();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isAiMode, isThinking, isRecording]);

  function log(msg: string) {
    setLogs((l) => [...l, `${new Date().toLocaleTimeString()}: ${msg}`]);
  }

  function getAccentLabel(value: string) {
    return ACCENTS.find((a) => a.value === value)?.label || 'British English';
  }

  // Smart voice picker: tries accent-specific tags first, then lang prefix, then any English
  function getAccentVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices.length) return null;
    const accentDef = ACCENTS.find((a) => a.value === selectedAccent) || ACCENTS[0];

    // Build searchable strings for each voice
    const tagged = voices.map((v) => ({
      voice: v,
      search: `${v.name} ${v.lang}`.toLowerCase(),
    }));

    // 1. Try accent-specific tags
    for (const tag of accentDef.voiceTags) {
      const match = tagged.find(({ search }) => search.includes(tag));
      if (match) return match.voice;
    }

    // 2. Try matching lang prefix (e.g. en-GB, en-AU)
    const langPrefix = accentDef.lang.toLowerCase();
    const langMatch = tagged.find(({ voice }) => voice.lang.toLowerCase() === langPrefix);
    if (langMatch) return langMatch.voice;

    // 3. Try same language family (e.g. any en-GB for British-family accents)
    const family = langPrefix.split('-')[0]; // 'en'
    const familyMatch = tagged.find(({ voice }) => voice.lang.toLowerCase().startsWith(family));
    if (familyMatch) return familyMatch.voice;

    return voices[0];
  }

  function handleAccentSelect(value: string) {
    setSelectedAccent(value);
    setShowAccentPicker(false);
  }

  function handleConnect() {
    const s = connectSocket();
    s.on('connect', () => {
      setConnected(true);
      setSocketId(s.id ?? null);
      log(`connected ${s.id}`);
    });
    s.on('disconnect', () => {
      setConnected(false);
      setSocketId(null);
      log('disconnected');
    });

    s.on('match_found', (data: any) => {
      log('match_found: ' + JSON.stringify(data));
      if (data.role === 'ai_mode') {
        setIsAiMode(true);
        sessionStartTimeRef.current = Date.now();
        wordCountRef.current = 0;
        log('Switched to Client-Side AI Mode.');
      } else if (data.partnerSocketId) {
        setPartnerId(data.partnerSocketId);
        if (data.role === 'offerer') {
          log('Role is offerer, creating offer...');
          makeOffer(data.partnerSocketId);
        }
      }
      if (data.roomId) log('joined room ' + data.roomId);
    });

    s.on('offer', async (payload: any) => {
      log('received offer from ' + payload.from);
      setPartnerId(payload.from);
      partnerIdRef.current = payload.from;
      await ensureLocalStream();
      await createPeerConnection();
      const pc = pcRef.current!;
      await pc.setRemoteDescription(payload.sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      s.emit('answer', { target: payload.from, sdp: pc.localDescription });
      log('sent answer');
    });

    s.on('answer', async (payload: any) => {
      log('received answer from ' + payload.from);
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(payload.sdp);
      while (candidateQueueRef.current.length > 0) {
        const candidate = candidateQueueRef.current.shift();
        try { await pc.addIceCandidate(candidate); } catch (err) { console.error(err); }
      }
    });

    s.on('ice-candidate', async (payload: any) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (!pc.remoteDescription) {
        candidateQueueRef.current.push(payload.candidate);
      } else {
        try { await pc.addIceCandidate(payload.candidate); } catch (err) { console.error(err); }
      }
    });
  }

  async function ensureLocalStream() {
    if (!localStreamRef.current) {
      try {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        log('getUserMedia failed: ' + String(err));
        throw err;
      }
    }
  }

  async function createPeerConnection() {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;
    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        const s = getSocket();
        const targetId = partnerIdRef.current;
        if (s && targetId) s.emit('ice-candidate', { target: targetId, candidate: ev.candidate });
      }
    };
    pc.ontrack = (ev) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = ev.streams[0];
        remoteAudioRef.current.play().catch(() => {});
      }
    };
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) pc.addTrack(t, localStreamRef.current);
    }
    return pc;
  }

  async function joinQueue() {
    const s = getSocket();
    if (!s) { log('socket not connected'); return; }
    s.emit('join_queue', { level: 'intermediate', accent: selectedAccent });
    log('join_queue emitted');
  }

  async function makeOffer(targetId: string) {
    partnerIdRef.current = targetId;
    const s = getSocket();
    if (!s || !targetId) return;
    await ensureLocalStream();
    await createPeerConnection();
    const pc = pcRef.current!;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    s.emit('offer', { target: targetId, sdp: pc.localDescription });
    log(`offer sent to ${targetId}`);
  }

  function hangup() {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) t.stop();
      localStreamRef.current = null;
    }
    log('call ended');
  }

  const handleEndSession = async () => {
    hangup();
    window.speechSynthesis.cancel();
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
    if (localStreamRef.current) {
      for (const t of localStreamRef.current.getTracks()) t.stop();
      localStreamRef.current = null;
    }
    const durationSeconds = sessionStartTimeRef.current
      ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
      : 0;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('sessions').insert({
          user_id: user.id,
          session_type: isAiMode ? 'ai' : 'peer',
          duration_seconds: durationSeconds,
          fluency_score: 70,
          grammar_score: 70,
          pronunciation_score: 70,
          accuracy_score: 70,
          words_spoken: wordCountRef.current,
          mistakes: [],
          suggestions: [],
          accent_used: selectedAccent,
        });
      }
    } catch (err) { console.error('Failed to save session:', err); }
    setIsAiMode(false);
    setPartnerId(null);
    setIsRecording(false);
    setIsThinking(false);
    setIsSpeaking(false);
    setSessionEnded(true);
  };

  // --- AI Client-Side Logic ---
  const startRecording = async () => {
    await ensureLocalStream();
    if (!localStreamRef.current) return;
    let mimeType = 'audio/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/mp4';
    const mediaRecorder = new MediaRecorder(localStreamRef.current, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      await sendAudioToAI(new File([audioBlob], 'audio.webm', { type: mimeType }));
    };
    mediaRecorder.start();
    setIsRecording(true);
    log('recording started... speak now');
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      log('recording stopped, sending to AI...');
    }
  };

  const sendAudioToAI = async (file: File) => {
    setIsThinking(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('accent', selectedAccent);
      const res = await fetch('/api/ai', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) {
        log('AI Error: ' + data.error);
      } else {
        log(`You: ${data.userText}`);
        wordCountRef.current += data.userText?.trim().split(/\s+/).length || 0;
        log(`AI: ${data.aiText}`);
        speakText(data.aiText);
      }
    } catch (err) {
      log('Error contacting AI API: ' + String(err));
    } finally {
      setIsThinking(false);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      log('Text-to-speech not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel(); // cancel any ongoing speech first

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = availableVoices.length
      ? availableVoices
      : window.speechSynthesis.getVoices();

    const accentDef = ACCENTS.find((a) => a.value === selectedAccent) || ACCENTS[0];
    const ttsParams = ACCENT_TTS_PARAMS[selectedAccent] || { rate: 1.0, pitch: 1.0 };

    const accentVoice = getAccentVoice(voices);
    if (accentVoice) {
      utterance.voice = accentVoice;
      utterance.lang = accentVoice.lang;
    } else {
      // Fallback: set lang directly so browser picks closest voice
      utterance.lang = accentDef.lang;
    }

    utterance.rate = ttsParams.rate;
    utterance.pitch = ttsParams.pitch;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-4 md:flex-row md:justify-between md:items-center bg-white">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Spokn <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Practice Room</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowAccentPicker(!showAccentPicker)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm hover:shadow-md transition"
                aria-haspopup="true"
                aria-expanded={showAccentPicker}
              >
                <Globe2 className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-semibold text-gray-800">{ACCENTS.find(a => a.value === selectedAccent)?.short}</span>
                <svg className={`w-3 h-3 text-gray-500 transition-transform ${showAccentPicker ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {showAccentPicker && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
                  <div className="grid grid-cols-2 gap-2">
                    {ACCENTS.map((accent) => (
                      <button
                        key={accent.value}
                        onClick={() => handleAccentSelect(accent.value)}
                        className={`flex items-center gap-3 p-2 rounded-md text-left transition hover:bg-gray-50 ${selectedAccent === accent.value ? 'ring-2 ring-cyan-300 bg-cyan-50' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-md bg-[#0f1923] flex items-center justify-center text-white font-semibold text-xs">
                          {accent.short.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{accent.label}</div>
                          <div className="text-xs text-gray-500">{accent.value}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-500">Status:</span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${connected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
              {connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        {/* Action Bar */}
        {!isAiMode && !partnerId && (
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-2">
            <span className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-600 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-cyan-600" />
              Practicing with {getAccentLabel(selectedAccent)}
            </span>
            {!connected && (
              <button onClick={handleConnect} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                Connect Socket
              </button>
            )}
            {connected && !partnerId && (
              <button onClick={joinQueue} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                Start Practice (Join Queue)
              </button>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-8">

          {/* AI Mode View */}
          {isAiMode && !sessionEnded && (
            <div className="flex flex-col items-center justify-center py-12 space-y-12">
              <div className="w-full flex justify-end -mb-8">
                <button
                  onClick={handleEndSession}
                  className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span>✕</span> End Session
                </button>
              </div>
              <AIAvatar isThinking={isThinking} isSpeaking={isSpeaking} />
              <div className="text-center -mt-8">
                <p className="text-sm font-semibold text-gray-600">Accent: {getAccentLabel(selectedAccent)}</p>
                <p className="text-xs text-gray-500">Your browser voice will try to match this accent.</p>
              </div>
              <MicButton
                isRecording={isRecording}
                isThinking={isThinking}
                onStart={startRecording}
                onStop={stopRecording}
              />
            </div>
          )}

          {/* P2P Mode View */}
          {partnerId && !isAiMode && !sessionEnded && (
            <div className="flex flex-col items-center py-12 space-y-8">
              <div className="w-full flex justify-end">
                <button onClick={handleEndSession} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
                  <span>✕</span> Disconnect
                </button>
              </div>
              <div className="flex items-center justify-center space-x-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                  <span className="font-medium text-gray-700">You ({socketId?.slice(0, 4)})</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-0.5 w-16 bg-green-200 relative">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <Users className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                  <span className="text-xs text-green-600 mt-2 font-medium bg-green-50 px-2 py-1 rounded">Peer Connected</span>
                </div>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center ring-2 ring-indigo-100 shadow-sm relative overflow-hidden">
                    <User className="w-12 h-12 text-indigo-400 relative z-10" />
                    <div className="absolute bottom-0 w-full h-1/3 bg-indigo-100 animate-pulse opacity-50"></div>
                  </div>
                  <span className="font-medium text-indigo-700">Partner ({partnerId.slice(0, 4)})</span>
                </div>
              </div>
              <p className="text-gray-500 max-w-md text-center">You are connected via WebRTC. Speak freely.</p>
            </div>
          )}

          {/* Session Ended View */}
          {sessionEnded && (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-gray-800">Session Ended</h2>
                <p className="text-gray-500 text-sm">Great work! Ready for another session?</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setSessionEnded(false); joinQueue(); }} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors">
                  Practice Again
                </button>
                <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors">
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Queue / Waiting View */}
          {connected && !partnerId && !isAiMode && (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-gray-100 border-t-indigo-500 rounded-full animate-spin"></div>
                <Users className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-gray-400" />
              </div>
              <div className="text-center space-y-2 max-w-sm">
                <h2 className="text-xl font-semibold text-gray-800">Looking for a partner...</h2>
                <p className="text-gray-500 text-sm">Practicing {getAccentLabel(selectedAccent)}. If no human partner found in 10s, you'll be connected to the AI partner.</p>
              </div>
            </div>
          )}

          {!isAiMode && <div className="hidden"><audio ref={remoteAudioRef} autoPlay controls /></div>}
        </div>

        {/* System Logs */}
        <div className="bg-slate-900 p-4 border-t border-slate-800 max-h-48 overflow-y-auto">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">System Logs</h3>
          <ul className="space-y-1">
            {logs.map((entry, i) => (
              <li key={i} className="text-slate-300 font-mono text-xs break-words">
                <span className="text-slate-500 mr-2">{'>'}</span>{entry}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}











