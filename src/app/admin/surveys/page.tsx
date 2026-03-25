"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { type DBQuestion } from "@/lib/surveyDB";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Filter,
  X,
  Download,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  ExternalLink,
  Eye,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type SortDir = "asc" | "desc";
type SortKey = "_date" | "_time" | string;

interface Filters {
  search: string;
  status: "" | "completed" | "partial";
  language: "" | "en" | "hu";
  businessType: string[];
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: Filters = {
  search: "", status: "", language: "",
  businessType: [], dateFrom: "", dateTo: "",
};

// Key columns always shown (in order)
const KEY_QUESTIONS = ["business_type", "role", "industry", "would_pay", "email_optional"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleString("hu-HU", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatSeconds(s: number | null) {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function truncate(val: string, len = 45) {
  return val.length > len ? val.slice(0, len) + "…" : val;
}

function answerToString(val: any, lang: "hu" | "en", q?: DBQuestion): string {
  if (!val && val !== 0) return "—";
  if (q?.type === "yes_no") return val === "yes" ? "Igen" : "Nem";
  if (Array.isArray(val)) {
    return val.map((v) => {
      const opt = q?.options?.find((o) => o.value === v);
      return opt ? (lang === "hu" ? opt.label_hu : opt.label_en) : v;
    }).join(", ");
  }
  if (q?.options) {
    const opt = q.options.find((o) => o.value === val);
    if (opt) return lang === "hu" ? opt.label_hu : opt.label_en;
  }
  return String(val);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SurveysPage() {
  const supabase = createClient();
  const router = useRouter();

  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SurveyResponse | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(KEY_QUESTIONS));
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/admin/login");
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: rData }, { data: qData }] = await Promise.all([
      supabase.from("survey_responses").select("*").order("created_at", { ascending: false }),
      supabase.from("survey_builder_questions").select("*").order("sort_order"),
    ]);
    if (rData) setResponses(rData as SurveyResponse[]);
    if (qData) {
      setQuestions(qData as DBQuestion[]);
      // Init visible cols: key questions that actually have a column
      const keySet = new Set(KEY_QUESTIONS.filter((k) => qData.some((q: DBQuestion) => q.question_id === k)));
      setVisibleCols(keySet);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Filtering ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = responses;

    if (filters.status) rows = rows.filter((r) => r.completion_status === filters.status);
    if (filters.language) rows = rows.filter((r) => r.language === filters.language);
    if (filters.businessType.length) {
      rows = rows.filter((r) => {
        const bt = r.answers?.business_type;
        return bt && filters.businessType.includes(bt);
      });
    }
    if (filters.dateFrom) rows = rows.filter((r) => r.created_at >= filters.dateFrom);
    if (filters.dateTo)   rows = rows.filter((r) => r.created_at <= filters.dateTo + "T23:59:59");
    if (filters.search.trim()) {
      const s = filters.search.toLowerCase();
      rows = rows.filter((r) =>
        JSON.stringify(r.answers).toLowerCase().includes(s) ||
        JSON.stringify(r.other_texts).toLowerCase().includes(s) ||
        r.session_id.toLowerCase().includes(s)
      );
    }
    return rows;
  }, [responses, filters]);

  // ─── Sorting ────────────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: any, bv: any;
      if (sortKey === "_date") { av = a.created_at; bv = b.created_at; }
      else if (sortKey === "_time") { av = a.completion_time_seconds ?? 0; bv = b.completion_time_seconds ?? 0; }
      else { av = String(a.answers?.[sortKey] ?? ""); bv = String(b.answers?.[sortKey] ?? ""); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // ─── Pagination ─────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  // ─── Active filters count ────────────────────────────────────
  const activeFilterChips: { label: string; clear: () => void }[] = [];
  if (filters.status) activeFilterChips.push({ label: filters.status === "completed" ? "Befejezett" : "Részleges", clear: () => setFilters((f) => ({ ...f, status: "" })) });
  if (filters.language) activeFilterChips.push({ label: filters.language.toUpperCase(), clear: () => setFilters((f) => ({ ...f, language: "" })) });
  filters.businessType.forEach((bt) => activeFilterChips.push({
    label: { self: "Egyéni vállalkozó", small: "Kisvállalkozás", medium: "Középvállalat", large: "Nagyvállalat" }[bt] ?? bt,
    clear: () => setFilters((f) => ({ ...f, businessType: f.businessType.filter((x) => x !== bt) })),
  }));
  if (filters.dateFrom) activeFilterChips.push({ label: `Től: ${filters.dateFrom}`, clear: () => setFilters((f) => ({ ...f, dateFrom: "" })) });
  if (filters.dateTo)   activeFilterChips.push({ label: `Ig: ${filters.dateTo}`,   clear: () => setFilters((f) => ({ ...f, dateTo: "" })) });

  // ─── Columns definition ──────────────────────────────────────
  const qMap = useMemo(() => {
    const m: Record<string, DBQuestion> = {};
    questions.forEach((q) => { m[q.question_id] = q; });
    return m;
  }, [questions]);

  const dynCols = questions
    .filter((q) => q.type !== "intro" && q.type !== "statement" && visibleCols.has(q.question_id))
    .sort((a, b) => a.sort_order - b.sort_order);

  // ─── CSV Export ──────────────────────────────────────────────
  const exportCSV = () => {
    const header = ["Dátum", "Nyelv", "Státusz", "Idő (mp)", ...dynCols.map((q) => q.label_hu)];
    const rows = sorted.map((r) => [
      r.created_at,
      r.language,
      r.completion_status,
      r.completion_time_seconds ?? "",
      ...dynCols.map((q) => answerToString(r.answers?.[q.question_id], "hu", q)),
    ]);
    const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "survey_responses.csv"; a.click();
  };

  // Helper: SortIndicator
  const SortIco = ({ k }: { k: SortKey }) => sortKey !== k ? null : (
    sortDir === "asc" ? <ChevronUp size={11} className="inline ml-0.5" /> : <ChevronDown size={11} className="inline ml-0.5" />
  );

  return (
    <div className="min-h-screen pt-20 flex flex-col">
      {/* ── Top Bar ── */}
      <div className="glass border-b border-white/5 sticky top-16 z-40">
        <div className="max-w-full px-6 py-3 flex items-center gap-3 flex-wrap">
          <div>
            <h1 className="text-base font-bold">Kérdőív kitöltések</h1>
            <p className="text-[11px] text-foreground/30">{filtered.length} / {responses.length} válasz</p>
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
              placeholder="Keresés..."
              className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 w-44 transition-all focus:w-56"
            />
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              showFilters || activeFilterChips.length > 0
                ? "bg-purple-600/20 border-purple-500/30 text-purple-300"
                : "bg-white/5 border-white/10 text-foreground/60 hover:text-foreground"
            }`}
          >
            <Filter size={12} />
            Szűrők
            {activeFilterChips.length > 0 && (
              <span className="bg-purple-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterChips.length}
              </span>
            )}
          </button>

          {/* Column visibility */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 bg-white/5 text-foreground/60 hover:text-foreground transition-all">
              <Eye size={12} /> Oszlopok
            </button>
            <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-white/10 rounded-xl p-2 z-50 min-w-52 shadow-2xl hidden group-hover:block">
              {questions.filter((q) => q.type !== "intro" && q.type !== "statement").map((q) => (
                <label key={q.question_id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleCols.has(q.question_id)}
                    onChange={(e) => {
                      const next = new Set(visibleCols);
                      e.target.checked ? next.add(q.question_id) : next.delete(q.question_id);
                      setVisibleCols(next);
                    }}
                    className="accent-purple-500"
                  />
                  <span className="text-xs text-foreground/70 truncate max-w-40">{q.label_hu}</span>
                </label>
              ))}
            </div>
          </div>

          <button onClick={load} title="Frissítés" className="p-1.5 rounded-xl text-foreground/30 hover:text-foreground hover:bg-white/5 transition-all">
            <RefreshCw size={14} />
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-foreground/60 hover:text-foreground transition-all"
          >
            <Download size={12} /> CSV
          </button>
        </div>

        {/* ── Filter Panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="px-6 py-4 flex flex-wrap gap-6 items-end">
                {/* Status */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-foreground/30 mb-1.5">Státusz</p>
                  <div className="flex gap-1.5">
                    {[["", "Mind"], ["completed", "Befejezett"], ["partial", "Részleges"]].map(([val, label]) => (
                      <button key={val} onClick={() => { setFilters((f) => ({ ...f, status: val as any })); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filters.status === val ? "bg-white/15 border-white/30 text-white" : "border-white/5 text-foreground/40 hover:bg-white/5"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-foreground/30 mb-1.5">Nyelv</p>
                  <div className="flex gap-1.5">
                    {[["", "Mind"], ["hu", "Magyar"], ["en", "English"]].map(([val, label]) => (
                      <button key={val} onClick={() => { setFilters((f) => ({ ...f, language: val as any })); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filters.language === val ? "bg-white/15 border-white/30 text-white" : "border-white/5 text-foreground/40 hover:bg-white/5"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Business type */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-foreground/30 mb-1.5">Vállalkozás típusa</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      ["self", "Egyéni"],
                      ["small", "Kis"],
                      ["medium", "Közép"],
                      ["large", "Nagy"],
                    ].map(([val, label]) => {
                      const checked = filters.businessType.includes(val);
                      return (
                        <button key={val}
                          onClick={() => {
                            setFilters((f) => ({
                              ...f,
                              businessType: checked ? f.businessType.filter((x) => x !== val) : [...f.businessType, val],
                            }));
                            setPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${checked ? "bg-white/15 border-white/30 text-white" : "border-white/5 text-foreground/40 hover:bg-white/5"}`}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-foreground/30 mb-1.5">Dátum</p>
                  <div className="flex items-center gap-2">
                    <input type="date" value={filters.dateFrom}
                      onChange={(e) => { setFilters((f) => ({ ...f, dateFrom: e.target.value })); setPage(1); }}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20" />
                    <span className="text-foreground/30 text-xs">–</span>
                    <input type="date" value={filters.dateTo}
                      onChange={(e) => { setFilters((f) => ({ ...f, dateTo: e.target.value })); setPage(1); }}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/20" />
                  </div>
                </div>

                {activeFilterChips.length > 0 && (
                  <button onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all">
                    <X size={11} /> Szűrők törlése
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Active filter chips ── */}
        {activeFilterChips.length > 0 && (
          <div className="px-6 pb-3 flex flex-wrap gap-1.5">
            {activeFilterChips.map((c, i) => (
              <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 font-medium">
                {c.label}
                <button onClick={c.clear} className="hover:text-white"><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto" ref={tableRef}>
        {loading ? (
          <div className="flex items-center justify-center py-32 text-foreground/30">
            <RefreshCw size={20} className="animate-spin mr-2" /> Betöltés...
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-foreground/20">
            <ClipboardList size={48} className="mb-4" />
            <p>Nincs találat a szűrőkre</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            {/* Sticky header */}
            <thead className="sticky top-0 z-30">
              <tr className="bg-zinc-950/95 backdrop-blur border-b border-white/5">
                {/* Fixed meta columns */}
                <Th onClick={() => toggleSort("_date")} className="w-32 pl-6">
                  Dátum <SortIco k="_date" />
                </Th>
                <Th className="w-12">Lang</Th>
                <Th className="w-24">Státusz</Th>
                <Th onClick={() => toggleSort("_time")} className="w-16">
                  Idő <SortIco k="_time" />
                </Th>

                {/* Dynamic question columns */}
                {dynCols.map((q) => (
                  <Th key={q.question_id} onClick={() => toggleSort(q.question_id)} className="max-w-[180px]">
                    <span className="truncate block max-w-[170px]" title={q.label_hu}>{q.label_hu}</span>
                    <SortIco k={q.question_id} />
                  </Th>
                ))}

                <Th className="w-12 pr-6 text-right"></Th>
              </tr>
            </thead>

            <tbody>
              {paged.map((r, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`border-b border-white/[0.04] cursor-pointer transition-colors group ${
                      isEven ? "bg-transparent" : "bg-white/[0.015]"
                    } hover:bg-white/[0.05]`}
                  >
                    {/* Date */}
                    <td className="pl-6 py-3 text-xs font-mono text-foreground/40 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>

                    {/* Language */}
                    <td className="py-3 px-2">
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] uppercase font-bold text-foreground/40 border border-white/5">
                        {r.language}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.completion_status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      }`}>
                        {r.completion_status === "completed"
                          ? <><CheckCircle2 size={9} /> Kész</>
                          : <><AlertCircle size={9} /> Részleges</>
                        }
                      </span>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-2">
                      <span className="text-xs text-foreground/30 flex items-center gap-0.5">
                        <Clock size={10} /> {formatSeconds(r.completion_time_seconds)}
                      </span>
                    </td>

                    {/* Dynamic answer columns */}
                    {dynCols.map((q) => {
                      const raw = r.answers?.[q.question_id];
                      const str = answerToString(raw, r.language as "hu" | "en", q);
                      const other = r.other_texts?.[q.question_id];
                      const isLong = q.type === "long_text" || q.type === "short_text";
                      return (
                        <td key={q.question_id} className="py-3 px-3 max-w-[180px]" title={str !== "—" ? str : undefined}>
                          {str === "—" ? (
                            <span className="text-foreground/15">—</span>
                          ) : (
                            <span className={`text-xs ${isLong ? "text-foreground/50 italic" : "text-foreground/80"}`}>
                              {isLong ? truncate(str, 40) : truncate(str, 55)}
                            </span>
                          )}
                          {other && (
                            <span className="block text-[10px] text-purple-400/50 italic truncate">+ {truncate(other, 30)}</span>
                          )}
                        </td>
                      );
                    })}

                    {/* View icon */}
                    <td className="pr-6 py-3 text-right">
                      <ExternalLink size={13} className="text-foreground/10 group-hover:text-foreground/40 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {sorted.length > PAGE_SIZE && (
        <div className="glass border-t border-white/5 px-6 py-3 flex items-center justify-between sticky bottom-0 z-30">
          <p className="text-xs text-foreground/30">
            {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} / {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 disabled:pointer-events-none transition-all">
              ← Előző
            </button>
            <span className="text-xs text-foreground/30">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs border border-white/20 bg-white/10 hover:bg-white/15 text-white disabled:opacity-20 disabled:pointer-events-none transition-all">
              Következő →
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10"
              style={{ background: "rgba(5,5,5,0.98)" }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <ClipboardList size={18} className="text-purple-400" /> Válasz részletek
                  </h3>
                  <p className="text-[11px] text-foreground/30 mt-0.5 font-mono">{selected.session_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    selected.completion_status === "completed"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  }`}>{selected.completion_status}</span>
                  <span className="text-xs text-foreground/30 font-mono">{selected.language.toUpperCase()}</span>
                  <span className="text-xs text-foreground/30">{formatSeconds(selected.completion_time_seconds)}</span>
                  <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {/* Meta */}
                <div className="grid grid-cols-3 gap-3">
                  <MetaCard label="Dátum" value={new Date(selected.created_at).toLocaleString("hu-HU")} />
                  <MetaCard label="Eltelt idő" value={formatSeconds(selected.completion_time_seconds)} />
                  <MetaCard label="Nyelv" value={selected.language.toUpperCase()} />
                </div>

                {/* Answers */}
                <div className="space-y-4">
                  {Object.entries(selected.answers).map(([qId, val]) => {
                    const q = qMap[qId];
                    const label = q ? (selected.language === "hu" ? q.label_hu : q.label_en) : qId.replace(/_/g, " ");
                    const str = answerToString(val, selected.language as "hu" | "en", q);
                    const other = selected.other_texts?.[qId];
                    const isLong = q?.type === "long_text";
                    return (
                      <div key={qId} className="border-b border-white/5 pb-4 last:border-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-400/50 mb-1.5">{label}</p>
                        {isLong ? (
                          <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">{str}</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(val) ? val.map((v: string) => {
                              const opt = q?.options?.find((o) => o.value === v);
                              const display = opt ? (selected.language === "hu" ? opt.label_hu : opt.label_en) : v;
                              return <Chip key={v}>{display}</Chip>;
                            }) : <Chip>{str}</Chip>}
                          </div>
                        )}
                        {other && (
                          <div className="mt-2 bg-purple-500/5 border border-purple-500/15 rounded-lg px-3 py-2">
                            <p className="text-[10px] font-bold uppercase text-purple-400/50 mb-0.5">Egyéb:</p>
                            <p className="text-sm text-foreground/60 italic">{other}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Th({ children, onClick, className = "" }: { children?: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <th
      onClick={onClick}
      className={`text-left text-[10px] font-bold uppercase tracking-wider text-foreground/30 px-3 py-3 whitespace-nowrap select-none ${onClick ? "cursor-pointer hover:text-foreground/60" : ""} ${className}`}
    >
      {children}
    </th>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/3 border border-white/5 rounded-xl p-3">
      <p className="text-[10px] uppercase font-bold text-foreground/25 mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground/80">{value}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-foreground/80">
      {children}
    </span>
  );
}
