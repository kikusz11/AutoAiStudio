"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  ClipboardList,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Globe,
  BarChart2,
} from "lucide-react";

interface Stats {
  leadsTotal: number;
  leadsNew: number;
  leadsQualified: number;
  surveysTotal: number;
  surveysCompleted: number;
  surveysPartial: number;
  surveysAvgTime: number;
  visitorsTotal: number;
  visitorsToday: number;
}

export default function AdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentSurveys, setRecentSurveys] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/admin/login");
      else fetchAll();
    });
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      { count: leadsTotal },
      { data: leadsData },
      { count: surveysTotal },
      { data: surveysData },
      { count: visitorsTotal },
      { count: visitorsToday },
    ] = await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("survey_responses").select("*", { count: "exact", head: true }),
      supabase.from("survey_responses").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("page_views").select("*", { count: "exact", head: true }),
      supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    ]);

    // Fetch breakdown
    const { data: allLeads } = await supabase.from("leads").select("status");
    const { data: allSurveys } = await supabase.from("survey_responses").select("completion_status, completion_time_seconds");

    const leadsNew = allLeads?.filter((l) => l.status === "new").length ?? 0;
    const leadsQualified = allLeads?.filter((l) => l.status === "qualified").length ?? 0;
    const surveysCompleted = allSurveys?.filter((s) => s.completion_status === "completed").length ?? 0;
    const surveysPartial = allSurveys?.filter((s) => s.completion_status === "partial").length ?? 0;
    const timeSums = allSurveys?.filter((s) => s.completion_time_seconds).map((s) => s.completion_time_seconds!) ?? [];
    const surveysAvgTime = timeSums.length > 0 ? Math.round(timeSums.reduce((a, b) => a + b, 0) / timeSums.length) : 0;

    setStats({
      leadsTotal: leadsTotal ?? 0,
      leadsNew,
      leadsQualified,
      surveysTotal: surveysTotal ?? 0,
      surveysCompleted,
      surveysPartial,
      surveysAvgTime,
      visitorsTotal: visitorsTotal ?? 0,
      visitorsToday: visitorsToday ?? 0,
    });
    setRecentLeads(leadsData ?? []);
    setRecentSurveys(surveysData ?? []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("hu-HU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Top bar */}
      <div className="glass border-b border-white/5 sticky top-16 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} className="text-purple-400" />
            <h1 className="text-base font-bold">Áttekintés</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-foreground/40 hover:text-foreground transition-colors"
          >
            <LogOut size={14} /> Kijelentkezés
          </button>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8 max-w-6xl">
        {/* ── Stat cards ─────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {/* Leads group */}
            <OverviewCard
              href="/admin/leads"
              icon={<Users size={18} />}
              iconColor="text-purple-400"
              label="Összes Lead"
              value={stats!.leadsTotal}
              sub={`${stats!.leadsNew} új · ${stats!.leadsQualified} kvalifikált`}
              gradientFrom="from-purple-500"
              gradientTo="to-blue-500"
            />
            <OverviewCard
              href="/admin/leads"
              icon={<TrendingUp size={18} />}
              iconColor="text-emerald-400"
              label="Új Leadek"
              value={stats!.leadsNew}
              sub="Még nem kontaktált"
              gradientFrom="from-emerald-500"
              gradientTo="to-teal-500"
            />

            {/* Survey group */}
            <OverviewCard
              href="/admin/surveys"
              icon={<ClipboardList size={18} />}
              iconColor="text-cyan-400"
              label="Összes Kitöltés"
              value={stats!.surveysTotal}
              sub={`${stats!.surveysCompleted} befejezett`}
              gradientFrom="from-cyan-500"
              gradientTo="to-blue-500"
            />
            <OverviewCard
              href="/admin/surveys"
              icon={<Clock size={18} />}
              iconColor="text-pink-400"
              label="Átl. kitöltési idő"
              value={stats!.surveysAvgTime > 0 ? formatTime(stats!.surveysAvgTime) : "—"}
              sub={`${stats!.surveysPartial} félbehagyott`}
              gradientFrom="from-pink-500"
              gradientTo="to-purple-500"
            />

            {/* Visitor group */}
            <OverviewCard
              href="/admin/visitors"
              icon={<Globe size={18} />}
              iconColor="text-blue-400"
              label="Látogatók összesen"
              value={stats!.visitorsTotal}
              sub="Minden idők"
              gradientFrom="from-blue-500"
              gradientTo="to-indigo-500"
            />
            <OverviewCard
              href="/admin/visitors"
              icon={<Activity size={18} />}
              iconColor="text-green-400"
              label="Ma"
              value={stats!.visitorsToday}
              sub="Látogatás ma"
              gradientFrom="from-green-500"
              gradientTo="to-emerald-500"
            />

            {/* Completion rate */}
            <OverviewCard
              href="/admin/surveys"
              icon={<CheckCircle2 size={18} />}
              iconColor="text-emerald-400"
              label="Befejezési arány"
              value={stats!.surveysTotal > 0
                ? `${Math.round((stats!.surveysCompleted / stats!.surveysTotal) * 100)}%`
                : "—"}
              sub="Kérdőív befejező arány"
              gradientFrom="from-emerald-500"
              gradientTo="to-cyan-500"
            />
            <OverviewCard
              href="/admin/leads"
              icon={<TrendingUp size={18} />}
              iconColor="text-yellow-400"
              label="Konverzió"
              value={stats!.visitorsTotal > 0
                ? `${((stats!.leadsTotal / stats!.visitorsTotal) * 100).toFixed(1)}%`
                : "—"}
              sub="Lead / látogató arány"
              gradientFrom="from-yellow-500"
              gradientTo="to-orange-500"
            />
          </motion.div>
        )}

        {/* ── Recent activity ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent leads */}
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-purple-400" />
                <h2 className="text-sm font-bold">Legutóbbi leadek</h2>
              </div>
              <Link href="/admin/leads" className="flex items-center gap-1 text-xs text-foreground/30 hover:text-purple-400 transition-colors">
                Mind <ArrowRight size={11} />
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {loading ? (
                <div className="p-6 text-center text-foreground/20 text-sm">Betöltés...</div>
              ) : recentLeads.length === 0 ? (
                <div className="p-6 text-center text-foreground/20 text-sm">Nincs lead még</div>
              ) : (
                recentLeads.map((lead) => (
                  <Link key={lead.id} href="/admin/leads" className="px-5 py-3 flex items-center justify-between hover:bg-white/3 transition-colors group">
                    <div>
                      <p className="text-sm font-medium text-foreground/80 group-hover:text-white transition-colors">{lead.name}</p>
                      <p className="text-xs text-foreground/30">{lead.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        lead.status === "new" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : lead.status === "qualified" ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : "bg-white/5 text-foreground/30 border-white/10"
                      }`}>{lead.status}</span>
                      <p className="text-[10px] text-foreground/20 mt-0.5">{formatDate(lead.created_at)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent surveys */}
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={15} className="text-cyan-400" />
                <h2 className="text-sm font-bold">Legutóbbi kitöltések</h2>
              </div>
              <Link href="/admin/surveys" className="flex items-center gap-1 text-xs text-foreground/30 hover:text-cyan-400 transition-colors">
                Mind <ArrowRight size={11} />
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {loading ? (
                <div className="p-6 text-center text-foreground/20 text-sm">Betöltés...</div>
              ) : recentSurveys.length === 0 ? (
                <div className="p-6 text-center text-foreground/20 text-sm">Nincs kitöltés még</div>
              ) : (
                recentSurveys.map((s) => (
                  <Link key={s.id} href="/admin/surveys" className="px-5 py-3 flex items-center justify-between hover:bg-white/3 transition-colors group">
                    <div>
                      <p className="text-xs font-mono text-foreground/40 group-hover:text-foreground/60 transition-colors">{s.session_id.slice(0, 14)}…</p>
                      <p className="text-[10px] text-foreground/20 uppercase font-bold mt-0.5">{s.language} · {s.answers?.business_type ?? "—"}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        s.completion_status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      }`}>{s.completion_status === "completed" ? "Kész" : "Részleges"}</span>
                      <p className="text-[10px] text-foreground/20 mt-0.5">{formatDate(s.created_at)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── OverviewCard ─────────────────────────────────────────────────────────────

function OverviewCard({
  href, icon, iconColor, label, value, sub, gradientFrom, gradientTo,
}: {
  href: string;
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string | number;
  sub: string;
  gradientFrom: string;
  gradientTo: string;
}) {
  return (
    <Link
      href={href}
      className="glass rounded-2xl border border-white/5 p-5 flex flex-col gap-3 hover:border-white/15 hover:bg-white/[0.04] transition-all group"
    >
      <div className="flex items-center justify-between">
        <span className={`${iconColor} opacity-70 group-hover:opacity-100 transition-opacity`}>{icon}</span>
        <ArrowRight size={12} className="text-foreground/10 group-hover:text-foreground/40 group-hover:translate-x-0.5 transition-all" />
      </div>
      <div>
        <p className="text-xs text-foreground/30 uppercase font-bold tracking-wider mb-1">{label}</p>
        <p className={`text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r ${gradientFrom} ${gradientTo}`}>
          {value}
        </p>
      </div>
      <p className="text-[11px] text-foreground/25">{sub}</p>
    </Link>
  );
}
