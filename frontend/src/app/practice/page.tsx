
// 'use client';

// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { connectSocket, getSocket, disconnectSocket } from '../../lib/socket';
// import { createClient } from '@/lib/supabaseClient';
// import MicButton from '../../components/MicButton';
// import AIAvatar from '../../components/AIAvatar';
// import { Globe2, User, Users } from 'lucide-react';

// const ACCENTS = [
//   { value: 'british',      label: 'British English',        short: 'British',      lang: 'en-GB', voiceTags: ['en-gb', 'gb', 'uk', 'english (uk)', 'british'] },
//   { value: 'american',     label: 'American English',       short: 'American',     lang: 'en-US', voiceTags: ['en-us', 'american', 'english (us)', 'english (united states)'] },
//   { value: 'australian',   label: 'Australian English',     short: 'Australian',   lang: 'en-AU', voiceTags: ['en-au', 'australia', 'australian'] },
//   { value: 'glaswegian',   label: 'Glaswegian (Scottish)',  short: 'Glaswegian',   lang: 'en-GB', voiceTags: ['en-gb', 'scotland', 'glasgow', 'scottish'] },
//   { value: 'scouse',       label: 'Scouse (Liverpool)',     short: 'Scouse',       lang: 'en-GB', voiceTags: ['en-gb', 'liverpool', 'scouse'] },
//   { value: 'geordie',      label: 'Geordie (Newcastle)',    short: 'Geordie',      lang: 'en-GB', voiceTags: ['en-gb', 'newcastle', 'geordie'] },
//   { value: 'cockney',      label: 'Cockney (East London)',  short: 'Cockney',      lang: 'en-GB', voiceTags: ['en-gb', 'london', 'cockney'] },
//   { value: 'newzealand',   label: 'New Zealand (Kiwi)',     short: 'Kiwi',         lang: 'en-NZ', voiceTags: ['en-nz', 'new zealand', 'nz', 'moana'] },
//   { value: 'bostonian',    label: 'Bostonian (US)',         short: 'Boston',       lang: 'en-US', voiceTags: ['en-us', 'boston', 'american'] },
//   { value: 'cajun',        label: 'Cajun (Louisiana)',      short: 'Cajun',        lang: 'en-US', voiceTags: ['en-us', 'louisiana', 'cajun'] },
//   { value: 'newfoundland', label: 'Newfoundland (Canada)',  short: 'Newfoundland', lang: 'en-CA', voiceTags: ['en-ca', 'canada', 'newfoundland'] },
// ];

// const ACCENT_TTS_PARAMS: Record<string, { rate: number; pitch: number }> = {
//   british:      { rate: 0.92, pitch: 1.05 },
//   american:     { rate: 1.00, pitch: 1.00 },
//   australian:   { rate: 0.97, pitch: 0.95 },
//   bostonian:    { rate: 1.05, pitch: 1.00 },
//   glaswegian:   { rate: 0.90, pitch: 1.10 },
//   scouse:       { rate: 1.08, pitch: 1.15 },
//   geordie:      { rate: 0.95, pitch: 1.05 },
//   cockney:      { rate: 1.10, pitch: 1.10 },
//   newzealand:   { rate: 0.95, pitch: 0.90 },
//   cajun:        { rate: 0.88, pitch: 0.95 },
//   newfoundland: { rate: 0.90, pitch: 1.00 },
// };

// export default function PracticePage() {
//   const [connected, setConnected] = useState(false);
//   const [socketId, setSocketId] = useState<string | null>(null);
//   const [logs, setLogs] = useState<string[]>([]);
//   const [partnerId, setPartnerId] = useState<string | null>(null);
//   const [sessionEnded, setSessionEnded] = useState(false);
//   const [isAiMode, setIsAiMode] = useState(false);
//   const [selectedAccent, setSelectedAccent] = useState('british');
//   const [showAccentPicker, setShowAccentPicker] = useState(false);
//   const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
//   const [isRecording, setIsRecording] = useState(false);
//   const [isThinking, setIsThinking] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);

//   const pcRef = useRef<RTCPeerConnection | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
//   const partnerIdRef = useRef<string | null>(null);
//   const candidateQueueRef = useRef<any[]>([]);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const audioChunksRef = useRef<Blob[]>([]);
//   const sessionStartTimeRef = useRef<number | null>(null);
//   const wordCountRef = useRef<number>(0);
//   // Track whether socket listeners have been registered to avoid duplicates
//   const listenersAttachedRef = useRef(false);

//   function log(msg: string) {
//     setLogs((l) => [...l, `${new Date().toLocaleTimeString()}: ${msg}`]);
//   }

//   // ─── Load TTS voices (async in all browsers) ────────────────────────────────
//   useEffect(() => {
//     const loadVoices = () => {
//       const voices = window.speechSynthesis.getVoices();
//       if (voices.length > 0) setAvailableVoices(voices);
//     };
//     loadVoices();
//     window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
//     return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
//   }, []);

//   // ─── Auto-connect on mount ───────────────────────────────────────────────────
//   useEffect(() => {
//     initSocket();
//     return () => {
//       disconnectSocket();
//       listenersAttachedRef.current = false;
//     };
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   // ─── Spacebar toggle (click once = start, click again = send) ───────────────
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.code === 'Space' && !e.repeat && isAiMode && !isThinking) {
//         e.preventDefault();
//         if (isRecording) {
//           stopRecording();
//         } else {
//           startRecording();
//         }
//       }
//     };
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [isAiMode, isThinking, isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ─── Core: initialise socket and attach all listeners ONCE ──────────────────
//   function initSocket() {
//     const s = connectSocket();

//     // Guard: never double-register listeners on the same socket instance
//     if (listenersAttachedRef.current) {
//       // Socket already has listeners — just sync the connected state
//       if (s.connected) {
//         setConnected(true);
//         setSocketId(s.id ?? null);
//       }
//       return;
//     }
//     listenersAttachedRef.current = true;

//     // If already connected when we attach (e.g. HMR / Strict Mode second run)
//     if (s.connected) {
//       setConnected(true);
//       setSocketId(s.id ?? null);
//       log(`already connected: ${s.id}`);
//     }

//     s.on('connect', () => {
//       setConnected(true);
//       setSocketId(s.id ?? null);
//       log(`connected: ${s.id}`);
//     });

//     s.on('disconnect', (reason) => {
//       setConnected(false);
//       setSocketId(null);
//       log(`disconnected: ${reason}`);
//     });

//     s.on('connect_error', (err) => {
//       setConnected(false);
//       log(`connection error: ${err.message} — retrying...`);
//     });

//     s.on('reconnect', (attempt) => {
//       log(`reconnected after ${attempt} attempt(s)`);
//     });

//     s.on('match_found', (data: any) => {
//       log('match_found: ' + JSON.stringify(data));
//       if (data.role === 'ai_mode') {
//         setIsAiMode(true);
//         sessionStartTimeRef.current = Date.now();
//         wordCountRef.current = 0;
//         log('AI mode activated.');
//       } else if (data.partnerSocketId) {
//         setPartnerId(data.partnerSocketId);
//         if (data.role === 'offerer') {
//           log('Role: offerer — creating offer...');
//           makeOffer(data.partnerSocketId);
//         }
//       }
//       if (data.roomId) log('joined room: ' + data.roomId);
//     });

//     s.on('offer', async (payload: any) => {
//       log('received offer from ' + payload.from);
//       setPartnerId(payload.from);
//       partnerIdRef.current = payload.from;
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
//       const pc = pcRef.current;
//       if (!pc) return;
//       await pc.setRemoteDescription(payload.sdp);
//       while (candidateQueueRef.current.length > 0) {
//         const candidate = candidateQueueRef.current.shift();
//         try { await pc.addIceCandidate(candidate); } catch (err) { console.error(err); }
//       }
//     });

//     s.on('ice-candidate', async (payload: any) => {
//       const pc = pcRef.current;
//       if (!pc) return;
//       if (!pc.remoteDescription) {
//         candidateQueueRef.current.push(payload.candidate);
//       } else {
//         try { await pc.addIceCandidate(payload.candidate); } catch (err) { console.error(err); }
//       }
//     });
//   }

//   // ─── WebRTC helpers ──────────────────────────────────────────────────────────
//   async function ensureLocalStream() {
//     if (!localStreamRef.current) {
//       try {
//         localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
//       } catch (err) {
//         log('Microphone access failed: ' + String(err));
//         throw err;
//       }
//     }
//   }

//   async function createPeerConnection() {
//     if (pcRef.current) return pcRef.current;
//     const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
//     pcRef.current = pc;
//     pc.onicecandidate = (ev) => {
//       if (ev.candidate) {
//         const s = getSocket();
//         if (s && partnerIdRef.current) {
//           s.emit('ice-candidate', { target: partnerIdRef.current, candidate: ev.candidate });
//         }
//       }
//     };
//     pc.ontrack = (ev) => {
//       if (remoteAudioRef.current) {
//         remoteAudioRef.current.srcObject = ev.streams[0];
//         remoteAudioRef.current.play().catch(() => {});
//       }
//     };
//     if (localStreamRef.current) {
//       for (const t of localStreamRef.current.getTracks()) pc.addTrack(t, localStreamRef.current);
//     }
//     return pc;
//   }

//   async function makeOffer(targetId: string) {
//     partnerIdRef.current = targetId;
//     const s = getSocket();
//     if (!s || !targetId) return;
//     await ensureLocalStream();
//     await createPeerConnection();
//     const pc = pcRef.current!;
//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);
//     s.emit('offer', { target: targetId, sdp: pc.localDescription });
//     log(`offer sent to ${targetId}`);
//   }

//   function hangup() {
//     if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
//     if (localStreamRef.current) {
//       for (const t of localStreamRef.current.getTracks()) t.stop();
//       localStreamRef.current = null;
//     }
//   }

//   async function joinQueue() {
//     const s = getSocket();
//     if (!s || !s.connected) { log('socket not connected'); return; }
//     s.emit('join_queue', { level: 'intermediate', accent: selectedAccent });
//     log('join_queue emitted');
//   }

//   // ─── Session end ─────────────────────────────────────────────────────────────
//   const handleEndSession = async () => {
//     hangup();
//     window.speechSynthesis.cancel();
//     if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();

//     const durationSeconds = sessionStartTimeRef.current
//       ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
//       : 0;

//     try {
//       const supabase = createClient();
//       const { data: { user } } = await supabase.auth.getUser();
//       if (user) {
//         await supabase.from('sessions').insert({
//           user_id: user.id,
//           session_type: isAiMode ? 'ai' : 'peer',
//           duration_seconds: durationSeconds,
//           fluency_score: 70,
//           grammar_score: 70,
//           pronunciation_score: 70,
//           accuracy_score: 70,
//           words_spoken: wordCountRef.current,
//           mistakes: [],
//           suggestions: [],
//           accent_used: selectedAccent,
//         });
//       }
//     } catch (err) { console.error('Failed to save session:', err); }

//     setIsAiMode(false);
//     setPartnerId(null);
//     setIsRecording(false);
//     setIsThinking(false);
//     setIsSpeaking(false);
//     setSessionEnded(true);
//   };

//   // ─── Recording ───────────────────────────────────────────────────────────────
//   const startRecording = async () => {
//     await ensureLocalStream();
//     if (!localStreamRef.current) return;

//     let mimeType = 'audio/webm';
//     if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/mp4';

//     const mediaRecorder = new MediaRecorder(localStreamRef.current, { mimeType });
//     mediaRecorderRef.current = mediaRecorder;
//     audioChunksRef.current = [];

//     mediaRecorder.ondataavailable = (e) => {
//       if (e.data.size > 0) audioChunksRef.current.push(e.data);
//     };
//     mediaRecorder.onstop = async () => {
//       const blob = new Blob(audioChunksRef.current, { type: mimeType });
//       await sendAudioToAI(new File([blob], 'audio.webm', { type: mimeType }));
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
//       const res = await fetch('/api/ai', { method: 'POST', body: formData });
//       const data = await res.json();
//       if (data.error) {
//         log('AI Error: ' + data.error);
//       } else {
//         log(`You: ${data.userText}`);
//         wordCountRef.current += data.userText?.trim().split(/\s+/).length || 0;
//         log(`AI: ${data.aiText}`);
//         speakText(data.aiText);
//       }
//     } catch (err) {
//       log('Error contacting AI: ' + String(err));
//     } finally {
//       setIsThinking(false);
//     }
//   };

//   // ─── TTS ─────────────────────────────────────────────────────────────────────
//   function getAccentVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
//     if (!voices.length) return null;
//     const accentDef = ACCENTS.find((a) => a.value === selectedAccent) || ACCENTS[0];
//     const tagged = voices.map((v) => ({ voice: v, search: `${v.name} ${v.lang}`.toLowerCase() }));

//     for (const tag of accentDef.voiceTags) {
//       const match = tagged.find(({ search }) => search.includes(tag));
//       if (match) return match.voice;
//     }
//     const langMatch = tagged.find(({ voice }) => voice.lang.toLowerCase() === accentDef.lang.toLowerCase());
//     if (langMatch) return langMatch.voice;

//     const family = accentDef.lang.split('-')[0].toLowerCase();
//     return tagged.find(({ voice }) => voice.lang.toLowerCase().startsWith(family))?.voice || voices[0];
//   }

//   const speakText = (text: string) => {
//     if (!('speechSynthesis' in window)) { log('TTS not supported.'); return; }
//     window.speechSynthesis.cancel();
//     setIsSpeaking(true);

//     const utterance = new SpeechSynthesisUtterance(text);
//     const voices = availableVoices.length ? availableVoices : window.speechSynthesis.getVoices();
//     const accentDef = ACCENTS.find((a) => a.value === selectedAccent) || ACCENTS[0];
//     const ttsParams = ACCENT_TTS_PARAMS[selectedAccent] || { rate: 1.0, pitch: 1.0 };
//     const accentVoice = getAccentVoice(voices);

//     utterance.voice = accentVoice ?? null;
//     utterance.lang = accentVoice ? accentVoice.lang : accentDef.lang;
//     utterance.rate = ttsParams.rate;
//     utterance.pitch = ttsParams.pitch;
//     utterance.onend = () => setIsSpeaking(false);
//     utterance.onerror = () => setIsSpeaking(false);

//     window.speechSynthesis.speak(utterance);
//   };

//   // ─── Helpers ─────────────────────────────────────────────────────────────────
//   function getAccentLabel(value: string) {
//     return ACCENTS.find((a) => a.value === value)?.label || 'British English';
//   }

//   function handleAccentSelect(value: string) {
//     setSelectedAccent(value);
//     setShowAccentPicker(false);
//   }

//   // ─── Render ──────────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans">
//       <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

//         {/* Header */}
//         <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-4 md:flex-row md:justify-between md:items-center bg-white">
//           <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
//             Spokn
//             <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
//               Practice Room
//             </span>
//           </h1>

//           <div className="flex flex-wrap items-center gap-3">
//             {/* Accent Picker */}
//             <div className="relative">
//               <button
//                 onClick={() => setShowAccentPicker(!showAccentPicker)}
//                 className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm hover:shadow-md transition"
//               >
//                 <Globe2 className="w-4 h-4 text-cyan-600" />
//                 <span className="text-sm font-semibold text-gray-800">
//                   {ACCENTS.find((a) => a.value === selectedAccent)?.short}
//                 </span>
//                 <svg
//                   className={`w-3 h-3 text-gray-500 transition-transform ${showAccentPicker ? 'rotate-180' : ''}`}
//                   viewBox="0 0 20 20" fill="currentColor"
//                 >
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
//                         className={`flex items-center gap-2 p-2 rounded-md text-left transition hover:bg-gray-50 ${
//                           selectedAccent === accent.value ? 'ring-2 ring-cyan-300 bg-cyan-50' : ''
//                         }`}
//                       >
//                         <div className="w-8 h-8 rounded-md bg-[#0f1923] flex items-center justify-center text-white font-semibold text-xs shrink-0">
//                           {accent.short.slice(0, 2)}
//                         </div>
//                         <div>
//                           <div className="text-xs font-semibold text-gray-800 leading-tight">{accent.label}</div>
//                           <div className="text-xs text-gray-400">{accent.lang}</div>
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Connection Status */}
//             <span className="text-sm font-medium text-gray-500">Status:</span>
//             <span className={`px-3 py-1 text-sm font-semibold rounded-full border transition-colors ${
//               connected
//                 ? 'bg-green-50 text-green-700 border-green-200'
//                 : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
//             }`}>
//               {connected ? 'CONNECTED' : 'CONNECTING...'}
//             </span>
//           </div>
//         </div>

//         {/* Action Bar — only shown before a session starts */}
//         {!isAiMode && !partnerId && !sessionEnded && (
//           <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center gap-2">
//             <span className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-600 flex items-center gap-2">
//               <Globe2 className="w-4 h-4 text-cyan-600" />
//               Practicing with {getAccentLabel(selectedAccent)}
//             </span>

//             {connected && (
//               <button
//                 onClick={joinQueue}
//                 className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
//               >
//                 Start Practice
//               </button>
//             )}

//             {!connected && (
//               <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-md">
//                 Connecting to server...
//               </span>
//             )}
//           </div>
//         )}

//         {/* Main Content */}
//         <div className="p-8">

//           {/* AI Mode */}
//           {isAiMode && !sessionEnded && (
//             <div className="flex flex-col items-center justify-center py-12 space-y-10">
//               <div className="w-full flex justify-end">
//                 <button
//                   onClick={handleEndSession}
//                   className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
//                 >
//                   <span>✕</span> End Session
//                 </button>
//               </div>
//               <AIAvatar isThinking={isThinking} isSpeaking={isSpeaking} />
//               <div className="text-center">
//                 <p className="text-sm font-semibold text-gray-700">Spokn AI Partner</p>
//                 <p className="text-xs text-gray-500 mt-1">
//                   {isThinking ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Listening actively'}
//                 </p>
//                 <p className="text-xs font-medium text-gray-600 mt-3">Accent: {getAccentLabel(selectedAccent)}</p>
//                 <p className="text-xs text-gray-400">Your browser voice will try to match this accent.</p>
//               </div>
//               <MicButton
//                 isRecording={isRecording}
//                 isThinking={isThinking}
//                 onStart={startRecording}
//                 onStop={stopRecording}
//               />
//             </div>
//           )}

//           {/* P2P Mode */}
//           {partnerId && !isAiMode && !sessionEnded && (
//             <div className="flex flex-col items-center py-12 space-y-8">
//               <div className="w-full flex justify-end">
//                 <button
//                   onClick={handleEndSession}
//                   className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
//                 >
//                   <span>✕</span> Disconnect
//                 </button>
//               </div>
//               <div className="flex items-center justify-center space-x-12">
//                 <div className="flex flex-col items-center space-y-3">
//                   <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
//                     <User className="w-10 h-10 text-gray-400" />
//                   </div>
//                   <span className="text-sm font-medium text-gray-700">You ({socketId?.slice(0, 4)})</span>
//                 </div>
//                 <div className="flex flex-col items-center gap-2">
//                   <Users className="w-6 h-6 text-green-500" />
//                   <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full border border-green-100">
//                     Live
//                   </span>
//                 </div>
//                 <div className="flex flex-col items-center space-y-3">
//                   <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center ring-2 ring-indigo-200 shadow-sm">
//                     <User className="w-10 h-10 text-indigo-400" />
//                   </div>
//                   <span className="text-sm font-medium text-indigo-700">Partner ({partnerId.slice(0, 4)})</span>
//                 </div>
//               </div>
//               <p className="text-sm text-gray-500 max-w-sm text-center">
//                 Connected via WebRTC — audio is transmitted securely peer-to-peer.
//               </p>
//             </div>
//           )}

//           {/* Session Ended */}
//           {sessionEnded && (
//             <div className="flex flex-col items-center justify-center py-24 space-y-6">
//               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
//                 <span className="text-3xl">✓</span>
//               </div>
//               <div className="text-center space-y-2">
//                 <h2 className="text-xl font-semibold text-gray-800">Session Complete</h2>
//                 <p className="text-gray-500 text-sm">Great work! Ready for another round?</p>
//               </div>
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => { setSessionEnded(false); joinQueue(); }}
//                   className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
//                 >
//                   Practice Again
//                 </button>
//                 <button
//                   onClick={() => window.location.href = '/dashboard'}
//                   className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
//                 >
//                   Dashboard
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Waiting in Queue */}
//           {connected && !partnerId && !isAiMode && !sessionEnded && (
//             <div className="flex flex-col items-center justify-center py-24 space-y-6">
//               <div className="relative">
//                 <div className="w-20 h-20 border-4 border-gray-100 border-t-indigo-500 rounded-full animate-spin" />
//                 <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 text-gray-400" />
//               </div>
//               <div className="text-center space-y-2 max-w-sm">
//                 <h2 className="text-lg font-semibold text-gray-800">Finding a partner...</h2>
//                 <p className="text-gray-500 text-sm">
//                   Practicing {getAccentLabel(selectedAccent)}. If no human partner is found in 10s, the AI partner will join automatically.
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* Not yet in queue — show prompt to start */}
//           {connected && !partnerId && !isAiMode && !sessionEnded && logs.length === 0 && (
//             <div className="text-center py-12 text-gray-400 text-sm">
//               Click <strong>Start Practice</strong> above to begin.
//             </div>
//           )}

//           {!isAiMode && (
//             <div className="hidden">
//               <audio ref={remoteAudioRef} autoPlay />
//             </div>
//           )}
//         </div>

//         {/* System Logs */}
//         <div className="bg-slate-900 p-4 border-t border-slate-800 max-h-48 overflow-y-auto">
//           <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">System Logs</h3>
//           <ul className="space-y-1">
//             {logs.length === 0 && (
//               <li className="text-slate-500 font-mono text-xs">Waiting for connection...</li>
//             )}
//             {logs.map((entry, i) => (
//               <li key={i} className="text-slate-300 font-mono text-xs break-words">
//                 <span className="text-slate-500 mr-2">{'>'}</span>{entry}
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
import { createClient } from '@/lib/supabaseClient';
import MicButton from '../../components/MicButton';
import AIAvatar from '../../components/AIAvatar';
import { Globe2, User, Users } from 'lucide-react';

const ACCENTS = [
  { value: 'british',      label: 'British English',        short: 'British',      lang: 'en-GB', voiceTags: ['en-gb', 'gb', 'uk', 'english (uk)', 'british'] },
  { value: 'american',     label: 'American English',       short: 'American',     lang: 'en-US', voiceTags: ['en-us', 'american', 'english (us)', 'english (united states)'] },
  { value: 'australian',   label: 'Australian English',     short: 'Australian',   lang: 'en-AU', voiceTags: ['en-au', 'australia', 'australian'] },
  { value: 'glaswegian',   label: 'Glaswegian (Scottish)',  short: 'Glaswegian',   lang: 'en-GB', voiceTags: ['en-gb', 'scotland', 'glasgow', 'scottish'] },
  { value: 'scouse',       label: 'Scouse (Liverpool)',     short: 'Scouse',       lang: 'en-GB', voiceTags: ['en-gb', 'liverpool', 'scouse'] },
  { value: 'geordie',      label: 'Geordie (Newcastle)',    short: 'Geordie',      lang: 'en-GB', voiceTags: ['en-gb', 'newcastle', 'geordie'] },
  { value: 'cockney',      label: 'Cockney (East London)',  short: 'Cockney',      lang: 'en-GB', voiceTags: ['en-gb', 'london', 'cockney'] },
  { value: 'newzealand',   label: 'New Zealand (Kiwi)',     short: 'Kiwi',         lang: 'en-NZ', voiceTags: ['en-nz', 'new zealand', 'nz', 'moana'] },
  { value: 'bostonian',    label: 'Bostonian (US)',         short: 'Boston',       lang: 'en-US', voiceTags: ['en-us', 'boston', 'american'] },
  { value: 'cajun',        label: 'Cajun (Louisiana)',      short: 'Cajun',        lang: 'en-US', voiceTags: ['en-us', 'louisiana', 'cajun'] },
  { value: 'newfoundland', label: 'Newfoundland (Canada)',  short: 'Newfoundland', lang: 'en-CA', voiceTags: ['en-ca', 'canada', 'newfoundland'] },
];

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
  const [myName, setMyName] = useState<string>('You');
  const [logs, setLogs] = useState<string[]>([]);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string>('Partner');
  const [sessionEnded, setSessionEnded] = useState(false);
  const [partnerLeft, setPartnerLeft] = useState(false); // NEW: partner disconnected mid-call
  const [isAiMode, setIsAiMode] = useState(false);
  const [selectedAccent, setSelectedAccent] = useState('british');
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const partnerIdRef = useRef<string | null>(null);
  const candidateQueueRef = useRef<any[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sessionStartTimeRef = useRef<number | null>(null);
  const wordCountRef = useRef<number>(0);
  const listenersAttachedRef = useRef(false);

  function log(msg: string) {
    setLogs((l) => [...l, `${new Date().toLocaleTimeString()}: ${msg}`]);
  }

  // ─── Load TTS voices ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setAvailableVoices(voices);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // ─── Load user name from Supabase ────────────────────────────────────────────
  useEffect(() => {
    const loadName = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'User';
          setMyName(name);
        }
      } catch (err) {
        console.error('Could not load user name:', err);
      }
    };
    loadName();
  }, []);

  // ─── Auto-connect on mount ───────────────────────────────────────────────────
  useEffect(() => {
    initSocket();
    return () => {
      disconnectSocket();
      listenersAttachedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Spacebar toggle ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && isAiMode && !isThinking) {
        e.preventDefault();
        if (isRecording) stopRecording();
        else startRecording();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAiMode, isThinking, isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Socket initialisation ───────────────────────────────────────────────────
  function initSocket() {
    const s = connectSocket();

    if (listenersAttachedRef.current) {
      if (s.connected) { setConnected(true); setSocketId(s.id ?? null); }
      return;
    }
    listenersAttachedRef.current = true;

    if (s.connected) {
      setConnected(true);
      setSocketId(s.id ?? null);
      log(`already connected: ${s.id}`);
    }

    s.on('connect', () => {
      setConnected(true);
      setSocketId(s.id ?? null);
      log(`connected: ${s.id}`);
    });

    s.on('disconnect', (reason) => {
      setConnected(false);
      setSocketId(null);
      log(`disconnected: ${reason}`);
    });

    s.on('connect_error', (err) => {
      setConnected(false);
      log(`connection error: ${err.message} — retrying...`);
    });

    s.on('reconnect', (attempt: number) => {
      log(`reconnected after ${attempt} attempt(s)`);
    });

    s.on('match_found', (data: any) => {
      log('match_found: ' + JSON.stringify(data));
      if (data.role === 'ai_mode') {
        setIsAiMode(true);
        sessionStartTimeRef.current = Date.now();
        wordCountRef.current = 0;
        log('AI mode activated.');
      } else if (data.partnerSocketId) {
        setPartnerId(data.partnerSocketId);
        // Use real name if backend sent it, else fall back to short ID
        setPartnerName(data.partnerName || `User-${data.partnerSocketId.slice(0, 4)}`);
        setPartnerLeft(false);
        if (data.role === 'offerer') {
          log(`Matched with ${data.partnerName || data.partnerSocketId} — creating offer...`);
          makeOffer(data.partnerSocketId);
        } else {
          log(`Matched with ${data.partnerName || data.partnerSocketId} — waiting for offer...`);
        }
      }
      if (data.roomId) log('joined room: ' + data.roomId);
    });

    // ── Bug 1 fix: handle partner disconnect ──
    s.on('partner_disconnected', (data: any) => {
      log(`Partner left: ${data.message || 'Your partner has disconnected.'}`);
      setPartnerLeft(true);
      // Clean up WebRTC
      hangup();
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

  // ─── WebRTC ──────────────────────────────────────────────────────────────────
  async function ensureLocalStream() {
    if (!localStreamRef.current) {
      try {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        log('Microphone access failed: ' + String(err));
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
        if (s && partnerIdRef.current) s.emit('ice-candidate', { target: partnerIdRef.current, candidate: ev.candidate });
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
  }

  async function joinQueue() {
    const s = getSocket();
    if (!s || !s.connected) { log('socket not connected'); return; }
    // Send name so backend can pass it to matched partner
    s.emit('join_queue', { level: 'intermediate', accent: selectedAccent, name: myName });
    log('join_queue emitted');
    setPartnerLeft(false);
  }

  // ─── Session end ─────────────────────────────────────────────────────────────
  const handleEndSession = async () => {
    hangup();
    window.speechSynthesis.cancel();
    if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
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
    setPartnerName('Partner');
    setIsRecording(false);
    setIsThinking(false);
    setIsSpeaking(false);
    setPartnerLeft(false);
    setSessionEnded(true);
  };

  // ─── Recording ───────────────────────────────────────────────────────────────
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
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      await sendAudioToAI(new File([blob], 'audio.webm', { type: mimeType }));
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
      log('Error contacting AI: ' + String(err));
    } finally {
      setIsThinking(false);
    }
  };

  // ─── TTS ─────────────────────────────────────────────────────────────────────
  function getAccentVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices.length) return null;
    const accentDef = ACCENTS.find((a) => a.value === selectedAccent) || ACCENTS[0];
    const tagged = voices.map((v) => ({ voice: v, search: `${v.name} ${v.lang}`.toLowerCase() }));
    for (const tag of accentDef.voiceTags) {
      const match = tagged.find(({ search }) => search.includes(tag));
      if (match) return match.voice;
    }
    const langMatch = tagged.find(({ voice }) => voice.lang.toLowerCase() === accentDef.lang.toLowerCase());
    if (langMatch) return langMatch.voice;
    const family = accentDef.lang.split('-')[0].toLowerCase();
    return tagged.find(({ voice }) => voice.lang.toLowerCase().startsWith(family))?.voice || voices[0];
  }

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) { log('TTS not supported.'); return; }
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = availableVoices.length ? availableVoices : window.speechSynthesis.getVoices();
    const accentDef = ACCENTS.find((a) => a.value === selectedAccent) || ACCENTS[0];
    const ttsParams = ACCENT_TTS_PARAMS[selectedAccent] || { rate: 1.0, pitch: 1.0 };
    const accentVoice = getAccentVoice(voices);
    utterance.voice = accentVoice ?? null;
    utterance.lang = accentVoice ? accentVoice.lang : accentDef.lang;
    utterance.rate = ttsParams.rate;
    utterance.pitch = ttsParams.pitch;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  function getAccentLabel(value: string) {
    return ACCENTS.find((a) => a.value === value)?.label || 'British English';
  }

  function handleAccentSelect(value: string) {
    setSelectedAccent(value);
    setShowAccentPicker(false);
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-4 md:flex-row md:justify-between md:items-center bg-white">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Spokn
            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Practice Room</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowAccentPicker(!showAccentPicker)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm hover:shadow-md transition"
              >
                <Globe2 className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-semibold text-gray-800">{ACCENTS.find((a) => a.value === selectedAccent)?.short}</span>
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
                        className={`flex items-center gap-2 p-2 rounded-md text-left transition hover:bg-gray-50 ${selectedAccent === accent.value ? 'ring-2 ring-cyan-300 bg-cyan-50' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-md bg-[#0f1923] flex items-center justify-center text-white font-semibold text-xs shrink-0">
                          {accent.short.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-800 leading-tight">{accent.label}</div>
                          <div className="text-xs text-gray-400">{accent.lang}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-500">Status:</span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border transition-colors ${
              connected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
            }`}>
              {connected ? 'CONNECTED' : 'CONNECTING...'}
            </span>
          </div>
        </div>

        {/* Action Bar */}
        {!isAiMode && !partnerId && !sessionEnded && (
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center gap-2">
            <span className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-600 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-cyan-600" />
              Practicing with {getAccentLabel(selectedAccent)}
            </span>
            {connected && (
              <button onClick={joinQueue} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                Start Practice
              </button>
            )}
            {!connected && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-md">
                Connecting to server...
              </span>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="p-8">

          {/* AI Mode */}
          {isAiMode && !sessionEnded && (
            <div className="flex flex-col items-center justify-center py-12 space-y-10">
              <div className="w-full flex justify-end">
                <button onClick={handleEndSession} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
                  <span>✕</span> End Session
                </button>
              </div>
              <AIAvatar isThinking={isThinking} isSpeaking={isSpeaking} />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Spokn AI Partner</p>
                <p className="text-xs text-gray-500 mt-1">{isThinking ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Listening actively'}</p>
                <p className="text-xs font-medium text-gray-600 mt-3">Accent: {getAccentLabel(selectedAccent)}</p>
                <p className="text-xs text-gray-400">Your browser voice will try to match this accent.</p>
              </div>
              <MicButton isRecording={isRecording} isThinking={isThinking} onStart={startRecording} onStop={stopRecording} />
            </div>
          )}

          {/* P2P Mode */}
          {partnerId && !isAiMode && !sessionEnded && (
            <div className="flex flex-col items-center py-12 space-y-8">

              {/* Partner left banner */}
              {partnerLeft && (
                <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 text-sm font-medium">⚠ {partnerName} has left the call.</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPartnerId(null); setPartnerLeft(false); joinQueue(); }}
                      className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Find new partner
                    </button>
                    <button
                      onClick={handleEndSession}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 transition-colors"
                    >
                      End session
                    </button>
                  </div>
                </div>
              )}

              {!partnerLeft && (
                <div className="w-full flex justify-end">
                  <button onClick={handleEndSession} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
                    <span>✕</span> Disconnect
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center space-x-12">
                {/* You */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
                    <span className="text-2xl font-semibold text-gray-500">{myName.slice(0, 1).toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{myName} (you)</span>
                </div>

                {/* Connector */}
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-6 h-6 text-green-500" />
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
                    partnerLeft
                      ? 'text-amber-600 bg-amber-50 border-amber-100'
                      : 'text-green-600 bg-green-50 border-green-100'
                  }`}>
                    {partnerLeft ? 'Left' : 'Live'}
                  </span>
                </div>

                {/* Partner */}
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ring-2 shadow-sm ${
                    partnerLeft ? 'bg-gray-100 ring-gray-200' : 'bg-indigo-50 ring-indigo-200'
                  }`}>
                    <span className={`text-2xl font-semibold ${partnerLeft ? 'text-gray-400' : 'text-indigo-500'}`}>
                      {partnerName.slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${partnerLeft ? 'text-gray-400' : 'text-indigo-700'}`}>
                    {partnerName}
                  </span>
                </div>
              </div>

              {!partnerLeft && (
                <p className="text-sm text-gray-500 max-w-sm text-center">
                  Connected via WebRTC — audio is transmitted securely peer-to-peer.
                </p>
              )}
            </div>
          )}

          {/* Session Ended */}
          {sessionEnded && (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-gray-800">Session Complete</h2>
                <p className="text-gray-500 text-sm">Great work! Ready for another round?</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setSessionEnded(false); joinQueue(); }} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors">
                  Practice Again
                </button>
                <button onClick={() => window.location.href = '/dashboard'} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors">
                  Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Waiting in Queue */}
          {connected && !partnerId && !isAiMode && !sessionEnded && logs.some(l => l.includes('join_queue')) && (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-100 border-t-indigo-500 rounded-full animate-spin" />
                <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 text-gray-400" />
              </div>
              <div className="text-center space-y-2 max-w-sm">
                <h2 className="text-lg font-semibold text-gray-800">Finding a partner...</h2>
                <p className="text-gray-500 text-sm">
                  Practicing {getAccentLabel(selectedAccent)}. If no human partner is found in 10s, the AI partner will join automatically.
                </p>
              </div>
            </div>
          )}

          {/* Initial prompt */}
          {connected && !partnerId && !isAiMode && !sessionEnded && !logs.some(l => l.includes('join_queue')) && (
            <div className="text-center py-16 text-gray-400 text-sm">
              Click <strong className="text-gray-600">Start Practice</strong> above to begin.
            </div>
          )}

          {!isAiMode && <div className="hidden"><audio ref={remoteAudioRef} autoPlay /></div>}
        </div>

        {/* System Logs */}
        <div className="bg-slate-900 p-4 border-t border-slate-800 max-h-48 overflow-y-auto">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">System Logs</h3>
          <ul className="space-y-1">
            {logs.length === 0 && <li className="text-slate-500 font-mono text-xs">Waiting for connection...</li>}
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
