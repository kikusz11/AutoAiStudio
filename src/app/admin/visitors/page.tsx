"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Activity, Globe, Clock, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

interface VisitorSession {
  id: string;
  session_token: string;
  country: string | null;
  city: string | null;
  user_agent: string | null;
  current_path: string | null;
  started_at: string;
  last_active_at: string;
}

export default function VisitorsDashboard() {
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetch();
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
    fetchSessions();
    
    // Auto refresh every 10 seconds
    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("visitor_sessions")
      .select("*")
      .order("last_active_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  };

  // derived stats
  const activeUsers = sessions.filter(s => (currentTime.getTime() - new Date(s.last_active_at).getTime()) < 2 * 60 * 1000).length;
  
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todaysVisitors = sessions.filter(s => new Date(s.started_at) > todayStart).length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("hu-HU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const formatDuration = (start: string, end: string) => {
    const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
    if (diff < 60) return `${diff} mp`;
    const mins = Math.floor(diff / 60);
    return `${mins} p ${diff % 60} mp`;
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="glass border-b border-white/5 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-foreground/50 hover:text-foreground">
              <ArrowLeft size={20} />
            </Link>
            <Activity size={20} className="text-primary-light" />
            <h1 className="text-lg font-bold">Látogatók (Visitor Tracking)</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass rounded-xl p-5 border-l-4 border-l-emerald-500">
            <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Aktív Látogatók
            </p>
            <p className="text-3xl font-bold">{activeUsers}</p>
          </div>
          <div className="glass rounded-xl p-5">
            <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1 flex items-center gap-2">
              <Users size={14} />
              Mai Látogatók
            </p>
            <p className="text-3xl font-bold">{todaysVisitors}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-foreground/40">Betöltés...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <Globe size={48} className="mx-auto text-foreground/20 mb-4" />
            <p className="text-foreground/50">Még nincsenek rögzített látogatások</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="text-left text-xs font-semibold text-foreground/40 px-6 py-4">ID</th>
                    <th className="text-left text-xs font-semibold text-foreground/40 px-6 py-4">Hely</th>
                    <th className="text-left text-xs font-semibold text-foreground/40 px-6 py-4">Kezdés</th>
                    <th className="text-left text-xs font-semibold text-foreground/40 px-6 py-4">Utoljára Aktív</th>
                    <th className="text-left text-xs font-semibold text-foreground/40 px-6 py-4">Időtartam</th>
                    <th className="text-left text-xs font-semibold text-foreground/40 px-6 py-4">Oldal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sessions.map((session) => {
                    const isActive = (currentTime.getTime() - new Date(session.last_active_at).getTime()) < 2 * 60 * 1000;
                    return (
                      <tr key={session.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-foreground/60">
                          {session.session_token.split('-')[0] || session.session_token.substring(0,8)}
                          {isActive && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {session.country} {session.city && session.city !== 'Unknown' && `(${session.city})`}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground/60">
                          {formatDate(session.started_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground/60">
                          {formatDate(session.last_active_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground/60 flex items-center gap-1">
                          <Clock size={14} />
                          {formatDuration(session.started_at, session.last_active_at)}
                        </td>
                        <td className="px-6 py-4 text-xs text-cyan-400 max-w-[150px] truncate" title={session.current_path || ""}>
                          {session.current_path}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
