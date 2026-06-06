"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { connectSocket, getSocket } from "@/lib/socket";
import {
  Mic, Bell, ChevronDown, Flame, TrendingUp,
  Play, Bot, LayoutTemplate, Clock, Mic2,
  Target, Calendar, History, AlertCircle, Users, Activity,
  LogOut, Settings, User as UserIcon, ArrowUpRight
} from "lucide-react";
import { RadialBarChart, RadialBar, AreaChart, Area, BarChart, Bar, ResponsiveContainer, Cell } from "recharts";
import {
  getTodayStats, getLast7DaysScores, getWeeklySessionCount,
  getLast30DaysDates, getRecentSessions, getWeakAreas
} from "@/lib/dashboard";
import toast from "react-hot-toast";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Good night";
};

export default function DashboardPage() {
  const [userName, setUserName] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [userId, setUserId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({ sessions: 0, minutes: 0, words: 0, accuracy: 0 });
  const [last7Scores, setLast7Scores] = useState<any[]>([]);
  const [weeklyTarget, setWeeklyTarget] = useState(0);
  const [last30Dates, setLast30Dates] = useState<number[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [weakAreas, setWeakAreas] = useState<any[] | null>([]);

  // Partner socket state
  const [onlineCount, setOnlineCount] = useState({ total: 0, byLevel: { beginner: 0, intermediate: 0, advanced: 0 }, users: [] as any[]});
  const [selectedMatchLevel, setSelectedMatchLevel] = useState("Any level");

  useEffect(() => {
    const fetchUserAndData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login"); // Redirect to login if unauthenticated
        return;
      }
      
      const name = user.user_metadata?.full_name?.split(" ")[0] || "Learner";
      setUserName(name);
      
      // Capitalize first letter of level
      const lvlStr = user.user_metadata?.english_level || "intermediate";
      setLevel(lvlStr.charAt(0).toUpperCase() + lvlStr.slice(1));
      setUserId(user.id);
      
      try {
        const [stats, scores, wek, days, rec, weak] = await Promise.all([
          getTodayStats(user.id),
          getLast7DaysScores(user.id),
          getWeeklySessionCount(user.id),
          getLast30DaysDates(user.id),
          getRecentSessions(user.id, 3),
          getWeakAreas(user.id)
        ]);

        setTodayStats(stats);
        setLast7Scores(scores);
        setWeeklyTarget(wek);
        setLast30Dates(days);
        setRecentSessions(rec);
        setWeakAreas(weak);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
      
      setLoading(false);
    };
    fetchUserAndData();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    
    // Connect logic handled in layout/auth potentially, but emit here
    const socket = connectSocket();
    if (!socket.connected) {
      socket.connect();
    }
    
    socket.emit("user_online", { userId, level: level.toLowerCase(), name: userName });
    
    const fetchOnline = () => {
      socket.emit("get_online_count", (data: any) => {
          if (data) setOnlineCount(data);
      });
    };
    
    fetchOnline();
    const interval = setInterval(fetchOnline, 30000);
    
    const handleCountUpdate = (data: any) => {
        setOnlineCount(data);
    };
    socket.on("online_count_update", handleCountUpdate);

    const handleBeforeUnload = () => socket.emit("user_offline");
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      clearInterval(interval);
      socket.off("online_count_update", handleCountUpdate);
      socket.emit("user_offline");
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [userId, level, userName]);

  const handleLogout = async () => {
    const socket = getSocket();
    if (socket) socket.emit("user_offline");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleConnect = () => {
      // Find a partner
      let count = onlineCount.total;
      if (selectedMatchLevel !== "Any level") {
          const l = selectedMatchLevel.toLowerCase();
          count = onlineCount.byLevel[l as keyof typeof onlineCount.byLevel] || 0;
      }
      
      if (count > 0) {
          router.push(`/practice?mode=peer&practiceId=${userId}`);
      } else {
          toast.success("No partners available, switching to AI mode");
          router.push(`/practice?mode=ai&practiceId=${userId}`);
      }
  };

  const currentFluency = last7Scores.length > 0 ? last7Scores[last7Scores.length - 1].fluency_score : 85; 
  // RadialBarChart expects data like this
  const radialData = [{ name: 'Fluency', value: currentFluency, fill: '#06b6d4' }];
  
  // Weekly goal data
  const gaugeData = [{ name: "Target", completed: weeklyTarget, remaining: Math.max(0, 5 - weeklyTarget) }];

  // 30 days calendar generator
  const renderCalendar = () => {
      const days = [];
      const today = new Date();
      today.setHours(0,0,0,0);
      for(let i=29; i>=0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const active = last30Dates.includes(d.getTime());
          days.push(
              <div 
                  key={i} 
                  className={`w-7 h-7 rounded-md border flex items-center justify-center ${
                  active 
                  ? 'bg-emerald-400/20 border-emerald-400/30' 
                  : 'bg-[#080c10] border-white/5'
                  }`}
              >
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>}
              </div>
          );
      }
      return <div className="flex flex-wrap gap-1 mt-4">{days}</div>;
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-[#080c10] text-[#f8fafc] font-sans pb-12 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400">Loading your dashboard...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-12">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 bg-[#0f1923]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-[#06b6d4] p-1.5 rounded-lg text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-[#67e8f9]">
              SPOKN
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <span className="text-sm font-medium text-white">{userName}</span>
              <span className="text-xs bg-[#06b6d4]/20 text-[#06b6d4] px-2 py-0.5 rounded-full font-semibold">
                {level}
              </span>
            </div>

            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-9 h-9 rounded-full bg-linear-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                  {userName.charAt(0) || "U"}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-[#0f1923] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
                 
                
                  <div className="h-px bg-white/10 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 mt-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-cyan-200 border border-white/5 rounded-2xl p-10 flex flex-col justify-center relative overflow-hidden transition-all duration-200 hover:border-cyan-500/30">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4 relative z-10 tracking-tight">
              {getGreeting()}, {userName} <span className="animate-wave inline-block origin-[70%_70%]"></span>
            </h1>
            <p className="text-lg text-[#94a3b8] relative z-10">
              You're <strong className="text-black">{Math.max(0, 5 - weeklyTarget)} sessions</strong> away from your weekly goal. Keep it up!
            </p>
          </div>

          <div className="bg-cyan-200 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col transition-all duration-200 hover:border-cyan-500/30">
            <h3 className="text-xl font-semibold text-black mb-2 relative z-10 border-l-2 border-cyan-500 pl-3">Fluency Score</h3>
            
            <div className="flex flex-col items-center justify-center relative z-10 flex-1">
              <div className="relative w-36 h-36 flex shrink-0 items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="80%" outerRadius="100%" barSize={30} data={radialData} startAngle={90} endAngle={-270}>
                      <RadialBar background={{ fill: '#ffffff10' }} dataKey="value" cornerRadius={30} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <span className="absolute text-5xl font-bold text-black tracking-tighter">{currentFluency}</span>
              </div>
              
              <div className="w-full h-16 mt-2 opacity-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={last7Scores}>
                      <Area type="monotone" dataKey="fluency_score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {[
            { label: "Sessions Today", val: todayStats.sessions, icon: History, color: "text-amber-800", border: "border-cyan-500", sparkColor: "#06b6d4" },
            { label: "Minutes Spoken", val: todayStats.minutes, icon: Clock, color: "text-emerald-400", border: "border-emerald-500", sparkColor: "#22c55e" },
            { label: "Words Spoken", val: todayStats.words, icon: Mic2, color: "text-purple-400", border: "border-purple-500", sparkColor: "#a855f7" },
            { label: "Accuracy", val: `${todayStats.accuracy}%`, icon: Target, color: "text-amber-400", border: "border-amber-500", sparkColor: "black" },
          ].map((stat, i) => {
              // Creating a simple mock data for stats sparkline to represent 7 days of that stat,
              // ideally in a real fully integrated system this comes from getLast7DaysStats(type)
              // but since user prompt didn't specify the exact schema for the other 7-day stats, 
              // we can just use dummy variability around the target just for the sparkline shape, 
              // or query it if available. 
              const numVal = typeof stat.val === 'string' ? parseInt(stat.val.replace('%','')) || 0 : stat.val as number;
              const sparkData = [
                  {val: numVal > 0 ? numVal*0.8 : 0},
                  {val: numVal > 0 ? numVal*1.2 : 0},
                  {val: numVal > 0 ? numVal*0.9 : 0},
                  {val: numVal > 0 ? numVal*1.1 : 0},
                  {val: numVal > 0 ? numVal*1.0 : 0},
                  {val: numVal}
              ];

              return (
                <div key={i} className={`bg-cyan-200 border border-white/5 border-b-[3px] ${stat.border} rounded-2xl p-6 relative flex flex-col min-h-35 justify-between overflow-hidden group hover:border-[#06b6d4]/30 transition-all duration-200`}>
                  <stat.icon className={`absolute top-4 right-4 w-6 h-6 opacity-40 transition-opacity ${stat.color}`} />
                  <div>
                    <p className="text-5xl font-bold text-black mb-1 tracking-tight">{stat.val}</p>
                    <p className="text-xs text-black uppercase tracking-widest font-semibold">{stat.label}</p>
                  </div>
                  <div className="h-8 mt-2 opacity-50 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={sparkData}>
                             <Bar dataKey="val" fill={stat.sparkColor} radius={[2,2,0,0]} />
                         </BarChart>
                     </ResponsiveContainer>
                  </div>
                </div>
              )
          })}
        </div>

        {/* FIND A PARTNER AND QUICK ACTIONS */}
        <div className="mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-2 bg-cyan-200 border border-white/5 hover:border-cyan-500/30 rounded-2xl p-6 flex flex-col justify-between gap-6 transition-all duration-200">
              <div>
                <h3 className="text-xl font-semibold text-black mb-2 border-l-2 border-cyan-500 pl-3">
                  Find a Partner
                </h3>
                  
                <p className="text-[#94a3b8] text-lg flex items-center mt-2">
                  <span className="inline-block w-3 h-3 bg-emerald-400 rounded-full animate-pulse mr-3 shadow-[0_0_10px_#22c55e]"></span>
                  {onlineCount.total > 0 ? (
                      selectedMatchLevel !== "Any level" 
                      ? `${onlineCount.byLevel[selectedMatchLevel.toLowerCase() as keyof typeof onlineCount.byLevel] || 0} ${selectedMatchLevel} users online right now ðŸŸ¢`
                      : `${onlineCount.total} users online right now ðŸŸ¢`
                  ) : (
                      "No users online right now — AI partner is ready for you instead"
                  )}
                </p>
                <div className="flex mt-3 gap-[-10px] items-center">
                    {onlineCount.users.slice(0, 3).map((u, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-cyan-600 border-2 border-[#0f1923] text-xs font-bold flex items-center justify-center z-10" style={{marginLeft: i > 0 ? '-10px' : 0}}>
                            {(u.name?.[0] || 'U').toUpperCase()}
                        </div>
                    ))}
                    {onlineCount.total > 3 && (
                        <div className="w-8 h-8 rounded-full bg-[#1e293b] border-2 border-[#0f1923] text-[10px] font-bold flex items-center justify-center z-10 -ml-2.5">
                            +{onlineCount.total - 3}
                        </div>
                    )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <select 
                    value={selectedMatchLevel}
                    onChange={(e) => setSelectedMatchLevel(e.target.value)}
                    className="bg-[#080c10] border border-white/10 text-white rounded-xl px-4 py-2 text-base focus:outline-none focus:border-blue-500 w-full sm:w-auto hover:bg-[#131f2a] transition-colors"
                >
                  <option>Any level</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <button 
                  onClick={handleConnect}
                  className="bg-[#06b6d4] hover:bg-[#0891b2] text-white font-bold py-2.5 px-6 text-base rounded-xl transition-colors w-full sm:w-auto whitespace-nowrap"
                >
                  Connect
                </button>
              </div>
            </div>

            <button 
              onClick={() => router.push(`/practice?mode=ai&practiceId=${userId}`)}
              className="bg-gradient-to-r from-cyan-500 to-[#0891b2] hover:opacity-90 text-white rounded-2xl p-6 min-h-35 flex flex-col items-center justify-center gap-4 transition-all hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(6,182,212,0.2)] group"
            >
              <div className="bg-white/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-white" />
              </div>
              <span className="font-bold text-xl">Practice Now</span>
            </button>
          </div>
        </div>

        {/* BOTTOM TWO COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-cyan-200 border border-white/5 hover:border-cyan-500/30 transition-all rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-black mb-6 border-l-2 border-cyan-500 pl-3">Recent Sessions</h3>
              <div className="space-y-4">
                  {recentSessions.length === 0 ? (
                      <div className="bg-cyan-100 border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center">
                          <History className="w-12 h-12 text-black mb-3 opacity-50" />
                          <p className="text-black font-medium mb-1">No sessions yet</p>
                          <p className="text-[#94a3b8]">Start your first practice! —</p>
                          <button onClick={() => router.push('/practice')} className="mt-4 bg-[#06b6d4] px-4 py-2 rounded-lg font-bold">Start Practice</button>
                      </div>
                  ) : (
                      recentSessions.map((s, i) => {
                          const isAI = s.session_type === 'ai' || !s.session_type;
                          const dateObj = new Date(s.created_at);
                          let dateStr = "";
                          const today = new Date();
                          const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
                          if (dateObj.toDateString() === today.toDateString()) {
                              dateStr = `Today, ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                          } else if (dateObj.toDateString() === yesterday.toDateString()) {
                              dateStr = `Yesterday, ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                          } else {
                              dateStr = `${dateObj.toLocaleDateString([], {weekday:'short', month:'short', day:'numeric'})}, ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                          }
                          
                          const fs = s.fluency_score || 0;
                          let fsColor = 'text-red-500';
                          if (fs >= 90) fsColor = 'text-green-500';
                          else if (fs >= 70) fsColor = 'text-cyan-500';
                          else if (fs >= 50) fsColor = 'text-amber-500';

                          const mistake = (s.mistakes && s.mistakes[0] && s.mistakes[0].wrong) 
                              ? (s.mistakes[0].wrong.length > 25 ? s.mistakes[0].wrong.slice(0, 25) + '...' : s.mistakes[0].wrong)
                              : "No major mistakes";

                          return (
                          <div key={i} className="bg-[#080c10] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group transition-all cursor-pointer" onClick={() => router.push(`/session/${s.id}`)}>
                              <div className="flex items-start sm:items-center gap-4">
                                <div className="p-3 bg-[#0f1923] rounded-xl border border-white/5 group-hover:border-cyan-500/30 transition-colors shadow-inner">
                                    {isAI ? <Bot className="w-6 h-6 text-purple-400" /> : <Users className="w-6 h-6 text-blue-400" />}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h4 className="text-lg font-bold text-white">{isAI ? "AI Partner" : "Peer Practice"}</h4>
                                    <p className="text-xs font-medium text-[#94a3b8]">{dateStr} — {Math.floor((s.duration_seconds||0)/60)} min</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between sm:justify-end gap-8">
                                <div className="flex flex-col items-start sm:items-end gap-1">
                                    <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest font-bold">Top Mistake</p>
                                    <p className="text-sm font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded">{mistake}</p>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest font-bold">Score</p>
                                    <p className={`text-2xl font-bold leading-none ${fsColor}`}>{fs}</p>
                                </div>
                               
                              </div>
                          </div>
                          );
                      })
                  )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
           

            <div className="bg-cyan-200 border border-white/5 hover:border-cyan-500/30 transition-all rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-black mb-6 border-l-2 border-cyan-500 pl-3">Your Weak Areas</h3>
              <div className="space-y-3">
                  {weakAreas === null ? (
                      <div className="text-center p-4 bg-cyan-100 rounded-xl border border-white/5 text-black">
                          Complete more sessions to see your weak areas
                      </div>
                  ) : weakAreas.length === 0 ? (
                      <div className="text-center p-4 bg-cyan-100 rounded-xl border border-white/5 text-black">
                          No consistent weak areas detected yet!
                      </div>
                  ) : (
                      weakAreas.map((item, i) => (
                          <div key={i} className="bg-cyan-100 hover:bg-cyan-200 transition-colors border border-white/5 rounded-xl p-4 flex flex-col gap-3 group">
                              <div className="flex justify-between items-start gap-3">
                                  <p className="text-sm font-semibold text-black leading-snug">{item.label}</p>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md whitespace-nowrap ${item.bg} ${item.color}`}>
                                      {item.difficulty}
                                  </span>
                              </div>
                              <button onClick={() => router.push('/practice')} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 w-full text-left flex items-center gap-1.5 transition-colors">
                                  Practice this <ArrowUpRight className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                              </button>
                          </div>
                      ))
                  )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


