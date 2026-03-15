"use client";

import { Phone, Wrench, ArrowRight, Code } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

const icons = [Wrench, Phone, Code];

interface ServicesOverlayProps {
  onNavigate: (index: number) => void;
}

export function ServicesOverlay({ onNavigate }: ServicesOverlayProps) {
  const { t } = useLanguage();

  return (
    <div className="h-full w-full flex flex-col justify-center pointer-events-auto pt-24 pb-24 z-10 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl w-full px-6 md:px-12 lg:px-16 mx-auto text-center pointer-events-auto h-full flex flex-col items-center">
        <div className="my-auto py-4 w-full">
          <div className="mb-8 lg:mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-3">
              {t.services.title}{" "}
              <span className="gradient-text">{t.services.titleHighlight}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left max-w-7xl">
            {t.services.items.map((item, i) => {
              const Icon = icons[i];
              // @ts-ignore
              const isUnderDevelopment = item.status !== undefined;
              
              return (
                <div
                  key={i}
                  onClick={() => onNavigate(2)}
                  className="group rounded-3xl p-6 lg:p-8 border border-white/5 hover:border-primary/30 transition-all duration-500 cursor-pointer flex flex-col bg-zinc-950/50 backdrop-blur-xl shadow-xl hover:shadow-2xl relative overflow-hidden"
                >
                  {/* Under Development Badge */}
                  {isUnderDevelopment && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {/* @ts-ignore */}
                        {item.status}
                      </span>
                    </div>
                  )}

                  <div
                    className={`w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-100 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner`}
                  >
                    <Icon size={28} />
                  </div>

                  <h3 className="text-xl lg:text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-foreground/60 text-sm lg:text-base leading-relaxed mb-6 font-medium">
                    {item.description}
                  </p>

                  <ul className="space-y-3 mb-8 flex-1">
                    {item.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 text-sm text-zinc-400 font-medium"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button className="w-full py-3.5 rounded-xl bg-white/5 text-white font-semibold group-hover:bg-white group-hover:text-black transition-all duration-500 flex items-center justify-center gap-2">
                    {item.cta}
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
