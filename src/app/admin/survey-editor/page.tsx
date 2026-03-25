"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  type DBQuestion,
  type DBOption,
  type DBCondition,
  type DBQuestionType,
  QUESTION_TYPE_LABELS,
  SECTION_OPTIONS,
} from "@/lib/surveyDB";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Pencil,
  History,
  Copy,
  ArrowUp,
  ArrowDown,
  Code2,
  ClipboardCopy,
  Upload,
  RefreshCw,
  Network,
  BookDashed
} from "lucide-react";
import { SurveyFlowchart } from "@/components/admin/SurveyFlowchart";

// ─── Types ────────────────────────────────────────────────────────────────────

type Toast = { type: "success" | "error"; msg: string };
type EditDraft = Omit<DBQuestion, "id" | "version_history" | "created_at" | "updated_at">;

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TYPES: { value: DBQuestionType; label: string }[] = [
  { value: "intro",         label: "Intro képernyő" },
  { value: "yes_no",        label: "Igen / Nem" },
  { value: "single_choice", label: "Egyes választás" },
  { value: "multi_select",  label: "Többes választás" },
  { value: "dropdown",      label: "Legördülő lista" },
  { value: "short_text",    label: "Rövid szöveg" },
  { value: "long_text",     label: "Hosszú szöveg" },
  { value: "statement",     label: "Állítás" },
];

const HAS_OPTIONS: DBQuestionType[] = ["single_choice", "multi_select", "dropdown"];

function emptyDraft(): EditDraft {
  return {
    question_id: "",
    type: "single_choice",
    section: "general",
    label_en: "",
    label_hu: "",
    description_en: null,
    description_hu: null,
    placeholder_en: null,
    placeholder_hu: null,
    tooltip_en: null,
    tooltip_hu: null,
    options: [],
    has_other: false,
    other_label_en: null,
    other_label_hu: null,
    required: false,
    is_active: true,
    sort_order: 999,
    condition_json: null,
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SurveyEditorPage() {
  const supabase = createClient();
  const router = useRouter();

  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "flow">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);

  // JSON panel
  const [showJsonPanel, setShowJsonPanel] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonMode, setJsonMode] = useState<"upsert" | "replace">("upsert");
  const [jsonLoading, setJsonLoading] = useState(false);

  // drag & drop state
  const dragSrc = useRef<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/admin/login");
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("survey_builder_questions")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setQuestions(data as DBQuestion[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── SAVE (create or update) ───────────────────────────────
  const handleSave = async (draft: EditDraft, existingId?: string) => {
    if (!draft.question_id.trim()) return showToast("error", "A question_id mező kötelező");
    if (!draft.label_hu.trim() && !draft.label_en.trim()) return showToast("error", "Legalább egy cím kötelező");

    if (existingId) {
      const { error } = await supabase
        .from("survey_builder_questions")
        .update(draft)
        .eq("id", existingId);
      if (error) return showToast("error", "Mentés sikertelen: " + error.message);
    } else {
      // Auto sort_order
      const maxOrder = questions.reduce((m, q) => Math.max(m, q.sort_order), 0);
      const { error } = await supabase
        .from("survey_builder_questions")
        .insert({ ...draft, sort_order: maxOrder + 1 });
      if (error) return showToast("error", "Létrehozás sikertelen: " + error.message);
    }

    showToast("success", existingId ? "Sikeresen mentve!" : "Kérdés létrehozva!");
    setEditingId(null);
    setIsCreating(false);
    await load();
  };

  // ─── DELETE ───────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("survey_builder_questions").delete().eq("id", id);
    if (error) return showToast("error", "Törlés sikertelen");
    setDeleteConfirmId(null);
    showToast("success", "Kérdés törölve");
    await load();
  };

  const handleDeleteAll = async () => {
    // Delete all records mathematically by matching anything >= min integer, or just 'neq' null
    const { error } = await supabase.from("survey_builder_questions").delete().gte("sort_order", -99999);
    if (error) return showToast("error", "Törlés sikertelen!");
    setDeleteAllConfirm(false);
    showToast("success", "Minden kérdés törölve!");
    await load();
  };

  // ─── TOGGLE ACTIVE ────────────────────────────────────────
  const toggleActive = async (q: DBQuestion) => {
    await supabase.from("survey_builder_questions").update({ is_active: !q.is_active }).eq("id", q.id);
    await load();
  };

  // ─── REORDER (move up/down) ───────────────────────────────
  const moveQuestion = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const a = questions[index];
    const b = questions[target];
    await Promise.all([
      supabase.from("survey_builder_questions").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("survey_builder_questions").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    await load();
  };

  // ─── DRAG & DROP ──────────────────────────────────────────
  const handleDragStart = (index: number) => { dragSrc.current = index; };
  const handleDrop = async (targetIndex: number) => {
    const src = dragSrc.current;
    if (src === null || src === targetIndex) return;
    // Recompute sort_orders
    const reordered = [...questions];
    const [moved] = reordered.splice(src, 1);
    reordered.splice(targetIndex, 0, moved);
    const updates = reordered.map((q, i) =>
      supabase.from("survey_builder_questions").update({ sort_order: i }).eq("id", q.id)
    );
    await Promise.all(updates);
    dragSrc.current = null;
    await load();
  };

  // ─── DUPLICATE ────────────────────────────────────────────
  const duplicate = async (q: DBQuestion) => {
    const maxOrder = questions.reduce((m, x) => Math.max(m, x.sort_order), 0);
    const { error } = await supabase.from("survey_builder_questions").insert({
      ...q,
      id: undefined,
      question_id: q.question_id + "_copy",
      sort_order: maxOrder + 1,
      version_history: [],
      created_at: undefined,
      updated_at: undefined,
    });
    if (error) return showToast("error", "Másolás sikertelen");
    showToast("success", "Kérdés másolva");
    await load();
  };

  // ─── JSON Export ───────────────────────────────────────────
  const openJsonPanel = () => {
    let exportable: any[];
    if (questions.length === 0) {
      exportable = [{
        question_id: "example_question_1",
        type: "single_choice",
        section: "intro",
        sort_order: 1,
        is_active: true,
        required: true,
        label_hu: "Minta kérdés (HU)",
        label_en: "Sample question (EN)",
        description_hu: "Opcionális leírás",
        description_en: "Optional description",
        placeholder_hu: null,
        placeholder_en: null,
        tooltip_hu: null,
        tooltip_en: null,
        has_other: false,
        other_label_hu: null,
        other_label_en: null,
        options: [
          { value: "option_1", label_hu: "Válasz 1", label_en: "Option 1" },
          { value: "option_2", label_hu: "Válasz 2", label_en: "Option 2" }
        ],
        condition_json: null
      }];
    } else {
      exportable = questions.map((q) => ({
        question_id: q.question_id,
        type: q.type,
        section: q.section,
        sort_order: q.sort_order,
        is_active: q.is_active,
        required: q.required,
        label_hu: q.label_hu,
        label_en: q.label_en,
        description_hu: q.description_hu,
        description_en: q.description_en,
        placeholder_hu: q.placeholder_hu,
        placeholder_en: q.placeholder_en,
        tooltip_hu: q.tooltip_hu,
        tooltip_en: q.tooltip_en,
        has_other: q.has_other,
        other_label_hu: q.other_label_hu,
        other_label_en: q.other_label_en,
        options: q.options,
        condition_json: q.condition_json,
      }));
    }
    setJsonText(JSON.stringify(exportable, null, 2));
    setShowJsonPanel(true);
  };

  // ─── JSON Import (upsert) ──────────────────────────────────
  const applyJson = async () => {
    let parsed: any[];
    try {
      parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error("Tömb szükséges");
    } catch (e: any) {
      return showToast("error", "JSON hiba: " + e.message);
    }
    setJsonLoading(true);
    try {
      if (jsonMode === "replace") {
        // Delete all, then insert
        await supabase.from("survey_builder_questions").delete().gte("sort_order", -9999);
        const { error } = await supabase.from("survey_builder_questions").insert(parsed);
        if (error) throw error;
      } else {
        // Upsert by question_id
        for (const q of parsed) {
          const { data: existing } = await supabase
            .from("survey_builder_questions")
            .select("id")
            .eq("question_id", q.question_id)
            .single();
          if (existing) {
            const { error } = await supabase
              .from("survey_builder_questions")
              .update(q)
              .eq("question_id", q.question_id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("survey_builder_questions")
              .insert(q);
            if (error) throw error;
          }
        }
      }
      showToast("success", `${parsed.length} kérdés alkalmazva!`);
      setShowJsonPanel(false);
      await load();
    } catch (e: any) {
      showToast("error", "Import hiba: " + (e.message || JSON.stringify(e)));
    }
    setJsonLoading(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Header */}
      <div className="glass border-b border-white/5 sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <div>
            <h1 className="text-lg font-bold">Kérdőív szerkesztő</h1>
            <p className="text-xs text-foreground/30">Húzd át a kérdéseket az újrarendezéshez</p>
          </div>
          <button
            onClick={() => { setIsCreating(true); setEditingId(null); setViewMode("list"); }}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all"
          >
            <Plus size={16} /> Új kérdés
          </button>
          
          {deleteAllConfirm ? (
            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-xl">
              <span className="text-xs font-bold text-red-400 px-2">Biztosan?</span>
              <button
                onClick={handleDeleteAll}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all"
              >
                Igen, törlés
              </button>
              <button
                onClick={() => setDeleteAllConfirm(false)}
                className="px-2 py-1.5 rounded-lg text-foreground/40 hover:text-foreground text-xs font-bold transition-all"
              >
                Mégse
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteAllConfirm(true)}
              disabled={questions.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground/60 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-30 disabled:pointer-events-none"
              title="Összes kérdés törlése"
            >
              <Trash2 size={14} /> Ürítés
            </button>
          )}

          <button
            onClick={() => setViewMode(viewMode === "list" ? "flow" : "list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              viewMode === "flow" 
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-500" 
                : "bg-white/5 border border-white/10 text-foreground/60 hover:text-foreground"
            }`}
          >
            <Network size={14} /> {viewMode === "flow" ? "Lista Doksiból" : "Vizuális Fa"}
          </button>
          <button
            onClick={openJsonPanel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground/60 hover:text-foreground transition-all"
            title="JSON szerkesztő — AI import/export"
          >
            <Code2 size={14} /> JSON
          </button>
          <a
            href="/survey"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground/60 hover:text-foreground transition-all"
          >
            <Eye size={14} /> Előnézet
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* New Question Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <QuestionEditForm
                draft={emptyDraft()}
                questions={questions}
                onSave={(d) => handleSave(d)}
                onCancel={() => setIsCreating(false)}
                isNew
              />
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="text-center py-20 text-foreground/30">Betöltés...</div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 mb-6 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.02)]">
              <BookDashed className="text-zinc-600 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white tracking-tight">Kezdjünk el építeni!</h2>
            <p className="text-sm text-zinc-500 max-w-sm leading-relaxed mb-8">
              Jelenleg teljesen üres a rendszer. Hozz létre egy új kérdést az alapokhoz, vagy használd a <strong className="text-zinc-300">JSON Szerkesztőt</strong> egy komplett mesterséges intelligencia által generált struktúra beimportálására.
            </p>
            <button
              onClick={() => { setIsCreating(true); setEditingId(null); setViewMode("list"); }}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
            >
              Első Kérdés Létrehozása
            </button>
          </div>
        ) : viewMode === "flow" ? (
          <div className="h-[75vh] w-full">
            <SurveyFlowchart questions={questions} />
          </div>
        ) : (
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div
                key={q.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                className="group"
              >
                {editingId === q.id ? (
                  <QuestionEditForm
                    draft={{
                      question_id: q.question_id,
                      type: q.type,
                      section: q.section,
                      label_en: q.label_en,
                      label_hu: q.label_hu,
                      description_en: q.description_en,
                      description_hu: q.description_hu,
                      placeholder_en: q.placeholder_en,
                      placeholder_hu: q.placeholder_hu,
                      tooltip_en: q.tooltip_en,
                      tooltip_hu: q.tooltip_hu,
                      options: q.options,
                      has_other: q.has_other,
                      other_label_en: q.other_label_en,
                      other_label_hu: q.other_label_hu,
                      required: q.required,
                      is_active: q.is_active,
                      sort_order: q.sort_order,
                      condition_json: q.condition_json,
                    }}
                    questions={questions}
                    currentId={q.id}
                    onSave={(d) => handleSave(d, q.id)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <QuestionRow
                    question={q}
                    index={i}
                    total={questions.length}
                    isHistoryOpen={historyId === q.id}
                    isDeleteConfirm={deleteConfirmId === q.id}
                    onEdit={() => { setEditingId(q.id); setIsCreating(false); }}
                    onToggleHistory={() => setHistoryId(historyId === q.id ? null : q.id)}
                    onToggleActive={() => toggleActive(q)}
                    onDelete={() => setDeleteConfirmId(q.id)}
                    onDeleteConfirm={() => handleDelete(q.id)}
                    onDeleteCancel={() => setDeleteConfirmId(null)}
                    onDuplicate={() => duplicate(q)}
                    onMoveUp={() => moveQuestion(i, -1)}
                    onMoveDown={() => moveQuestion(i, 1)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl border ${
              toast.type === "success"
                ? "bg-emerald-950 border-emerald-500/30 text-emerald-300"
                : "bg-red-950 border-red-500/30 text-red-300"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── JSON Panel Modal ── */}
      <AnimatePresence>
        {showJsonPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowJsonPanel(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10"
              style={{ background: "rgba(5,3,18,0.99)" }}
            >
              {/* Modal header */}
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Code2 size={16} className="text-purple-400" />
                    JSON Import / Export
                  </h3>
                  <p className="text-xs text-foreground/30 mt-0.5">
                    Másold AI-ba, kérd meg módosítsa, majd illeszd vissza és kattints az Alkalmaz gombra
                  </p>
                </div>
                <button
                  onClick={() => setShowJsonPanel(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* AI prompt hint */}
              <div className="mx-6 mt-5 mb-3 bg-purple-500/5 border border-purple-500/15 rounded-xl p-4 flex-shrink-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-purple-400/60 mb-2">💡 AI Prompt sablon a Fa Logikához</p>
                <p className="text-[11px] text-foreground/50 leading-relaxed font-mono select-all w-full line-clamp-4 hover:line-clamp-none transition-all">
                  {"Te egy profi Kérdőív AI vagy. A feladatod: [ÍRD IDE MIT SZERETNÉL]. SZABÁLYOK: 1. Elágazásokhoz használd a 'condition_json'-t (Pl: {\"questionId\": \"SZÜLŐ_ID\", \"includes\": [\"válasz\"]}). 2. A generált kód legyen hibátlan, hogy a rendszer rögtön értelmezze. 3. Ezután a JSON-t küldöm. Válaszként CSAK a nyers, frissített JSON tömböt küldd vissza, letisztultan felsorolva mindent. Semmi magyarázat vagy extra szöveg!"}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(
                    "Te egy profi Kérdőív Építő AI vagy. Az alábbi JSON egy dinamikus kérdőív struktúrája. A feladatod: [ÍRD IDE A CÉLT, pl. készíts más elágazást menedzsereknek].\n\nSZABÁLYOK:\n1. Használd a 'condition_json' mezőt a logikai elágazásokhoz. Szintaxis: {\"questionId\": \"SZÜLŐ_ID\", \"includes\": [\"válasz_1\"]}.\n2. Ügyelj rá, hogy minden mező pontosan valid legyen a zavartalan működéshez.\n3. Minden 'question_id' legyen egyedi.\n4. Ez az üzenet után CSAK KÓDOT fogok küldeni neked. Te KIZÁRÓLAG a módosított nyers JSON tömböt (array) küldheted vissza, letisztultan felsorolva a módosított kérdéseket. Semmi magyarázat, semmi markdown blokk, semmi társalgási szöveg! Csak a nyers JSON kód.\n\n" + jsonText
                  )}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] font-medium text-purple-300 hover:bg-purple-500/20 transition-all"
                >
                  <ClipboardCopy size={12} /> Gyökér-építő Prompt + JSON másolása
                </button>
              </div>

              {/* Textarea */}
              <div className="flex-1 overflow-hidden px-6 pb-2 min-h-0">
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  spellCheck={false}
                  className="w-full h-full min-h-[300px] bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-green-300/80 placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-purple-500/30 resize-none leading-relaxed"
                  placeholder="A kérdőív JSON struktúrája ide jelenik meg..."
                />
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between flex-shrink-0">
                {/* Mode selector */}
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/25">Import mód</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setJsonMode("upsert")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        jsonMode === "upsert" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "border-white/5 text-foreground/30 hover:bg-white/5"
                      }`}
                    >
                      ✓ Upsert (biztonságos)
                    </button>
                    <button
                      onClick={() => setJsonMode("replace")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        jsonMode === "replace" ? "bg-red-500/15 border-red-500/30 text-red-300" : "border-white/5 text-foreground/30 hover:bg-white/5"
                      }`}
                    >
                      ⚠ Teljes csere
                    </button>
                  </div>
                  <p className="text-[10px] text-foreground/20">
                    {jsonMode === "upsert"
                      ? "Meglévő kérdések frissülnek, újak hozzáadódnak, törölt kérdések megmaradnak"
                      : "MINDEN jelenlegi kérdés törlődik és felváltja a JSON tartalma"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setJsonText(""); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-foreground/30 hover:bg-white/5 transition-all"
                  >
                    <RefreshCw size={12} /> Visszaállít
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(jsonText)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border border-white/10 bg-white/5 text-foreground/50 hover:text-foreground transition-all"
                  >
                    <ClipboardCopy size={12} /> Másolás
                  </button>
                  <button
                    onClick={applyJson}
                    disabled={jsonLoading || !jsonText.trim()}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${
                      jsonMode === "replace"
                        ? "bg-red-600 hover:bg-red-500 text-white"
                        : "bg-purple-600 hover:bg-purple-500 text-white"
                    }`}
                  >
                    {jsonLoading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                    {jsonMode === "replace" ? "Teljes csere!" : "Alkalmaz"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── QuestionRow (read mode) ──────────────────────────────────────────────────

function QuestionRow({
  question, index, total, isHistoryOpen, isDeleteConfirm,
  onEdit, onToggleHistory, onToggleActive, onDelete,
  onDeleteConfirm, onDeleteCancel, onDuplicate, onMoveUp, onMoveDown,
}: {
  question: DBQuestion;
  index: number;
  total: number;
  isHistoryOpen: boolean;
  isDeleteConfirm: boolean;
  onEdit: () => void;
  onToggleHistory: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const historyCount = question.version_history?.length ?? 0;
  return (
    <div className={`glass rounded-2xl border transition-all ${!question.is_active ? "opacity-40 border-white/3" : "border-white/5"}`}>
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Drag handle */}
        <div className="cursor-grab text-foreground/20 hover:text-foreground/40 transition-colors flex-shrink-0">
          <GripVertical size={16} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-foreground/40">
              {question.question_id}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400/60">
              {QUESTION_TYPE_LABELS[question.type]}
            </span>
            <span className="text-[10px] text-foreground/30 capitalize">{question.section}</span>
            {question.required && <span className="text-[10px] font-bold uppercase text-amber-500/60">kötelező</span>}
            {!question.is_active && <span className="text-[10px] font-bold uppercase text-red-400/60">inaktív</span>}
          </div>
          <p className="text-sm font-semibold text-foreground/90 truncate mt-0.5">{question.label_hu}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onMoveUp} disabled={index === 0} title="Fel" className="p-1.5 rounded-lg text-foreground/30 hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-10 disabled:pointer-events-none">
            <ArrowUp size={13} />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} title="Le" className="p-1.5 rounded-lg text-foreground/30 hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-10 disabled:pointer-events-none">
            <ArrowDown size={13} />
          </button>
          <button onClick={onToggleActive} title={question.is_active ? "Letiltás" : "Engedélyezés"} className="p-1.5 rounded-lg text-foreground/30 hover:text-foreground hover:bg-white/5 transition-all">
            {question.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
          {historyCount > 0 && (
            <button onClick={onToggleHistory} title="Előzmények" className="flex items-center gap-1 p-1.5 rounded-lg text-foreground/30 hover:text-foreground hover:bg-white/5 transition-all">
              <History size={13} />
              <span className="text-[10px]">{historyCount}</span>
            </button>
          )}
          <button onClick={onDuplicate} title="Másolás" className="p-1.5 rounded-lg text-foreground/30 hover:text-foreground hover:bg-white/5 transition-all">
            <Copy size={13} />
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20 transition-all"
          >
            <Pencil size={12} /> Szerkesztés
          </button>
          {isDeleteConfirm ? (
            <div className="flex items-center gap-1.5">
              <button onClick={onDeleteConfirm} className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition-all">
                Törlés!
              </button>
              <button onClick={onDeleteCancel} className="px-2.5 py-1.5 rounded-xl text-xs text-foreground/40 hover:bg-white/5 transition-all">
                Mégse
              </button>
            </div>
          ) : (
            <button onClick={onDelete} title="Törlés" className="p-1.5 rounded-lg text-foreground/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* History panel */}
      <AnimatePresence>
        {isHistoryOpen && question.version_history?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 border-t border-white/5 pt-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground/30 mb-3 flex items-center gap-1.5">
                <History size={10} /> Előző verziók
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {[...question.version_history].reverse().map((v: any, i: number) => (
                  <div key={i} className="bg-white/2 border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-foreground/30 font-mono mb-1">{new Date(v.saved_at).toLocaleString("hu-HU")}</p>
                    <p className="text-xs text-foreground/60"><span className="text-[10px] uppercase font-bold text-foreground/20 mr-1">HU:</span>{v.label_hu}</p>
                    <p className="text-xs text-foreground/40"><span className="text-[10px] uppercase font-bold text-foreground/20 mr-1">EN:</span>{v.label_en}</p>
                    {v.type && v.type !== question.type && (
                      <p className="text-[10px] text-orange-400/60 mt-1">Típus volt: {QUESTION_TYPE_LABELS[v.type as DBQuestionType]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── QuestionEditForm ─────────────────────────────────────────────────────────

function QuestionEditForm({
  draft: initialDraft,
  questions,
  currentId,
  onSave,
  onCancel,
  isNew,
}: {
  draft: EditDraft;
  questions: DBQuestion[];
  currentId?: string;
  onSave: (d: EditDraft) => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const [d, setD] = useState<EditDraft>(initialDraft);
  const [activeTab, setActiveTab] = useState<"basic" | "options" | "logic" | "advanced">("basic");

  const set = (key: keyof EditDraft, val: any) => setD((prev) => ({ ...prev, [key]: val }));

  // Options management
  const addOption = () => setD((prev) => ({
    ...prev,
    options: [...prev.options, { value: `option_${Date.now()}`, label_en: "", label_hu: "" }],
  }));

  const updateOption = (idx: number, field: keyof DBOption, val: string) =>
    setD((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => i === idx ? { ...o, [field]: val } : o),
    }));

  const removeOption = (idx: number) =>
    setD((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }));

  const moveOption = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= d.options.length) return;
    setD((prev) => {
      const opts = [...prev.options];
      [opts[idx], opts[target]] = [opts[target], opts[idx]];
      return { ...prev, options: opts };
    });
  };

  const showOptions = HAS_OPTIONS.includes(d.type);

  // Condition helpers
  const condition = d.condition_json;
  const isAndCondition = condition && "and" in condition;
  const simpleCondition = condition && !isAndCondition ? condition as { questionId: string; includes: string[] } : null;

  const otherQuestions = questions.filter((q) => q.id !== currentId);

  const getAnswerOptions = (qId: string) => {
    const q = questions.find((x) => x.question_id === qId);
    if (!q) return [];
    if (q.type === "yes_no") return [{ value: "yes", label: "Igen" }, { value: "no", label: "Nem" }];
    return q.options.map((o) => ({ value: o.value, label: o.label_hu || o.label_en }));
  };

  const TABS = [
    { key: "basic",    label: "Alapadatok" },
    { key: "options",  label: `Lehetőségek${showOptions ? ` (${d.options.length})` : ""}`, disabled: !showOptions },
    { key: "logic",    label: "Feltétel" },
    { key: "advanced", label: "Speciális" },
  ] as const;

  return (
    <div className="glass rounded-2xl border border-purple-500/30 bg-white/[0.02]">
      {/* Form Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-bold text-sm text-purple-300">
          {isNew ? "✦ Új kérdés létrehozása" : `Szerkesztés: ${d.question_id}`}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-foreground/40 hover:bg-white/5 transition-all">
            <X size={12} /> Mégse
          </button>
          <button
            onClick={() => onSave(d)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
          >
            <Save size={12} /> Mentés
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-white/5 px-5 pt-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            disabled={"disabled" in tab && tab.disabled}
            onClick={() => !("disabled" in tab && tab.disabled) && setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === tab.key
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-foreground/30 hover:text-foreground/60 disabled:opacity-20 disabled:pointer-events-none"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* ── TAB: BASIC ── */}
        {activeTab === "basic" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="question_id (slug)">
                <input
                  type="text" value={d.question_id}
                  onChange={(e) => set("question_id", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  placeholder="pl. company_size"
                  className={inputCls}
                />
              </FormField>
              <FormField label="Kérdés típusa">
                <select value={d.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Szekció">
                <select value={d.section} onChange={(e) => set("section", e.target.value)} className={inputCls}>
                  {SECTION_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value} className="bg-zinc-900">{s.label}</option>
                  ))}
                  <option value="general" className="bg-zinc-900">Általános</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Cím (Magyar) *">
                <input type="text" value={d.label_hu} onChange={(e) => set("label_hu", e.target.value)} placeholder="Magyar szöveg" className={inputCls} />
              </FormField>
              <FormField label="Cím (English)">
                <input type="text" value={d.label_en} onChange={(e) => set("label_en", e.target.value)} placeholder="English text" className={inputCls} />
              </FormField>
              <FormField label="Leírás (Magyar)">
                <textarea rows={2} value={d.description_hu ?? ""} onChange={(e) => set("description_hu", e.target.value || null)} placeholder="Opcionális leírás" className={`${inputCls} resize-none`} />
              </FormField>
              <FormField label="Leírás (English)">
                <textarea rows={2} value={d.description_en ?? ""} onChange={(e) => set("description_en", e.target.value || null)} placeholder="Optional description" className={`${inputCls} resize-none`} />
              </FormField>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <Toggle label="Kötelező" checked={d.required} onChange={(v) => set("required", v)} />
              <Toggle label="Aktív" checked={d.is_active} onChange={(v) => set("is_active", v)} />
            </div>
          </div>
        )}

        {/* ── TAB: OPTIONS ── */}
        {activeTab === "options" && showOptions && (
          <div className="space-y-4">
            <div className="space-y-2">
              {d.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/3 border border-white/5 rounded-xl p-3">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveOption(idx, -1)} disabled={idx === 0} className="p-0.5 text-foreground/20 hover:text-foreground disabled:opacity-10 disabled:pointer-events-none">
                      <ArrowUp size={11} />
                    </button>
                    <button onClick={() => moveOption(idx, 1)} disabled={idx === d.options.length - 1} className="p-0.5 text-foreground/20 hover:text-foreground disabled:opacity-10 disabled:pointer-events-none">
                      <ArrowDown size={11} />
                    </button>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input
                      type="text" value={opt.value}
                      onChange={(e) => updateOption(idx, "value", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                      placeholder="value (slug)"
                      className={`${inputCls} text-xs font-mono`}
                    />
                    <input
                      type="text" value={opt.label_hu}
                      onChange={(e) => updateOption(idx, "label_hu", e.target.value)}
                      placeholder="Magyar felirat"
                      className={`${inputCls} text-xs`}
                    />
                    <input
                      type="text" value={opt.label_en}
                      onChange={(e) => updateOption(idx, "label_en", e.target.value)}
                      placeholder="English label"
                      className={`${inputCls} text-xs`}
                    />
                  </div>
                  <button onClick={() => removeOption(idx)} className="p-1.5 text-foreground/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addOption}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-white/10 text-xs text-foreground/40 hover:text-foreground hover:border-white/30 transition-all w-full justify-center"
            >
              <Plus size={14} /> Új lehetőség
            </button>

            {/* Other option */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <Toggle label='"Egyéb, kérjük pontosítsd" opció engedélyezése' checked={d.has_other} onChange={(v) => set("has_other", v)} />
              {d.has_other && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Egyéb felirat (Magyar)">
                    <input type="text" value={d.other_label_hu ?? ""} onChange={(e) => set("other_label_hu", e.target.value || null)} placeholder="Egyéb..." className={inputCls} />
                  </FormField>
                  <FormField label="Other label (English)">
                    <input type="text" value={d.other_label_en ?? ""} onChange={(e) => set("other_label_en", e.target.value || null)} placeholder="Other..." className={inputCls} />
                  </FormField>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: LOGIC ── */}
        {activeTab === "logic" && (
          <div className="space-y-4">
            <p className="text-xs text-foreground/40">
              Ha üres, a kérdés mindig megjelenik. Ha feltételt adsz meg, csak akkor jelenik meg, ha a feltétel teljesül.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => set("condition_json", null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${!condition ? "bg-white/10 border-white/20 text-white" : "border-white/5 text-foreground/30 hover:bg-white/5"}`}
              >
                Nincs feltétel
              </button>
              <button
                onClick={() => set("condition_json", { questionId: "", includes: [] })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${condition && !isAndCondition ? "bg-white/10 border-white/20 text-white" : "border-white/5 text-foreground/30 hover:bg-white/5"}`}
              >
                Egyszerű feltétel
              </button>
              <button
                onClick={() => set("condition_json", { and: [{ questionId: "", includes: [] }] })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isAndCondition ? "bg-white/10 border-white/20 text-white" : "border-white/5 text-foreground/30 hover:bg-white/5"}`}
              >
                AND feltételek
              </button>
            </div>

            {/* Simple condition */}
            {condition && !isAndCondition && simpleCondition && (
              <ConditionEditor
                condition={simpleCondition}
                otherQuestions={otherQuestions}
                getAnswerOptions={getAnswerOptions}
                onChange={(c) => set("condition_json", c)}
              />
            )}

            {/* AND conditions */}
            {isAndCondition && "and" in condition && (
              <div className="space-y-3">
                {condition.and.map((c, idx) => (
                  <div key={idx} className="relative">
                    {idx > 0 && <div className="text-[10px] font-bold uppercase text-foreground/30 mb-2 ml-1">ÉS</div>}
                    <ConditionEditor
                      condition={c}
                      otherQuestions={otherQuestions}
                      getAnswerOptions={getAnswerOptions}
                      onChange={(newC) => {
                        const updated = [...condition.and];
                        updated[idx] = newC;
                        set("condition_json", { and: updated });
                      }}
                    />
                    {condition.and.length > 1 && (
                      <button
                        onClick={() => set("condition_json", { and: condition.and.filter((_, i) => i !== idx) })}
                        className="absolute top-2 right-2 p-1 text-foreground/20 hover:text-red-400 transition-all"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => set("condition_json", { and: [...condition.and, { questionId: "", includes: [] }] })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-white/10 text-xs text-foreground/40 hover:text-foreground hover:border-white/30 transition-all"
                >
                  <Plus size={12} /> ÉS feltétel hozzáadása
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: ADVANCED ── */}
        {activeTab === "advanced" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Placeholder (Magyar)">
                <input type="text" value={d.placeholder_hu ?? ""} onChange={(e) => set("placeholder_hu", e.target.value || null)} placeholder="pl. Kérjük, add meg..." className={inputCls} />
              </FormField>
              <FormField label="Placeholder (English)">
                <input type="text" value={d.placeholder_en ?? ""} onChange={(e) => set("placeholder_en", e.target.value || null)} placeholder="e.g. Please enter..." className={inputCls} />
              </FormField>
              <FormField label="Tooltip/súgó szöveg (Magyar)">
                <textarea rows={3} value={d.tooltip_hu ?? ""} onChange={(e) => set("tooltip_hu", e.target.value || null)} placeholder="Magyarázó szöveg..." className={`${inputCls} resize-none`} />
              </FormField>
              <FormField label="Tooltip/help text (English)">
                <textarea rows={3} value={d.tooltip_en ?? ""} onChange={(e) => set("tooltip_en", e.target.value || null)} placeholder="Explanatory text..." className={`${inputCls} resize-none`} />
              </FormField>
            </div>
            <FormField label="Sorrend (sort_order)">
              <input type="number" value={d.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} className={`${inputCls} w-32`} />
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ConditionEditor ──────────────────────────────────────────────────────────

function ConditionEditor({
  condition,
  otherQuestions,
  getAnswerOptions,
  onChange,
}: {
  condition: { questionId: string; includes: string[] };
  otherQuestions: DBQuestion[];
  getAnswerOptions: (qId: string) => { value: string; label: string }[];
  onChange: (c: { questionId: string; includes: string[] }) => void;
}) {
  const answerOptions = getAnswerOptions(condition.questionId);

  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-3">
      <FormField label="Ha ez a kérdés:">
        <select
          value={condition.questionId}
          onChange={(e) => onChange({ ...condition, questionId: e.target.value, includes: [] })}
          className={inputCls}
        >
          <option value="" className="bg-zinc-900">-- Válassz kérdést --</option>
          {otherQuestions.map((q) => (
            <option key={q.question_id} value={q.question_id} className="bg-zinc-900">
              [{q.question_id}] {q.label_hu}
            </option>
          ))}
        </select>
      </FormField>

      {condition.questionId && (
        <FormField label="Ilyen választ tartalmaz (bármely):">
          <div className="flex flex-wrap gap-2">
            {answerOptions.map((opt) => {
              const checked = condition.includes.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    const next = checked
                      ? condition.includes.filter((v) => v !== opt.value)
                      : [...condition.includes, opt.value];
                    onChange({ ...condition, includes: next });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    checked ? "bg-white/10 border-white/30 text-white" : "border-white/5 text-foreground/40 hover:bg-white/5"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
            {answerOptions.length === 0 && (
              <p className="text-xs text-foreground/30">Nincs elérhető lehetőség ehhez a kérdéshez</p>
            )}
          </div>
        </FormField>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground/40 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-all ${checked ? "bg-purple-600" : "bg-white/10"}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className="text-sm text-foreground/70">{label}</span>
    </label>
  );
}
