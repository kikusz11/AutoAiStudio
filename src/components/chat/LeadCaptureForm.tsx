"use client";

import { useState, FormEvent } from "react";
import { User, Mail, Building2, Send } from "lucide-react";
import { useLanguage } from "../LanguageProvider";

interface LeadCaptureFormProps {
  onSubmit: (data: { name: string; email: string; company: string }) => void;
}

export function LeadCaptureForm({ onSubmit }: LeadCaptureFormProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSubmit({ name: name.trim(), email: email.trim(), company: company.trim() });
  };

  return (
    <div className="bg-linear-to-br from-primary/10 to-accent-light/10 border border-primary/20 rounded-xl p-3.5">
      <p className="text-xs font-medium mb-2.5 text-foreground/80">{t.chat.leadPrompt}</p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <User size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/25" />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.chat.namePlaceholder} required className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg bg-black/5 border border-black/10 text-foreground placeholder:text-foreground/45 focus:outline-none focus:border-primary/30 transition-all" />
        </div>
        <div className="relative">
          <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/25" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.chat.emailPlaceholder} required className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg bg-black/5 border border-black/10 text-foreground placeholder:text-foreground/45 focus:outline-none focus:border-primary/30 transition-all" />
        </div>
        <div className="relative">
          <Building2 size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/25" />
          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t.chat.companyPlaceholder} className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg bg-black/5 border border-black/10 text-foreground placeholder:text-foreground/45 focus:outline-none focus:border-primary/30 transition-all" />
        </div>
        <button type="submit" className="w-full py-2 rounded-lg bg-linear-to-r from-primary to-accent text-white text-xs font-semibold flex items-center justify-center gap-1 hover:shadow-lg hover:shadow-primary/25 transition-all">
          <Send size={12} />
          {t.chat.send}
        </button>
      </form>
    </div>
  );
}
