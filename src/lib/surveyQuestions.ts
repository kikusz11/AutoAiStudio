export type QuestionType =
  | "intro"
  | "yes_no"
  | "single_choice"
  | "multi_select"
  | "dropdown"
  | "short_text"
  | "long_text"
  | "statement";

export interface QuestionOption {
  value: string;
  label: { en: string; hu: string };
}

export interface TooltipDef {
  en: string;
  hu: string;
}

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  section: string;
  label: { en: string; hu: string };
  description?: { en: string; hu: string };
  placeholder?: { en: string; hu: string };
  options?: QuestionOption[];
  required?: boolean;
  hasOther?: boolean;
  otherLabel?: { en: string; hu: string };
  tooltip?: TooltipDef;
  /** Show this question only if the condition is met */
  condition?: {
    questionId: string;
    /** Show if the answer includes ANY of these values */
    includes: string[];
  };
  maxSelections?: number;
}

export const surveyQuestions: SurveyQuestion[] = [
  // ─── INTRO ────────────────────────────────────────────────
  {
    id: "intro",
    type: "intro",
    section: "intro",
    label: {
      en: "Help us build the perfect tool for you",
      hu: "Segíts nekünk megépíteni a tökéletes eszközt számodra",
    },
    description: {
      en: "This short, anonymous survey takes about 2 minutes. Your answers help us understand what you truly need — so we can build better solutions.",
      hu: "Ez a rövid, anonim kérdőív mindössze 2 percet vesz igénybe. A válaszaid segítenek megérteni, mire van valóban szükséged — hogy jobb megoldásokat építhessünk.",
    },
  },

  // ─── PROFILE BLOCK ───────────────────────────────────────
  {
    id: "role",
    type: "dropdown",
    section: "profile",
    label: {
      en: "What's your role?",
      hu: "Mi a szereped?",
    },
    required: true,
    hasOther: true,
    otherLabel: { en: "Please specify", hu: "Kérjük, pontosítsd" },
    options: [
      { value: "founder", label: { en: "Founder / Owner", hu: "Alapító / Tulajdonos" } },
      { value: "ceo", label: { en: "CEO / Managing Director", hu: "Ügyvezető / Igazgató" } },
      { value: "manager", label: { en: "Manager", hu: "Menedzser" } },
      { value: "engineer", label: { en: "Engineer / Developer", hu: "Mérnök / Fejlesztő" } },
      { value: "sales", label: { en: "Sales / Marketing", hu: "Értékesítés / Marketing" } },
      { value: "operations", label: { en: "Operations / Admin", hu: "Operáció / Adminisztráció" } },
      { value: "freelancer", label: { en: "Freelancer / Consultant", hu: "Szabadúszó / Tanácsadó" } },
    ],
  },
  {
    id: "industry",
    type: "dropdown",
    section: "profile",
    label: {
      en: "What industry are you in?",
      hu: "Milyen iparágban dolgozol?",
    },
    required: true,
    hasOther: true,
    otherLabel: { en: "Please specify", hu: "Kérjük, pontosítsd" },
    options: [
      { value: "manufacturing", label: { en: "Manufacturing", hu: "Gyártás" } },
      { value: "construction", label: { en: "Construction", hu: "Építőipar" } },
      { value: "retail", label: { en: "Retail / E-commerce", hu: "Kereskedelem / E-commerce" } },
      { value: "services", label: { en: "Professional Services", hu: "Szakmai szolgáltatások" } },
      { value: "healthcare", label: { en: "Healthcare", hu: "Egészségügy" } },
      { value: "logistics", label: { en: "Logistics / Transport", hu: "Logisztika / Szállítás" } },
      { value: "hospitality", label: { en: "Hospitality / Food", hu: "Vendéglátás / Élelmiszer" } },
      { value: "tech", label: { en: "Technology / SaaS", hu: "Technológia / SaaS" } },
      { value: "real_estate", label: { en: "Real Estate", hu: "Ingatlan" } },
      { value: "automotive", label: { en: "Automotive", hu: "Autóipar" } },
      { value: "finance", label: { en: "Finance / Insurance", hu: "Pénzügy / Biztosítás" } },
      { value: "education", label: { en: "Education", hu: "Oktatás" } },
      { value: "agriculture", label: { en: "Agriculture", hu: "Mezőgazdaság" } },
    ],
  },
  {
    id: "company_size",
    type: "single_choice",
    section: "profile",
    label: {
      en: "How big is your team?",
      hu: "Mekkora a csapatod?",
    },
    required: true,
    options: [
      { value: "solo", label: { en: "Just me", hu: "Csak én" } },
      { value: "2-5", label: { en: "2–5 people", hu: "2–5 fő" } },
      { value: "6-20", label: { en: "6–20 people", hu: "6–20 fő" } },
      { value: "21-50", label: { en: "21–50 people", hu: "21–50 fő" } },
      { value: "51-100", label: { en: "51–100 people", hu: "51–100 fő" } },
      { value: "100+", label: { en: "100+ people", hu: "100+ fő" } },
    ],
  },

  // ─── CURRENT SYSTEMS BLOCK ───────────────────────────────
  {
    id: "current_tools",
    type: "multi_select",
    section: "systems",
    label: {
      en: "What tools do you currently use to manage your business?",
      hu: "Milyen eszközöket használsz jelenleg a céged irányításához?",
    },
    required: true,
    hasOther: true,
    otherLabel: { en: "Other tool", hu: "Egyéb eszköz" },
    options: [
      { value: "excel", label: { en: "Excel / Spreadsheets", hu: "Excel / Táblázatok" } },
      { value: "paper", label: { en: "Paper / Notebooks", hu: "Papír / Füzetek" } },
      { value: "erp", label: { en: "ERP system", hu: "ERP rendszer" } },
      { value: "crm", label: { en: "CRM system", hu: "CRM rendszer" } },
      { value: "accounting", label: { en: "Accounting software", hu: "Könyvelő szoftver" } },
      { value: "project_mgmt", label: { en: "Project management tool", hu: "Projektmenedzsment eszköz" } },
      { value: "email", label: { en: "Email / Messaging", hu: "Email / Üzenetküldés" } },
      { value: "custom", label: { en: "Custom built software", hu: "Egyéni fejlesztésű szoftver" } },
      { value: "nothing", label: { en: "Nothing / No system", hu: "Semmi / Nincs rendszer" } },
    ],
    tooltip: {
      en: "Select all that apply. This helps us understand your current workflow.",
      hu: "Jelöld meg az összeset, ami illik. Ez segít megérteni a jelenlegi munkafolyamataidat.",
    },
  },
  {
    id: "erp_name",
    type: "short_text",
    section: "systems",
    label: {
      en: "Which ERP system do you use?",
      hu: "Milyen ERP rendszert használsz?",
    },
    placeholder: { en: "e.g. SAP, Oracle, Odoo...", hu: "pl. SAP, Oracle, Odoo..." },
    condition: { questionId: "current_tools", includes: ["erp"] },
    tooltip: {
      en: "ERP (Enterprise Resource Planning) — A system used to manage daily business operations like accounting, procurement, project management, and manufacturing.",
      hu: "ERP (Vállalatirányítási rendszer) — Egy rendszer, amely az üzleti műveletek napi kezelésére szolgál, mint a könyvelés, beszerzés, projektmenedzsment és gyártás.",
    },
  },
  {
    id: "crm_name",
    type: "short_text",
    section: "systems",
    label: {
      en: "Which CRM system do you use?",
      hu: "Milyen CRM rendszert használsz?",
    },
    placeholder: { en: "e.g. Salesforce, HubSpot...", hu: "pl. Salesforce, HubSpot..." },
    condition: { questionId: "current_tools", includes: ["crm"] },
    tooltip: {
      en: "CRM (Customer Relationship Management) — A tool used to manage interactions with customers and track sales pipelines.",
      hu: "CRM (Ügyfélkapcsolat-kezelés) — Egy eszköz, amely segíti az ügyfelekkel való kapcsolattartást és az értékesítési csatornák nyomon követését.",
    },
  },

  // ─── PAIN POINTS BLOCK ───────────────────────────────────
  {
    id: "biggest_slowdown",
    type: "long_text",
    section: "pain",
    label: {
      en: "What slows you down the most in your daily work?",
      hu: "Mi lassít le leginkább a napi munkádban?",
    },
    placeholder: {
      en: "e.g. manual data entry, chasing invoices, scattered information...",
      hu: "pl. kézi adatbevitel, számlák kergetése, szétszórt információk...",
    },
    required: true,
  },
  {
    id: "manual_tasks",
    type: "long_text",
    section: "pain",
    label: {
      en: "What tasks do you still do manually that you wish were automated?",
      hu: "Milyen feladatokat végzel még kézzel, amiket szívesen automatizálnál?",
    },
    placeholder: {
      en: "e.g. creating reports, sending reminders, stock tracking...",
      hu: "pl. riportok készítése, emlékeztetők küldése, készletkövetés...",
    },
  },

  // ─── FEATURE VALIDATION BLOCK ────────────────────────────
  {
    id: "desired_features",
    type: "multi_select",
    section: "features",
    label: {
      en: "Which features would you actually use?",
      hu: "Milyen funkciókat használnál valójában?",
    },
    required: true,
    options: [
      { value: "crm_sales", label: { en: "CRM & Sales tracking", hu: "CRM és értékesítés nyomon követése" } },
      { value: "project_mgmt", label: { en: "Project management", hu: "Projektmenedzsment" } },
      { value: "inventory", label: { en: "Inventory management", hu: "Készletkezelés" } },
      { value: "invoicing", label: { en: "Invoicing & Quotes", hu: "Számlázás és árajánlatok" } },
      { value: "hr_timesheet", label: { en: "HR & Timesheets", hu: "Munkaügy és jelenlét" } },
      { value: "dashboard", label: { en: "Real-time dashboard", hu: "Valós idejű dashboard" } },
      { value: "ai_assistant", label: { en: "AI assistant / Chatbot", hu: "AI asszisztens / Chatbot" } },
      { value: "automation", label: { en: "Workflow automation", hu: "Munkafolyamatok automatizálása" } },
      { value: "reports", label: { en: "Custom reports", hu: "Egyéni riportok" } },
      { value: "mobile", label: { en: "Mobile app", hu: "Mobil alkalmazás" } },
    ],
  },
  {
    id: "would_switch",
    type: "yes_no",
    section: "features",
    label: {
      en: "Would you consider switching from your current tools to an all-in-one system?",
      hu: "Megfontolnád, hogy a jelenlegi eszközeidről egy mindent-egyben rendszerre válts?",
    },
    required: true,
  },

  // ─── PRICING BLOCK ───────────────────────────────────────
  {
    id: "would_pay",
    type: "yes_no",
    section: "pricing",
    label: {
      en: "Would you pay for a system that truly solves these problems?",
      hu: "Fizetnél egy rendszerért, ami valóban megoldja ezeket a problémákat?",
    },
    required: true,
  },
  {
    id: "price_range",
    type: "single_choice",
    section: "pricing",
    label: {
      en: "What would be a fair monthly price for such a system?",
      hu: "Mi lenne egy fair havi ár egy ilyen rendszerért?",
    },
    condition: { questionId: "would_pay", includes: ["yes"] },
    options: [
      { value: "0-10", label: { en: "€0 – €10 / month", hu: "0 – 10 € / hó" } },
      { value: "10-30", label: { en: "€10 – €30 / month", hu: "10 – 30 € / hó" } },
      { value: "30-50", label: { en: "€30 – €50 / month", hu: "30 – 50 € / hó" } },
      { value: "50-100", label: { en: "€50 – €100 / month", hu: "50 – 100 € / hó" } },
      { value: "100+", label: { en: "€100+ / month", hu: "100+ € / hó" } },
    ],
  },

  // ─── END SCREEN ──────────────────────────────────────────
  {
    id: "email_optional",
    type: "short_text",
    section: "end",
    label: {
      en: "Thank you for your time! 🎉",
      hu: "Köszönjük az idődet! 🎉",
    },
    description: {
      en: "If you'd like to stay in the loop or get early access, drop your email below. This is completely optional.",
      hu: "Ha szeretnél naprakész maradni vagy korai hozzáférést kapni, add meg az email címedet lentebb. Ez teljesen opcionális.",
    },
    placeholder: { en: "your@email.com (optional)", hu: "te@email.com (opcionális)" },
    required: false,
  },
];

export const surveySections = [
  { id: "intro", label: { en: "Welcome", hu: "Üdvözlünk" } },
  { id: "profile", label: { en: "About You", hu: "Rólad" } },
  { id: "systems", label: { en: "Your Tools", hu: "Eszközeid" } },
  { id: "pain", label: { en: "Challenges", hu: "Kihívások" } },
  { id: "features", label: { en: "Features", hu: "Funkciók" } },
  { id: "pricing", label: { en: "Pricing", hu: "Árazás" } },
  { id: "end", label: { en: "Finish", hu: "Befejezés" } },
];

export const surveyUI = {
  en: {
    next: "Next",
    back: "Back",
    start: "Start Survey",
    submit: "Submit",
    skip: "Skip",
    required: "This question is required",
    otherPlaceholder: "Please specify...",
    yes: "Yes",
    no: "No",
    selectPlaceholder: "Select an option...",
    submitting: "Submitting...",
    thankYouTitle: "Thank you!",
    thankYouMessage: "Your feedback helps us build something truly useful. We appreciate your time.",
    surveyTitle: "MindForge Survey",
    poweredBy: "Powered by MindForge Studio",
    progressLabel: "Progress",
    anonymous: "100% Anonymous",
    timeEstimate: "~2 min",
  },
  hu: {
    next: "Tovább",
    back: "Vissza",
    start: "Kérdőív indítása",
    submit: "Beküldés",
    skip: "Kihagyás",
    required: "Ez a kérdés kötelező",
    otherPlaceholder: "Kérjük, pontosítsd...",
    yes: "Igen",
    no: "Nem",
    selectPlaceholder: "Válassz egy lehetőséget...",
    submitting: "Beküldés...",
    thankYouTitle: "Köszönjük!",
    thankYouMessage: "A visszajelzésed segít nekünk valóban hasznosat építeni. Köszönjük az idődet.",
    surveyTitle: "MindForge Kérdőív",
    poweredBy: "Készítette: MindForge Studio",
    progressLabel: "Haladás",
    anonymous: "100% Anonim",
    timeEstimate: "~2 perc",
  },
};
