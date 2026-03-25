"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { surveyUI } from "@/lib/surveyQuestions";
import { createClient } from "@/lib/supabase/client";
import {
  type DBQuestion,
  type DBOption,
  evaluateDBCondition,
} from "@/lib/surveyDB";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Info,
  Shield,
  Clock,
  Sparkles,
  BookDashed,
} from "lucide-react";

type Locale = "en" | "hu";
type Answers = Record<string, string | string[]>;

const AUTOSAVE_KEY = "mindforge_survey_draft";

function generateSessionId(): string {
  return "s_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export default function SurveyPage({ onNavigate }: { onNavigate?: (idx: number) => void }) {
  const { locale: appLocale } = useLanguage();
  const lang = (["en", "hu"].includes(appLocale) ? appLocale : "en") as Locale;
  const ui = surveyUI[lang];

  const [questions, setQuestions] = useState<DBQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  const [answers, setAnswers] = useState<Answers>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sessionId] = useState(() => generateSessionId());
  const [startTime] = useState(() => Date.now());
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Load questions from DB ───────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("survey_builder_questions")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setQuestions(data as DBQuestion[]);
        }
        setQuestionsLoading(false);
      });
  }, []);

  // ─── Visible questions (apply conditions) ─────────────────
  const visibleQuestions = useMemo(() => {
    return questions.filter((q) =>
      evaluateDBCondition(q.condition_json, answers)
    );
  }, [questions, answers]);

  const currentQuestion = visibleQuestions[currentStep];
  const totalSteps = visibleQuestions.length;
  const progressPercent = totalSteps > 1
    ? Math.round((currentStep / (totalSteps - 1)) * 100)
    : 0;

  // ─── AUTOSAVE ─────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.otherTexts) setOtherTexts(parsed.otherTexts);
        if (parsed.step) setCurrentStep(parsed.step);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (!isSubmitted) {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ answers, otherTexts, step: currentStep }));
    }
  }, [answers, otherTexts, currentStep, isSubmitted]);

  // ─── ANSWER HANDLERS ──────────────────────────────────────
  const setAnswer = useCallback((questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setValidationError(null);
  }, []);

  const setOtherText = useCallback((questionId: string, text: string) => {
    setOtherTexts((prev) => ({ ...prev, [questionId]: text }));
  }, []);

  const toggleMultiSelect = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [questionId]: next };
    });
    setValidationError(null);
  }, []);

  // ─── VALIDATION ───────────────────────────────────────────
  const validateCurrent = useCallback((): boolean => {
    if (!currentQuestion) return true;
    if (currentQuestion.type === "intro" || currentQuestion.type === "statement") return true;
    if (!currentQuestion.required) return true;

    const answer = answers[currentQuestion.question_id];

    if (currentQuestion.type === "multi_select") {
      if (!answer || (answer as string[]).length === 0) {
        setValidationError(ui.required);
        return false;
      }
    } else if (currentQuestion.type === "yes_no") {
      if (!answer) { setValidationError(ui.required); return false; }
    } else {
      if (!answer || (typeof answer === "string" && answer.trim() === "")) {
        setValidationError(ui.required);
        return false;
      }
    }

    if (currentQuestion.has_other) {
      const selected = Array.isArray(answer) ? answer : [answer as string];
      if (selected.includes("other") && (!otherTexts[currentQuestion.question_id] || otherTexts[currentQuestion.question_id].trim() === "")) {
        setValidationError(ui.required);
        return false;
      }
    }

    return true;
  }, [currentQuestion, answers, otherTexts, ui.required]);

  // ─── NAVIGATION ───────────────────────────────────────────
  const goNext = useCallback(() => {
    if (!validateCurrent()) return;
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
      setValidationError(null);
    }
  }, [validateCurrent, currentStep, totalSteps]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
      setValidationError(null);
    }
  }, [currentStep]);

  // ─── SUBMIT ───────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validateCurrent()) return;
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const completionTime = Math.round((Date.now() - startTime) / 1000);
      const { error } = await supabase.from("survey_responses").insert([{
        session_id: sessionId,
        language: lang,
        completion_status: "completed",
        completion_time_seconds: completionTime,
        answers,
        other_texts: otherTexts,
      }]);
      if (error) throw error;
      localStorage.removeItem(AUTOSAVE_KEY);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Survey submission error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [validateCurrent, answers, otherTexts, sessionId, lang, startTime]);

  // ─── KEYBOARD NAV ─────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (currentStep === totalSteps - 1) handleSubmit();
        else goNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, handleSubmit, currentStep, totalSteps]);

  // ─── SCROLL TO TOP ────────────────────────────────────────
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // ─── LOADING ──────────────────────────────────────────────
  if (questionsLoading) {
    return (
      <main className={`h-screen w-screen text-foreground flex items-center justify-center ${onNavigate ? "bg-transparent" : "bg-background"}`}>
        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
      </main>
    );
  }

  // ─── EMPTY STATE ──────────────────────────────────────────
  if (totalSteps === 0) {
    return (
      <main className={`min-h-screen w-full flex flex-col justify-center items-center p-6 ${onNavigate ? "bg-transparent text-white" : "bg-background text-foreground"}`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center max-w-sm text-center"
        >
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <BookDashed className="text-zinc-400 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold mb-3 tracking-tight">
            {lang === "hu" ? "Kérdőív Frissítés Alatt" : "Survey Under Maintenance"}
          </h1>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            {lang === "hu" 
              ? "Jelenleg fejlesztés és frissítés alatt áll a kérdőív rendszerünk. Kérjük, nézz vissza kicsit később, vagy vedd fel velünk a kapcsolatot közvetlenül!"
              : "Our questionnaire is currently undergoing updates and improvements. Please check back later or contact us directly."}
          </p>
          {onNavigate ? (
            <button 
              onClick={() => onNavigate(0)} 
              className="px-6 py-2.5 bg-white text-black font-bold rounded-full text-sm hover:scale-105 transition-transform"
            >
              {lang === "hu" ? "Vissza a Főoldalra" : "Back to Home"}
            </button>
          ) : (
            <a 
              href="/" 
              className="inline-flex px-6 py-2.5 bg-white text-black font-bold rounded-full text-sm hover:scale-105 transition-transform"
            >
              {lang === "hu" ? "Vissza a Főoldalra" : "Back to Home"}
            </a>
          )}
        </motion.div>
      </main>
    );
  }

  // ─── SUBMITTED ────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <main className={`min-h-screen w-screen text-foreground flex flex-col ${onNavigate ? "bg-transparent" : "bg-background"}`}>
        {!onNavigate && <LanguageSwitcher />}
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{ui.thankYouTitle}</h1>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">{ui.thankYouMessage}</p>
            {onNavigate ? (
              <button onClick={() => onNavigate(0)} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-transform">
                MindForge Studio <ArrowRight size={16} />
              </button>
            ) : (
              <a href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-transform">
                MindForge Studio <ArrowRight size={16} />
              </a>
            )}
          </motion.div>
        </div>
        <div className="text-center py-6 text-zinc-600 text-xs">{ui.poweredBy}</div>
      </main>
    );
  }

  const currentSectionId = currentQuestion?.section || "intro";
  const isLastStep = currentStep === totalSteps - 1;
  const isIntro = currentQuestion?.type === "intro";

  return (
    <main className={`h-screen w-screen text-foreground flex flex-col overflow-hidden relative ${onNavigate ? "bg-transparent" : "bg-background"}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-white/[0.02] to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-white/[0.01] to-transparent rounded-full blur-3xl" />
      </div>

      {!onNavigate && <LanguageSwitcher />}

      {/* Top Bar */}
      <div className={`relative z-20 flex items-center justify-between px-4 md:px-8 pb-2 ${onNavigate ? "pt-24" : "pt-5"}`}>
        {onNavigate ? (
          <div className="w-8 h-8" /> 
        ) : (
          <a href="/" className="flex items-center gap-3 group">
            <img src="/logo.webp" alt="MindForge Studio" className="w-8 h-8 object-contain brightness-0 invert" />
            <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors hidden sm:inline">
              MindForge Studio
            </span>
          </a>
        )}
        {!isIntro && (
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="hidden sm:inline capitalize">{currentSectionId}</span>
            <span className="font-mono">{currentStep}/{totalSteps - 1}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {!isIntro && (
        <div className="relative z-20 px-4 md:px-8 pb-2">
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-white/40 to-white/80 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        ref={containerRef}
        className={`flex-1 relative z-10 overflow-y-auto custom-scrollbar px-4 md:px-6 ${
          onNavigate ? (isIntro ? "pb-32" : "pb-4") : "pb-8"
        }`}
      >
        <div className="flex flex-col min-h-full justify-center py-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -60, scale: 0.97 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full max-w-xl mx-auto"
            >
            {currentQuestion && (
              <QuestionRenderer
                question={currentQuestion}
                lang={lang}
                ui={ui}
                answer={answers[currentQuestion.question_id]}
                otherText={otherTexts[currentQuestion.question_id] || ""}
                onAnswer={setAnswer}
                onOtherText={setOtherText}
                onToggleMulti={toggleMultiSelect}
                validationError={validationError}
                activeTooltip={activeTooltip}
                onToggleTooltip={setActiveTooltip}
                onStart={goNext}
              />
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>

      {/* Bottom Nav */}
      {!isIntro && (
        <div className={`relative z-20 px-4 md:px-8 pt-2 ${onNavigate ? "pb-32" : "pb-6"}`}>
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-zinc-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-0 disabled:pointer-events-none"
            >
              <ArrowLeft size={16} />
              {ui.back}
            </button>

            {isLastStep ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-black font-bold text-sm shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" />{ui.submitting}</>
                ) : (
                  <>{ui.submit}<Check size={16} /></>
                )}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-black font-bold text-sm shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] transition-all hover:scale-105"
              >
                {currentQuestion?.required ? ui.next : ui.skip}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// ═════════════════════════════════════════════════════════════
// QuestionRenderer
// ═════════════════════════════════════════════════════════════
interface QRProps {
  question: DBQuestion;
  lang: Locale;
  ui: (typeof surveyUI)["en"];
  answer: string | string[] | undefined;
  otherText: string;
  onAnswer: (id: string, val: string | string[]) => void;
  onOtherText: (id: string, text: string) => void;
  onToggleMulti: (id: string, val: string) => void;
  validationError: string | null;
  activeTooltip: string | null;
  onToggleTooltip: (id: string | null) => void;
  onStart: () => void;
}

function QuestionRenderer({
  question, lang, ui, answer, otherText,
  onAnswer, onOtherText, onToggleMulti,
  validationError, activeTooltip, onToggleTooltip, onStart,
}: QRProps) {
  const qid = question.question_id;
  const label = lang === "hu" ? question.label_hu : question.label_en;
  const desc = lang === "hu" ? question.description_hu : question.description_en;
  const placeholder = lang === "hu" ? question.placeholder_hu : question.placeholder_en;
  const tooltip = lang === "hu" ? question.tooltip_hu : question.tooltip_en;

  // ─── INTRO ───────────────────────────────────────────────
  if (question.type === "intro") {
    return (
      <div className="text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <img src="/logo.webp" alt="MindForge" className="w-10 h-10 object-contain brightness-0 invert" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">{label}</h1>
          {desc && <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8 max-w-md mx-auto">{desc}</p>}
          <div className="flex items-center justify-center gap-6 mb-10 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><Shield size={14} />{ui.anonymous}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} />{ui.timeEstimate}</span>
          </div>
          <button
            onClick={onStart}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-bold text-base shadow-[0_0_40px_rgba(255,255,255,0.08)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] transition-all duration-500 hover:scale-105"
          >
            {ui.start}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── QUESTION HEADER ─────────────────────────────────────
  const header = (
    <div className="mb-6">
      <div className="flex items-start gap-2 mb-2">
        <h2 className="text-xl md:text-2xl font-bold leading-snug flex-1">{label}</h2>
        {tooltip && (
          <button
            onClick={() => onToggleTooltip(activeTooltip === qid ? null : qid)}
            className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <Info size={12} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {tooltip && activeTooltip === qid && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <p className="text-xs text-zinc-400 bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-3 leading-relaxed">{tooltip}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {desc && <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>}
      {question.required && <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">*</span>}
    </div>
  );

  // ─── YES / NO ────────────────────────────────────────────
  if (question.type === "yes_no") {
    return (
      <div>
        {header}
        <div className="grid grid-cols-2 gap-3">
          {[{ val: "yes", label: ui.yes }, { val: "no", label: ui.no }].map((opt) => (
            <button
              key={opt.val}
              onClick={() => onAnswer(qid, opt.val)}
              className={`py-4 rounded-xl border text-base font-semibold transition-all duration-300 ${
                answer === opt.val
                  ? "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                  : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {validationError && <ValidationMsg msg={validationError} />}
      </div>
    );
  }

  // ─── SINGLE CHOICE ───────────────────────────────────────
  if (question.type === "single_choice") {
    return (
      <div>
        {header}
        <div className="space-y-2">
          {question.options.map((opt: DBOption) => (
            <button
              key={opt.value}
              onClick={() => onAnswer(qid, opt.value)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-300 flex items-center gap-3 ${
                answer === opt.value
                  ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.08)]"
                  : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${answer === opt.value ? "border-black bg-black" : "border-zinc-600"}`}>
                {answer === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              {lang === "hu" ? opt.label_hu : opt.label_en}
            </button>
          ))}
        </div>
        {validationError && <ValidationMsg msg={validationError} />}
      </div>
    );
  }

  // ─── MULTI SELECT ─────────────────────────────────────────
  if (question.type === "multi_select") {
    const selected = (answer as string[]) || [];
    return (
      <div>
        {header}
        <div className="space-y-2">
          {question.options.map((opt: DBOption) => {
            const isSel = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => onToggleMulti(qid, opt.value)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-300 flex items-center gap-3 ${
                  isSel ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.08)]" : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all border ${isSel ? "bg-black border-black" : "border-zinc-600"}`}>
                  {isSel && <Check size={10} className="text-white" />}
                </div>
                {lang === "hu" ? opt.label_hu : opt.label_en}
              </button>
            );
          })}

          {question.has_other && (
            <>
              <button
                onClick={() => onToggleMulti(qid, "other")}
                className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-300 flex items-center gap-3 ${
                  selected.includes("other") ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all border ${selected.includes("other") ? "bg-black border-black" : "border-zinc-600"}`}>
                  {selected.includes("other") && <Check size={10} className="text-white" />}
                </div>
                {lang === "hu" ? (question.other_label_hu || "Egyéb") : (question.other_label_en || "Other")}
              </button>
              <AnimatePresence>
                {selected.includes("other") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <input
                      type="text" value={otherText}
                      onChange={(e) => onOtherText(qid, e.target.value)}
                      placeholder={ui.otherPlaceholder}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all mt-1"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
        {validationError && <ValidationMsg msg={validationError} />}
      </div>
    );
  }

  // ─── DROPDOWN ─────────────────────────────────────────────
  if (question.type === "dropdown") {
    const showOtherInput = answer === "other" && question.has_other;
    return (
      <div>
        {header}
        <div className="relative">
          <select
            value={(answer as string) || ""}
            onChange={(e) => onAnswer(qid, e.target.value)}
            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer pr-10"
          >
            <option value="" disabled className="bg-zinc-900">{ui.selectPlaceholder}</option>
            {question.options.map((opt: DBOption) => (
              <option key={opt.value} value={opt.value} className="bg-zinc-900">
                {lang === "hu" ? opt.label_hu : opt.label_en}
              </option>
            ))}
            {question.has_other && (
              <option value="other" className="bg-zinc-900">
                {lang === "hu" ? (question.other_label_hu || "Egyéb") : (question.other_label_en || "Other")}
              </option>
            )}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
        <AnimatePresence>
          {showOtherInput && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <input
                type="text" value={otherText}
                onChange={(e) => onOtherText(qid, e.target.value)}
                placeholder={ui.otherPlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all mt-3"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>
        {validationError && <ValidationMsg msg={validationError} />}
      </div>
    );
  }

  // ─── SHORT TEXT ───────────────────────────────────────────
  if (question.type === "short_text") {
    return (
      <div>
        {header}
        <input
          type="text" value={(answer as string) || ""}
          onChange={(e) => onAnswer(qid, e.target.value)}
          placeholder={placeholder || ""}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
        />
        {validationError && <ValidationMsg msg={validationError} />}
      </div>
    );
  }

  // ─── LONG TEXT ────────────────────────────────────────────
  if (question.type === "long_text") {
    return (
      <div>
        {header}
        <textarea
          rows={4} value={(answer as string) || ""}
          onChange={(e) => onAnswer(qid, e.target.value)}
          placeholder={placeholder || ""}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none min-h-[120px]"
        />
        {validationError && <ValidationMsg msg={validationError} />}
      </div>
    );
  }

  // ─── STATEMENT ────────────────────────────────────────────
  return <div>{header}</div>;
}

function ValidationMsg({ msg }: { msg: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-red-400 text-xs font-medium mt-3 ml-1"
    >
      {msg}
    </motion.p>
  );
}
