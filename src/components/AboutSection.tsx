"use client";

import { useLanguage } from "./LanguageProvider";

interface OverlayProps {
  onNavigate: (index: number) => void;
}

export function AboutOverlay({ onNavigate }: OverlayProps) {
  const { t } = useLanguage();

  // @ts-ignore - bypassing strict type checks for the updated translation structure
  const story = t.about.story as string[];
  // @ts-ignore
  const founders = t.about.founders as Array<{
    initials: string;
    name: string;
    role: string;
    description: string;
  }>;

  return (
    <div className="h-full w-full flex flex-col justify-start md:justify-center overflow-y-auto pointer-events-none pb-24 pt-32 lg:pt-24 z-10 custom-scrollbar">
      <div className="max-w-5xl px-6 md:px-12 lg:px-24 mx-auto w-full pointer-events-auto">
        <div className="text-center mb-12">
          <p className="text-accent font-bold text-sm tracking-widest uppercase mb-4">
            {/* @ts-ignore */}
            {t.about.label}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold mb-8">
            {t.about.title}{" "}
            <span className="text-zinc-400">{t.about.titleHighlight}</span>
          </h2>
          
          <div className="space-y-4 text-base text-zinc-300 leading-relaxed text-left md:text-center max-w-3xl mx-auto">
            {story?.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {founders?.map((founder, idx) => (
            <div
              key={idx}
              className="group flex flex-col bg-zinc-900/40 backdrop-blur-md rounded-2xl p-8 border border-white/5 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden shadow-xl shadow-black/50"
            >
              {/* Subtle top edge highlight */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex items-center gap-5 mb-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl flex-shrink-0 border border-primary/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  {founder.initials}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{founder.name}</h3>
                  <p className="text-sm font-semibold text-primary">{founder.role}</p>
                </div>
              </div>
              
              <div className="text-sm text-zinc-400 leading-relaxed">
                {founder.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
