"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useLanguage } from "@/components/LanguageProvider";
import { Dock } from "@/components/Dock";
import { HeroOverlay } from "@/components/HeroSection";
import { ServicesOverlay } from "@/components/ServicesSection";
import { AboutOverlay } from "@/components/AboutSection";
import { ContactOverlay } from "@/components/ContactSection";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const AiBrainScene = dynamic(
  () => import("@/components/three/AiBrainScene"),
  { ssr: false }
);

const ParticleNetwork = dynamic(
  () => import("@/components/ParticleNetwork").then((mod) => mod.ParticleNetwork),
  { ssr: false }
);

const OrganicSphereAnimation = dynamic(
  () => import("@/components/OrganicSphereAnimation").then((mod) => mod.OrganicSphereAnimation),
  { ssr: false }
);

const SECTION_COUNT = 4;
const overlays = [HeroOverlay, ServicesOverlay, ContactOverlay, AboutOverlay];

export default function Home() {
  const [activeSection, setActiveSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { t } = useLanguage();

  const navigateTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= SECTION_COUNT || isScrolling) return;
      setIsScrolling(true);
      setActiveSection(index);
      setTimeout(() => setIsScrolling(false), 1200);
    },
    [isScrolling]
  );

  // Scroll hijack
  useEffect(() => {
    const getScrollContainer = () => {
      // Find the currently active scrollable container
      return document.querySelector('.custom-scrollbar') as HTMLElement | null;
    };

    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) {
        e.preventDefault();
        return;
      }

      const container = getScrollContainer();
      if (!container) return;

      const isAtTop = container.scrollTop <= 0;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 1;

      if (e.deltaY > 30 && isAtBottom) {
        e.preventDefault();
        navigateTo(activeSection + 1);
      } else if (e.deltaY < -30 && isAtTop) {
        e.preventDefault();
        navigateTo(activeSection - 1);
      }
      // If none of the above, let the natural scroll happen
    };

    let touchStart = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling) return;

      const touchEnd = e.changedTouches[0].clientY;
      const diff = touchStart - touchEnd;
      const threshold = 100; // Increased threshold for mobile

      if (Math.abs(diff) < threshold) return;

      const container = getScrollContainer();
      if (!container) {
        // Fallback for sections without custom-scrollbar (if any)
        navigateTo(activeSection + (diff > 0 ? 1 : -1));
        return;
      }

      const isAtTop = container.scrollTop <= 0;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 1;

      if (diff > 0 && isAtBottom) {
        // Swiping UP (scrolling DOWN)
        navigateTo(activeSection + 1);
      } else if (diff < 0 && isAtTop) {
        // Swiping DOWN (scrolling UP)
        navigateTo(activeSection - 1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling) return;
      
      const container = getScrollContainer();
      const isAtTop = container ? container.scrollTop <= 0 : true;
      const isAtBottom = container ? container.scrollHeight - container.scrollTop <= container.clientHeight + 1 : true;

      if ((e.key === "ArrowDown" || e.key === "PageDown") && isAtBottom) {
        e.preventDefault();
        navigateTo(activeSection + 1);
      } else if ((e.key === "ArrowUp" || e.key === "PageUp") && isAtTop) {
        e.preventDefault();
        navigateTo(activeSection - 1);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeSection, isScrolling, navigateTo]);

  const ActiveOverlay = overlays[activeSection];
  const sectionLabels = t.sections as unknown as string[];

  return (
    <main className="h-screen w-screen overflow-hidden relative">
      {/* 2D Canvas Particle Background */}
      <ParticleNetwork />

      {/* Organic Pulsing Sphere Background */}
      <OrganicSphereAnimation activeSection={activeSection} />

      {/* Floating Logo - Animates between Center (Hero) and Top-Left (Navbar) */}
      <motion.button
        layout
        onClick={() => navigateTo(0)}
        className={`fixed z-50 flex items-center transition-colors duration-500 ${
          activeSection === 0
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-[130%] flex-col gap-2"
            : "top-6 left-6 gap-4 px-4 py-2 hover:bg-white/5 rounded-xl cursor-pointer"
        }`}
      >
        <motion.div
          layout
          className={`relative flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            activeSection === 0 ? "w-64 h-32 sm:w-[24rem] sm:h-48" : "w-10 h-10"
          }`}
        >
          <img
            src="/logo.webp"
            alt="MindForge Studio Logo"
            className="w-full h-full object-contain dark:invert"
          />
        </motion.div>
        
        <motion.span
          layout
          className={`font-black tracking-tighter text-foreground whitespace-nowrap transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            activeSection === 0 ? "text-4xl md:text-6xl lg:text-7xl tracking-tight" : "text-xl tracking-wider"
          }`}
        >
          MindForge Studio
        </motion.span>
      </motion.button>

      {/* Hero CTA block — shown only on section 0, positioned below the logo */}
      <AnimatePresence>
        {activeSection === 0 && (
          <motion.div
            key="hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, delay: activeSection === 0 ? 0.3 : 0, ease: "easeOut" }}
            className="fixed z-40 left-1/2 -translate-x-1/2 w-[90vw] max-w-5xl flex flex-col items-center text-center pointer-events-auto"
            style={{ top: "50%", transform: "translate(-50%, 0%)" }}
          >
            <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold mb-4 tracking-tight max-w-3xl leading-tight">
              {/* @ts-ignore */}
              {t.hero.mainHeadline}
            </h1>
            <div className="flex flex-col gap-2 mb-8 items-center">
              <p className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400">
                {/* @ts-ignore */}
                {t.hero.subHeadline1}
              </p>
              <p className="text-base md:text-lg font-medium text-zinc-300">
                {/* @ts-ignore */}
                {t.hero.subHeadline2}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo(2)}
                className="group px-6 py-3 rounded-full bg-white text-black font-bold text-sm shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] transition-all duration-500 hover:scale-105 flex items-center gap-2"
              >
                ✨ {t.hero.cta}
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </button>
              <button
                onClick={() => navigateTo(2)}
                className="px-6 py-3 rounded-full border border-white/20 text-foreground/70 font-medium text-sm hover:border-white/40 hover:text-foreground hover:bg-white/5 transition-all duration-300"
              >
                {t.hero.ctaSecondary}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-auto flex flex-col"
          >
            {activeSection === 0 ? (
              <ActiveOverlay onNavigate={navigateTo} />
            ) : (
              <ActiveOverlay onNavigate={navigateTo} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <LanguageSwitcher />

      <Dock 
        activeSection={activeSection} 
        onNavigate={navigateTo} 
        onChatToggle={() => setIsChatOpen(prev => !prev)}
      />

      {/* Chat widget */}
      <ChatWidget 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </main>
  );
}
