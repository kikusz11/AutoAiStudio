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
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { surveyQuestions } from "@/lib/surveyQuestions";

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

interface SurveyResponse {
  id: string;
  session_id: string;
  language: string;
  completion_status: string;
  completion_time_seconds: number | null;
  answers: Record<string, any>;
  other_texts: Record<string, string>;
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
  
  const [activeTab, setActiveTab] = useState<"leads" | "surveys">("leads");
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyResponse | null>(null);

  // Pagination state
  const PAGE_SIZE = 20;
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [surveysPage, setSurveysPage] = useState(1);
  const [surveysTotal, setSurveysTotal] = useState(0);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [leadsPage]);

  useEffect(() => {
    fetchSurveys();
  }, [surveysPage]);

  const checkAuthAndFetch = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    const from = (leadsPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error && data) {
      setLeads(data);
      if (count !== null) setLeadsTotal(count);
    }
    setLoading(false);
  };

  const fetchSurveys = async () => {
    setSurveysLoading(true);
    const from = (surveysPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("survey_responses")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error && data) {
      setSurveys(data);
      if (count !== null) setSurveysTotal(count);
    }
    setSurveysLoading(false);
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
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("leads")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "leads"
                  ? "bg-white/10 text-white"
                  : "text-foreground/40 hover:text-foreground/60"
              }`}
            >
              Leads
            </button>
            <button
              onClick={() => setActiveTab("surveys")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "surveys"
                  ? "bg-white/10 text-white"
                  : "text-foreground/40 hover:text-foreground/60"
              }`}
            >
              Surveys
            </button>
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
          {activeTab === "leads" ? (
            [
              {
                label: "Összes Lead",
                value: leadsTotal,
                color: "from-purple-500 to-blue-500",
              },
              {
                label: "Új",
                value: leads.filter((l) => l.status === "new").length, // Note: This only shows current page count for sub-stats
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
              <StatCard key={stat.label} stat={stat} />
            ))
          ) : (
            [
              {
                label: "Összes Kitöltés",
                value: surveysTotal,
                color: "from-blue-500 to-cyan-500",
              },
              {
                label: "Befejezett",
                value: surveys.filter((s) => s.completion_status === "completed").length,
                color: "from-emerald-500 to-teal-500",
              },
              {
                label: "Félbehagyott",
                value: surveys.filter((s) => s.completion_status === "partial").length,
                color: "from-orange-500 to-red-500",
              },
              {
                label: "Átlag Idő (mp)",
                value: surveys.length > 0 
                  ? Math.round(surveys.reduce((acc, s) => acc + (s.completion_time_seconds || 0), 0) / surveys.length) 
                  : 0,
                color: "from-purple-500 to-pink-500",
              },
            ].map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))
          )}
        </div>

        {activeTab === "leads" ? (
          /* Leads table */
          loading ? (
            <div className="text-center py-20 text-foreground/40">
              Betöltés...
            </div>
          ) : leads.length === 0 ? (
            <NoData message="Még nincsenek leadek" subMessage="A chatboton keresztül érkező érdeklődők itt jelennek meg" icon={<Users size={48} />} />
          ) : (
            <>
              <LeadsTable leads={leads} statusLabels={statusLabels} statusColors={statusColors} formatDate={formatDate} updateStatus={updateStatus} viewChatLogs={viewChatLogs} />
              <Pagination currentPage={leadsPage} totalItems={leadsTotal} pageSize={PAGE_SIZE} onPageChange={setLeadsPage} />
            </>
          )
        ) : (
          /* Surveys table */
          surveysLoading ? (
            <div className="text-center py-20 text-foreground/40">
              Betöltés...
            </div>
          ) : surveys.length === 0 ? (
            <NoData message="Még nincsenek kérdőív válaszok" subMessage="A kitöltött kérdőívek itt jelennek meg" icon={<ClipboardList size={48} />} />
          ) : (
            <>
              <SurveysTable surveys={surveys} formatDate={formatDate} onViewDetail={setSelectedSurvey} />
              <Pagination currentPage={surveysPage} totalItems={surveysTotal} pageSize={PAGE_SIZE} onPageChange={setSurveysPage} />
            </>
          )
        )}
      </div>

      {/* Chat log modal */}
      {selectedLead && (
        <ChatLogModal lead={selectedLead} chatLogs={chatLogs} chatLoading={chatLoading} onClose={() => setSelectedLead(null)} />
      )}

      {/* Survey detail modal */}
      {selectedSurvey && (
        <SurveyDetailModal
          survey={selectedSurvey}
          onClose={() => setSelectedSurvey(null)}
        />
      )}
    </div>
  );
}

function Pagination({ currentPage, totalItems, pageSize, onPageChange }: { currentPage: number, totalItems: number, pageSize: number, onPageChange: (page: number) => void }) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalItems === 0) return null;

  return (
    <div className="mt-6 flex items-center justify-between glass px-6 py-4 rounded-xl border border-white/5">
      <p className="text-xs text-foreground/40 font-medium uppercase tracking-wider">
        Összesen: <span className="text-foreground">{totalItems}</span> elem | Oldal: <span className="text-foreground">{currentPage} / {totalPages}</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 disabled:pointer-events-none border border-white/10"
        >
          Előző
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:pointer-events-none border border-white/20"
        >
          Következő
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────

function StatCard({ stat }: { stat: any }) {
  return (
    <div className="glass rounded-xl p-5">
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
  );
}

function NoData({
  message,
  subMessage,
  icon,
}: {
  message: string;
  subMessage: string;
  icon: any;
}) {
  return (
    <div className="text-center py-20 glass rounded-2xl">
      <div className="mx-auto text-foreground/20 mb-4 flex justify-center">
        {icon}
      </div>
      <p className="text-foreground/50">{message}</p>
      <p className="text-sm text-foreground/30 mt-1">{subMessage}</p>
    </div>
  );
}

function LeadsTable({
  leads,
  statusLabels,
  statusColors,
  formatDate,
  updateStatus,
  viewChatLogs,
}: any) {
  return (
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
            {leads.map((lead: any) => (
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
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className={`appearance-none text-xs font-medium px-3 py-1.5 pr-7 rounded-full border cursor-pointer bg-transparent ${
                        statusColors[lead.status]
                      }`}
                    >
                      {Object.entries(statusLabels).map(
                        ([value, label]: any) => (
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
                    <Eye size={14} /> Chat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SurveysTable({ surveys, formatDate, onViewDetail }: any) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-6 py-4">
                Hely/IP (Session)
              </th>
              <th className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-6 py-4">
                Nyelv
              </th>
              <th className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-6 py-4">
                Státusz
              </th>
              <th className="text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider px-6 py-4 hidden md:table-cell">
                Idő (mp)
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
            {surveys.map((survey: any) => (
              <tr
                key={survey.id}
                className="border-b border-white/5 hover:bg-white/2 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-xs font-mono text-foreground/60">
                    {survey.session_id.substring(0, 12)}...
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] uppercase font-bold text-foreground/40 border border-white/10">
                    {survey.language}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      survey.completion_status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    }`}
                  >
                    {survey.completion_status}
                  </span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="flex items-center gap-1.5 text-sm text-foreground/60">
                    {survey.completion_time_seconds || "—"}s
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="flex items-center gap-1.5 text-xs text-foreground/40">
                    {formatDate(survey.created_at)}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onViewDetail(survey)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-light hover:text-cyan-400 transition-colors"
                  >
                    <ClipboardList size={14} /> Megtekintés
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChatLogModal({ lead, chatLogs, chatLoading, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div
        className="glass rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        style={{
          background: "rgba(10, 5, 25, 0.98)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h3 className="font-semibold flex items-center gap-2 text-cyan-400">
              <MessageSquare size={16} /> Chat log: {lead.name}
            </h3>
            <p className="text-xs text-foreground/40 mt-0.5">{lead.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatLoading ? (
            <p className="text-center text-foreground/40">Betöltés...</p>
          ) : chatLogs.length === 0 ? (
            lead.message ? (
              <div className="flex justify-end">
                <div className="max-w-[80%] px-4 py-2.5 rounded-xl text-sm bg-cyan-600/20 text-foreground/80 rounded-br-md whitespace-pre-wrap">
                  {lead.message}
                </div>
              </div>
            ) : (
              <p className="text-center text-foreground/40">Nincs chat log.</p>
            )
          ) : (
            chatLogs.map((log: any) => (
              <div key={log.id} className="space-y-3">
                {log.messages.map((msg: any, i: number) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm ${
                        msg.role === "user"
                          ? "bg-cyan-600/20 text-foreground/80 rounded-br-md"
                          : "bg-white/5 text-foreground/60 rounded-bl-md"
                      }`}
                    >
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
  );
}

function SurveyDetailModal({
  survey,
  onClose,
}: {
  survey: SurveyResponse;
  onClose: () => void;
}) {
  const answers = Object.entries(survey.answers);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 md:p-6">
      <div
        className="glass rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{
          background: "rgba(5, 5, 5, 0.98)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <h3 className="font-bold text-xl flex items-center gap-2 text-white">
              <ClipboardList size={20} className="text-primary-light" />
              Kérdőív Válaszok
            </h3>
            <p className="text-xs text-foreground/40 mt-1 font-mono">
              Session ID: {survey.session_id} • {survey.language.toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/2 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] text-foreground/30 uppercase font-bold tracking-widest mb-1">
                Státusz
              </p>
              <p className="text-sm font-semibold capitalize">
                {survey.completion_status}
              </p>
            </div>
            <div className="bg-white/2 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] text-foreground/30 uppercase font-bold tracking-widest mb-1">
                Eltelt idő
              </p>
              <p className="text-sm font-semibold">
                {survey.completion_time_seconds || 0} másodperc
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {answers.map(([key, value]) => {
              const question = surveyQuestions.find((q) => q.id === key);
              const label = question?.label.hu || key.replace(/_/g, " ");
              const other = survey.other_texts[key];

              const translateValue = (val: string) => {
                // If it's a yes_no question
                if (question?.type === "yes_no") {
                  return val === "yes" ? "Igen" : "Nem";
                }
                // If it's a choice question with options
                if (question?.options) {
                  const option = question.options.find((o) => o.value === val);
                  return option?.label.hu || val;
                }
                return val;
              };

              return (
                <div
                  key={key}
                  className="space-y-2 border-b border-white/5 pb-4 last:border-0"
                >
                  <p className="text-[11px] font-black uppercase tracking-tighter text-cyan-500/60">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(value) ? (
                      value.map((v: string) => (
                        <span
                          key={v}
                          className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-foreground/80"
                        >
                          {translateValue(v)}
                        </span>
                      ))
                    ) : (
                      <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-zinc-100 font-medium">
                        {translateValue(String(value))}
                      </span>
                    )}
                  </div>
                  {other && (
                    <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl mt-2">
                      <p className="text-[10px] font-bold uppercase text-primary mb-1">
                        Egyéb pontosítás:
                      </p>
                      <p className="text-sm italic">{other}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

