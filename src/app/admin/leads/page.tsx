"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Users, Mail, Building2, Clock, Eye, MessageSquare, ChevronDown, X,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

interface ChatLog {
  id: string;
  lead_id: string;
  session_id: string;
  messages: Array<{ role: string; content: string }>;
  summary: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new:       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  contacted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  qualified: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  closed:    "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  new:       "Új",
  contacted: "Kapcsolatba léptünk",
  qualified: "Kvalifikált",
  closed:    "Lezárt",
};

const PAGE_SIZE = 20;

export default function LeadsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/admin/login");
    });
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (!error && data) {
      setLeads(data);
      if (count !== null) setTotal(count);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, [page]);

  const updateStatus = async (leadId: string, status: string) => {
    await supabase.from("leads").update({ status }).eq("id", leadId);
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status } : l));
  };

  const viewChat = async (lead: Lead) => {
    setSelectedLead(lead);
    setChatLoading(true);
    const { data } = await supabase.from("chat_logs").select("*").eq("lead_id", lead.id).order("created_at", { ascending: false });
    setChatLogs(data ?? []);
    setChatLoading(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("hu-HU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <div className="glass border-b border-white/5 sticky top-16 z-40">
        <div className="px-6 py-4 flex items-center gap-3">
          <Users size={18} className="text-purple-400" />
          <h1 className="text-base font-bold">Leadek</h1>
          <span className="text-xs text-foreground/30 ml-1">{total} találat</span>
        </div>
      </div>

      <div className="px-6 py-8 max-w-6xl">
        {loading ? (
          <div className="text-center py-20 text-foreground/30">Betöltés...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-foreground/20">
            <Users size={48} className="mx-auto mb-4" />
            <p>Még nincsenek leadek</p>
          </div>
        ) : (
          <>
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      {["Név", "Email", "Cég", "Státusz", "Dátum", ""].map((h, i) => (
                        <th key={i} className={`text-left text-[10px] font-bold uppercase tracking-wider text-foreground/30 px-5 py-3 ${i >= 4 ? "hidden md:table-cell" : ""} ${i === 5 ? "text-right" : ""}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, idx) => (
                      <tr
                        key={lead.id}
                        className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.04] ${idx % 2 !== 0 ? "bg-white/[0.015]" : ""}`}
                      >
                        <td className="px-5 py-3 font-medium">{lead.name}</td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-1.5 text-foreground/50 text-xs">
                            <Mail size={11} /> {lead.email}
                          </span>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="flex items-center gap-1.5 text-foreground/40 text-xs">
                            <Building2 size={11} /> {lead.company || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="relative inline-flex items-center">
                            <select
                              value={lead.status}
                              onChange={(e) => updateStatus(lead.id, e.target.value)}
                              className={`appearance-none text-[10px] font-bold uppercase px-2.5 py-1 pr-6 rounded-full border cursor-pointer bg-transparent ${STATUS_COLORS[lead.status]}`}
                            >
                              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                                <option key={v} value={v} className="bg-zinc-900 font-normal text-sm normal-case">{l}</option>
                              ))}
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="flex items-center gap-1 text-xs text-foreground/30">
                            <Clock size={10} /> {formatDate(lead.created_at)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => viewChat(lead)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/30 hover:text-cyan-400 transition-colors"
                          >
                            <Eye size={13} /> Chat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {total > PAGE_SIZE && (
              <div className="mt-4 flex items-center justify-between glass px-5 py-3 rounded-xl border border-white/5">
                <p className="text-xs text-foreground/30">{((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 text-white disabled:opacity-20 transition-all hover:bg-white/10">← Előző</button>
                  <span className="text-xs text-foreground/30 self-center">{page} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-xs border border-white/20 bg-white/10 text-white disabled:opacity-20 transition-all hover:bg-white/15">Következő →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-white/10" style={{ background: "rgba(8,5,20,0.98)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <h3 className="font-semibold flex items-center gap-2 text-cyan-400">
                  <MessageSquare size={16} /> Chat log: {selectedLead.name}
                </h3>
                <p className="text-xs text-foreground/40 mt-0.5">{selectedLead.email}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-white/10 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatLoading ? (
                <p className="text-center text-foreground/30">Betöltés...</p>
              ) : chatLogs.length === 0 ? (
                selectedLead.message ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-4 py-2.5 rounded-xl text-sm bg-cyan-600/20 text-foreground/80 whitespace-pre-wrap">{selectedLead.message}</div>
                  </div>
                ) : (
                  <p className="text-center text-foreground/30">Nincs chat log.</p>
                )
              ) : (
                chatLogs.map((log) => (
                  <div key={log.id} className="space-y-3">
                    {log.messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm ${msg.role === "user" ? "bg-cyan-600/20 text-foreground/80 rounded-br-md" : "bg-white/5 text-foreground/60 rounded-bl-md"}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
