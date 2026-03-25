Mindforge Studio Survey System – Full Specification Overview Create a modern,
anonymous, step-by-step survey system at mindforgestudio/survey (or /kerdoiv).
The goal is to quickly, easily, and professionally collect user feedback
regarding their current operations, the systems they use, their pain points, and
what solutions they would pay for.

The survey must be short, easy to complete, mobile-friendly, and should not ask
for sensitive data (no name or company name fields by default). The focus is on
categories, workflows, pain points, and specific tool usage.

1. Public Survey Page URL: mindforgestudio/survey

General Behavior: Display one question per screen. Include a progress bar,
"Next" button, "Back" button, Submit screen, and Thank You screen.

UI/Design: Must be mobile-friendly and fast-loading. Use a clean, modern,
minimal SaaS card-based layout that is simple and highly readable.

User Experience (UX): Completion time should be 2–3 minutes. The process must be
strictly anonymous and feel lightweight. Allow forward and backward navigation.
Prevent users from skipping mandatory questions, but allow skipping optional
ones.

State Management: Implement local autosave (drafts) so users can resume if
interrupted. Include clear Loading, Success, and Error states upon submission.

2. Question Types Supported Yes / No: Quick boolean choice.

Single choice: Select one option from a list.

Multi-select: Select multiple options simultaneously.

Dropdown: For long lists (e.g., role, industry, company size).

Short text: Single-line input (e.g., software name).

Long text: Multi-line text area (e.g., pain points, manual tasks).

Optional info / Statement block: Informational blocks or explanatory text
between questions (no input required).

3. "Other" Option Logic Applicability: Available for Dropdown, Single choice,
   and Multi-select question types.

Behavior: Selecting "Other" dynamically reveals a short text input field.

Validation: If "Other" is selected, the text input becomes mandatory. The custom
string must be saved separately in the database.

Example Workflow: Role → Other → "Please specify" text box appears.

4. Tooltip / Help Icon System Trigger: A small ? or i icon next to industry
   jargon or technical terms.

Interaction: Shows on hover (desktop) or tap (mobile). A second tap closes it.

Format: Non-intrusive, short (1-2 sentences), standard tooltip format (strictly
avoid full-screen popups).

Examples: ERP ("A system used to manage operations..."), CRM ("A tool used to
manage customers...").

Admin Control: Admins must be able to define custom help text for any question
in the backend.

5. Suggested Survey Flow Intro Screen: Title, short description, mention of
   anonymity, estimated time (~2 mins), Start button.

Profile Block: Non-personal categories. Dropdowns for Role (Founder, Engineer,
etc.), Industry (Manufacturing, SaaS, etc.), and Company Size (Just me, 2–5,
100+).

Current System Block: Multi-select for generic tools (Excel, Paper, ERP, CRM)
and a short text field for specific software names (e.g., SAP, Salesforce).

Conditional Follow-up Block: If "ERP" is selected → "What ERP system do you
use?". If "CRM" is selected → "What CRM do you use?".

Pain / Workflow Block: Long text questions like "What slows you down the most?"
or "What do you still do manually?".

Feature Validation Block: Questions like "Which features would you actually
use?" and "Would you switch from your current system?".

Pricing Block: "Would you pay for a system that solves this?" and "What would be
a fair monthly price?".

End Screen: Short thank you text with an optional (not mandatory) email input
field.

6. Multi-language Support Languages: English (Primary) and Hungarian.

Functionality: Simple language switcher at the top of the UI. Users can switch
at any time without losing entered data. The current language choice must
persist during the session.

Translatable Elements: Intro text, buttons, validation errors, tooltips,
question titles, descriptions, and answer options.

Admin Handling: The admin panel must provide dual input fields (EN/HU) for all
text elements. If a translation is missing, it must fallback to the default
language.

7. Admin Panel – Question Management Core CRUD: Add, delete, edit, duplicate,
   and temporarily hide questions.

Organization: Drag-and-drop reordering and grouping questions into sections.

Settings per Question: Type, internal slug, label, description, placeholder,
required toggle, tooltip text, answer options, "Other" toggle, default value,
and validation rules.

Conditional Logic: Show/hide questions, jump to a specific question, or
terminate the survey early based on previous answers (e.g., If Company Size =
"Just me" → hide enterprise questions).

8. Admin Panel – List Management Managed Entities: Centralized management for
   long lists (Roles, Industries, Company Sizes, Tools, Features).

Capabilities: Add, delete, reorder, toggle active/inactive status, provide
translations, and toggle the "Other" option per list.

9. Admin Panel – Responses List View: Table showing date, language, session ID,
   company size, role, industry, completion status, and time taken.

Filtering: Filter by date, language, role, industry, size, or completion status.

Search: Global search for specific software names or keywords in free-text
answers.

Detailed View: View the complete Q&A pair per user, including conditional
responses and metadata. Allow individual export.

10. Admin Panel – Statistics & Analytics Basic Metrics: Total submissions,
    completed vs. partial, completion rate, average completion time, drop-off
    rate, and top drop-off question.

Category Metrics: Distribution of roles, industries, company sizes, languages,
and top tools/software mentioned.

Feature Analytics: Most desired features, willingness to pay ratio, and
intention to switch ratio.

Text Analysis: Extract top keywords and recurring phrases from text inputs.
Allow admins to manually tag responses (e.g., "automation", "bad ERP") for
easier filtering.

Visualizations: Bar charts (Role/Industry), Donut charts (Company Size), and
line charts (Responses over time).

11. Data Structure / Payload Fields Required: Response ID, Session ID,
    Timestamp, Language, Completion Status, Answers Object (normalized values),
    Custom "Other" text values, and Tool-specific typed answers.

12. Technical & UX Refinements Storage: Utilize Local Storage for autosaving to
    prevent data loss on page refresh.

Accessibility: Fully accessible forms, keyboard navigation support on desktop,
and large tappable targets on mobile.

Vibe: Do not make it feel like a bureaucratic form. Keep text sparse, tooltips
helpful but quiet, and conditional logic seamless. It should feel like a
premium, modern app.

13. Core Objective Identify user categories, current tool stacks, specific
    software bottlenecks, manual workflows, desired features, willingness to
    pay, and the biggest market opportunities.

14. Brief for Antigravity IDE Agent Summary: Build a modern, anonymous,
    multi-language survey Single Page Application (SPA) paired with a robust
    Admin dashboard. The Admin side manages questions, conditional logic,
    translations, and handles response filtering/exporting. The user side
    provides a frictionless, one-question-per-screen experience to validate
    product-market fit.
