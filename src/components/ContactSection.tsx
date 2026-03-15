"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OverlayProps {
  onNavigate: (index: number) => void;
}

export function ContactOverlay({ onNavigate }: OverlayProps) {
  const { t } = useLanguage();
  const supabase = createClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    category: "",
    message: ""
  });

  const categories = (t.contact.categories as unknown as string[]) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("leads").insert([
        {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          category: formData.category,
          message: formData.message,
          source: 'website'
        }
      ]);

      if (error) throw error;
      
      setIsSubmitted(true);
      setFormData({ name: "", email: "", company: "", category: "", message: "" });
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-center pointer-events-none pb-12 pt-24 z-10 overflow-y-auto custom-scrollbar">
      <div className="max-w-xl px-6 mx-auto w-full pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
          <h2 className="text-3xl font-bold mb-2 text-center text-white">
            {t.contact.title}{" "}
            <span className="text-zinc-500">{t.contact.titleHighlight}</span>
          </h2>
          <p className="text-zinc-400 text-center mb-8 text-sm md:text-base">
            {t.contact.subtitle}
          </p>

          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="text-white w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">{t.contact.thankYou}</h3>
              <p className="text-zinc-400">{t.contact.thankYouMsg}</p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="mt-8 text-zinc-500 hover:text-white transition-colors text-sm underline underline-offset-4"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
                    {t.contact.company}
                  </label>
                  <input
                    required
                    type="text"
                    placeholder={t.contact.companyPlaceholder}
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
                    {t.contact.category}
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-zinc-900">Select...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-zinc-900">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
                    {t.contact.name}
                  </label>
                  <input
                    required
                    type="text"
                    placeholder={t.contact.namePlaceholder}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
                    {t.contact.email}
                  </label>
                  <input
                    required
                    type="email"
                    placeholder={t.contact.emailPlaceholder}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
                  {t.contact.message}
                </label>
                <textarea
                  rows={3}
                  placeholder={t.contact.messagePlaceholder}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
                />
              </div>

              <button
                disabled={isSubmitting}
                className="w-full group mt-4 px-8 py-4 rounded-xl bg-white text-black font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.05)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] transition-all duration-500 hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {t.contact.submit}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
