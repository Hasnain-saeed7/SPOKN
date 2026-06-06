import { createClient } from "./supabaseClient";

export async function getTodayStats(userId: string) {
  const supabase = createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("sessions")
    .select("duration_seconds, words_spoken, accuracy_score")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString());

  if (error) {
    console.error("Error fetching today's stats:", error);
    return { sessions: 0, minutes: 0, words: 0, accuracy: 0, raw: [] };
  }

  const sessions = data.length;
  const minutes = Math.floor(data.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 60);
  const words = data.reduce((sum, s) => sum + (s.words_spoken || 0), 0);
  const avgAccuracy = sessions > 0
    ? Math.round(data.reduce((sum, s) => sum + (s.accuracy_score || 0), 0) / sessions)
    : 0;

  return { sessions, minutes, words, accuracy: avgAccuracy, raw: data };
}

export async function getLast7DaysScores(userId: string) {
  const supabase = createClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("sessions")
    .select("created_at, fluency_score")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching last 7 days scores:", error);
    return [];
  }

  return data.map((d) => ({
    date: new Date(d.created_at).toLocaleDateString("en-US", { weekday: "short" }),
    fluency_score: d.fluency_score,
  }));
}

export async function getWeeklySessionCount(userId: string) {
  const supabase = createClient();
  const today = new Date();
  // Get Monday of current week
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", monday.toISOString());

  if (error) {
    console.error("Error fetching weekly sessions:", error);
    return 0;
  }

  return data.length;
}

export async function getLast30DaysDates(userId: string) {
  const supabase = createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("sessions")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (error) {
    console.error("Error fetching last 30 days sessions:", error);
    return [];
  }

  return data.map((d) => {
      const date = new Date(d.created_at)
      date.setHours(0,0,0,0)
      return date.getTime()
  });
}

export async function getRecentSessions(userId: string, limit = 3) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent sessions:", error);
    return [];
  }
  return data;
}

export async function getWeakAreas(userId: string) {
  const supabase = createClient();
  // Aggregate mistakes from last 10 sessions
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("mistakes")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !sessions) {
    console.error("Error fetching weak areas:", error);
    return [];
  }

  if (sessions.length < 3) {
      return null; // Signals need more sessions
  }

  const mistakeCounts: Record<string, number> = {};
  
  sessions.forEach(session => {
      if (Array.isArray(session.mistakes)) {
          session.mistakes.forEach((m: any) => {
              const category = m.category || "Grammar Context"; // fallback
              mistakeCounts[category] = (mistakeCounts[category] || 0) + 1;
          });
      }
  });

  return Object.entries(mistakeCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(item => {
        const count = item.count;
        let difficulty = "Low Priority";
        let color = "text-slate-400";
        let bg = "bg-slate-500/10";
        
        if (count >= 3) {
            difficulty = "High Priority";
            color = "text-red-400";
            bg = "bg-red-500/10";
        } else if (count === 2) {
            difficulty = "Medium Priority";
            color = "text-yellow-400";
            bg = "bg-yellow-500/10";
        }

        return { ...item, difficulty, color, bg };
    });
}