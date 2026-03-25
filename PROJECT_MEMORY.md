# MindForge Studio | Project Memory & Technical Context

## 🚀 Current State
- **Dynamic Survey Engine**: Successfully migrated from a hardcoded `surveyQuestions.ts` system to a fully database-driven (Supabase) engine (`survey_builder_questions` and `survey_responses`).
- **Admin Dashboard Refactor**: Transitioned into a multi-page architecture for cleaner logic and higher performance:
  - `/admin`: Overview Dashboard (stat cards, recent activity).
  - `/admin/leads`: Dedicated lead tracking with status updates and chat history.
  - `/admin/surveys`: High-performance, filterable response table showing dynamic columns based on active survey questions.
  - `/admin/survey-editor`: Complete question builder interface featuring a powerful **JSON Import/Export panel** specifically designed for AI-assisted bulk editing (ChatGPT can easily generate entire survey modules).
- **Frontend Integration**: The Survey is completely embedded as the 5th tab on the main landing page (`app/page.tsx`). 
  - Achieved seamless `AnimatePresence` scrolling transitions identical to other tabs.
  - Survey UI background becomes transparent when embedded, allowing the main site's `ParticleNetwork` and 3D `OrganicSphere` to shine through, creating an incredible, premium web experience.

## 🧠 Key Decisions & Architecture
- **Tech Stack**: Next.js 16 App Router, Tailwind CSS, Framer Motion, Supabase.
- **Design Philosophy**: Strict adherence to "Premium Glassmorphism" and flawless UX. Any generic/clunky UI element is strictly forbidden.
- **Routing Strategy**: The `/survey` page retains standalone capability for direct URL sharing (opening with a solid background), but intelligently reads the `onNavigate` prop when rendered as an overlay to drop backgrounds and duplicate logos.
- **Deployment**: Configured GitHub push workflows (`kikusz11/AutoAiStudio`) to trigger automatic Netlify deployments.

## ⚙️ Important Code & Configs
- **Scroll Hijacking Bug Fix**: To prevent flexbox from hiding overflowing tall content (e.g., questions with 8+ options) underneath fixed headers:
  - Removed `items-center` from the overflow container.
  - Wrapped content in `<div className="flex flex-col min-h-full justify-center">` so the content centers when small, but overflows downward natively when tall.
- **Component Coordination**: `app/page.tsx` now passes down `onNavigate(idx: number)` uniformly to `Hero`, `Services`, `About`, `Contact`, and `SurveyOverlay`.

## 🚧 Open Issues & Next Steps
- **Database Consistency**: Monitor how the `survey_responses` view handles structural changes or deletions of questions from `survey_builder_questions` over time.
- **Testing**: End-to-end validation of dynamic branching (conditional logic) in live survey environments.
- **Lead Synchronization**: Ensure the Leads dashboard status loops correctly update and interact with corresponding chat APIs.

*Note for future agents: This memory ensures you have full context of the Admin logic and UI integration. You do not need to rediscover the architecture.*
