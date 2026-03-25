/**
 * Types and helpers for the DB-driven survey system.
 * The source of truth is the `survey_builder_questions` Supabase table.
 */

export type DBQuestionType =
  | "intro"
  | "yes_no"
  | "single_choice"
  | "multi_select"
  | "dropdown"
  | "short_text"
  | "long_text"
  | "statement";

export interface DBOption {
  value: string;
  label_en: string;
  label_hu: string;
}

export type DBCondition =
  | { questionId: string; includes: string[] }
  | { and: { questionId: string; includes: string[] }[] };

export interface DBQuestion {
  id: string;
  question_id: string;
  type: DBQuestionType;
  section: string;
  label_en: string;
  label_hu: string;
  description_en: string | null;
  description_hu: string | null;
  placeholder_en: string | null;
  placeholder_hu: string | null;
  tooltip_en: string | null;
  tooltip_hu: string | null;
  options: DBOption[];
  has_other: boolean;
  other_label_en: string | null;
  other_label_hu: string | null;
  required: boolean;
  is_active: boolean;
  sort_order: number;
  condition_json: DBCondition | null;
  version_history: object[];
  created_at: string;
  updated_at: string;
}

/** Evaluate whether a question should be shown given current answers */
export function evaluateDBCondition(
  condition: DBCondition | null | undefined,
  answers: Record<string, string | string[]>
): boolean {
  if (!condition) return true;
  if ("and" in condition) {
    return condition.and.every((c) => evalSingle(c, answers));
  }
  return evalSingle(condition, answers);
}

function evalSingle(
  c: { questionId: string; includes: string[] },
  answers: Record<string, string | string[]>
): boolean {
  const dep = answers[c.questionId];
  if (!dep) return false;
  const arr = Array.isArray(dep) ? dep : [dep];
  return c.includes.some((v) => arr.includes(v));
}

export const QUESTION_TYPE_LABELS: Record<DBQuestionType, string> = {
  intro: "Intro képernyő",
  yes_no: "Igen / Nem",
  single_choice: "Egyes választás",
  multi_select: "Többes választás",
  dropdown: "Legördülő lista",
  short_text: "Rövid szöveg",
  long_text: "Hosszú szöveg (textarea)",
  statement: "Állítás (no input)",
};

export const SECTION_OPTIONS = [
  { value: "intro",    label: "Intro" },
  { value: "profile",  label: "Profil" },
  { value: "systems",  label: "Eszközök" },
  { value: "pain",     label: "Kihívások" },
  { value: "features", label: "Funkciók" },
  { value: "pricing",  label: "Árazás" },
  { value: "end",      label: "Befejezés" },
];
