"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Users,
  MessageSquare,
  LogOut,
  ChevronDown,
  Clock,
  Mail,
  Building2,
  Eye,
  X,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
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

const statusColors: Record<string, string> = {
  new: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  contacted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  qualified: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  closed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const statusLabels: Record<string, string> = {
  new: "Új",
  contacted: "Kapcsolatba léptünk",
  qualified: "Kvalifikált",
  closed: "Lezárt",
};

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
    fetchLeads();
  };

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  const updateStatus = async (leadId: string, newStatus: string) => {
    await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
  };

  const viewChatLogs = async (lead: Lead) => {
    setSelectedLead(lead);
    setChatLoading(true);

    const { data, error } = await supabase
      .from("chat_logs")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setChatLogs(data);
    }
    setChatLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Header bar */}
      <div className="glass border-b border-white/5 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-primary-light" />
            <h1 className="text-lg font-bold">Leads Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
              {leads.length} lead
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
          >
            <LogOut size={16} />
            Kijelentkezés
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Összes Lead",
              value: leads.length,
              color: "from-purple-500 to-blue-500",
            },
            {
              label: "Új",
              value: leads.filter((l) => l.status === "new").length,
              color: "from-emerald-500 to-teal-500",
            },
            {
              label: "Kvalifikált",
              value: leads.filter((l) => l.status === "qualified").length,
              color: "from-cyan-500 to-blue-500",
            },
            {
              label: "Lezárt",
              value: leads.filter((l) => l.status === "closed").length,
              color: "from-gray-500 to-gray-600",
            },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-5">
              <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-bold">
                <span
                  className={`bg-linear-to-r ${stat.color} bg-clip-text text-transparent`}
                >
                  {stat.value}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* Leads table */}
        {loading ? (
          <div className="text-center py-20 text-foreground/40">
            Betöltés...
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <Users size={48} className="mx-auto text-foreground/20 mb-4" />
            <p className="text-foreground/50">Még nincsenek leadek</p>
            <p className="text-sm text-foreground/30 mt-1">
              A chatboton keresztül érkező érdeklődők itt jelennek meg
            </p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-6 py-4">
                      Név
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-6 py-4">
                      Email
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-6 py-4 hidden md:table-cell">
                      Cég
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-6 py-4">
                      Státusz
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-6 py-4 hidden md:table-cell">
                      Dátum
                    </th>
                    <th className="text-right text-xs font-semibold text-foreground/40 uppercase tracking-wider px-6 py-4">
                      Műveletek
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-sm">{lead.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-foreground/60">
                          <Mail size={12} />
                          {lead.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-foreground/60">
                          <Building2 size={12} />
                          {lead.company || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative inline-block">
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              updateStatus(lead.id, e.target.value)
                            }
                            className={`appearance-none text-xs font-medium px-3 py-1.5 pr-7 rounded-full border cursor-pointer bg-transparent ${
                              statusColors[lead.status]
                            }`}
                          >
                            {Object.entries(statusLabels).map(
                              ([value, label]) => (
                                <option
                                  key={value}
                                  value={value}
                                  className="bg-surface text-foreground"
                                >
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                          <ChevronDown
                            size={12}
                            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-foreground/40">
                          <Clock size={12} />
                          {formatDate(lead.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => viewChatLogs(lead)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-light hover:text-cyan-400 transition-colors"
                        >
                          <Eye size={14} />
                          Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Chat log modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div
            className="glass rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            style={{
              background: "rgba(15, 10, 42, 0.95)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
            }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare size={16} className="text-primary-light" />
                  Chat log: {selectedLead.name}
                </h3>
                <p className="text-xs text-foreground/40 mt-0.5">
                  {selectedLead.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatLoading ? (
                <p className="text-center text-foreground/40">Betöltés...</p>
              ) : chatLogs.length === 0 ? (
                <p className="text-center text-foreground/40">
                  Nincs elérhető chat log ehhez a leadhez.
                </p>
              ) : (
                chatLogs.map((log) => (
                  <div key={log.id} className="space-y-3">
                    {Array.isArray(log.messages) &&
                      log.messages.map(
                        (msg: { role: string; content: string }, i: number) => (
                          <div
                            key={i}
                            className={`flex ${
                              msg.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm ${
                                msg.role === "user"
                                  ? "bg-purple-600/20 text-foreground/80 rounded-br-md"
                                  : "bg-white/5 text-foreground/60 rounded-bl-md"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        )
                      )}
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
