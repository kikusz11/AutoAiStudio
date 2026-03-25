"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "./LanguageProvider";
import { Home, Briefcase, User, Mail, Sparkles, ClipboardList } from "lucide-react";

const sectionIndices = [0, 1, 2, 3];

export function Dock({
  activeSection,
  onNavigate,
  onChatToggle,
}: {
  activeSection: number;
  onNavigate: (index: number) => void;
  onChatToggle: () => void;
}) {
  const { t, locale } = useLanguage();
  const [clicks, setClicks] = useState<number[]>([]);
  
  const getSurveyLabel = () => {
    switch (locale) {
      case "hu": return "Kérdőív";
      case "de": return "Umfrage";
      case "fr": return "Sondage";
      case "es": return "Encuesta";
      case "it": return "Sondaggio";
      default: return "Survey";
    }
  };

  // Custom tooltips
  const labels = [t.nav.home, t.nav.services, t.nav.about, t.nav.contact, getSurveyLabel()];

  const handleOrbClick = () => {
    setClicks((prev) => [...prev, Date.now()]);
    onChatToggle();
    setTimeout(() => {
      setClicks((prev) => prev.slice(1));
    }, 700);
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center h-16 px-6 lg:px-8 bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-full"
    >
      <div className="flex items-center gap-2 sm:gap-6 relative">
        
        {/* Item 1: Home */}
        <button
          onClick={() => onNavigate(0)}
          title={labels[0]}
          className={`relative group p-2 rounded-full transition-colors flex items-center justify-center ${activeSection === 0 ? "text-primary" : "text-foreground/50 hover:text-foreground/80 hover:bg-black/5"}`}
        >
          <Home size={22} className={`transition-transform duration-300 ${activeSection === 0 ? 'scale-110' : 'group-hover:scale-110'}`} />
          {activeSection === 0 && <motion.div layoutId="dockActive" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
        </button>

        {/* Item 2: Services */}
        <button
          onClick={() => onNavigate(1)}
          title={labels[1]}
          className={`relative group p-2 rounded-full transition-colors flex items-center justify-center ${activeSection === 1 ? "text-primary" : "text-foreground/50 hover:text-foreground/80 hover:bg-black/5"}`}
        >
          <Briefcase size={22} className={`transition-transform duration-300 ${activeSection === 1 ? 'scale-110' : 'group-hover:scale-110'}`} />
          {activeSection === 1 && <motion.div layoutId="dockActive" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
        </button>



        {/* Item 3: Contact */}
        <button
          onClick={() => onNavigate(2)}
          title={labels[3]}
          className={`relative group p-2 rounded-full transition-colors flex items-center justify-center ${activeSection === 2 ? "text-primary" : "text-foreground/50 hover:text-foreground/80 hover:bg-black/5"}`}
        >
          <Mail size={22} className={`transition-transform duration-300 ${activeSection === 2 ? 'scale-110' : 'group-hover:scale-110'}`} />
          {activeSection === 2 && <motion.div layoutId="dockActive" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
        </button>

        {/* Item 4: About */}
        <button
          onClick={() => onNavigate(3)}
          title={labels[2]}
          className={`relative group p-2 rounded-full transition-colors flex items-center justify-center ${activeSection === 3 ? "text-primary" : "text-foreground/50 hover:text-foreground/80 hover:bg-black/5"}`}
        >
          <User size={22} className={`transition-transform duration-300 ${activeSection === 3 ? 'scale-110' : 'group-hover:scale-110'}`} />
          {activeSection === 3 && <motion.div layoutId="dockActive" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
        </button>

        {/* Item 5: Survey */}
        <button
          onClick={() => onNavigate(4)}
          title={labels[4]}
          className={`relative group p-2 rounded-full transition-colors flex items-center justify-center ${activeSection === 4 ? "text-primary flex-shrink-0" : "text-foreground/50 hover:text-foreground/80 hover:bg-black/5"}`}
        >
          <ClipboardList size={22} className={`transition-transform duration-300 ${activeSection === 4 ? 'scale-110' : 'group-hover:scale-110'}`} />
          {activeSection === 4 && <motion.div layoutId="dockActive" className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
        </button>

      </div>
    </motion.div>
  );
}
