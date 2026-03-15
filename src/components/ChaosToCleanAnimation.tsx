"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const FRAGMENT_COUNT = 40;

interface FragmentProps {
  id: number;
  width: number;
  height: number;
  initX: string;
  initY: string;
  initRotate: number;
  targetX: string;
  targetY: string;
  type: "document" | "line" | "block";
  delay: number;
  duration: number;
}

export function ChaosToCleanAnimation() {
  const [fragments, setFragments] = useState<FragmentProps[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const generated: FragmentProps[] = [];
    
    // Grid settings for the clean structure
    const cols = 8;
    const rows = 6;
    const cellWidth = window.innerWidth / cols;
    const cellHeight = window.innerHeight / rows;

    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      const typeRand = Math.random();
      const type = typeRand > 0.6 ? "document" : typeRand > 0.3 ? "block" : "line";
      
      let width, height;
      if (type === "document") {
        width = 40 + Math.random() * 40;
        height = 60 + Math.random() * 30;
      } else if (type === "line") {
        width = 80 + Math.random() * 80;
        height = 2;
      } else {
        width = 30 + Math.random() * 40;
        height = width;
      }

      // Start completely scattered (chaotic and out of bounds to fly in)
      const initX = `${(Math.random() - 0.5) * 200 + 50}vw`; 
      const initY = `${(Math.random() - 0.5) * 200 + 50}vh`;
      const initRotate = (Math.random() - 0.5) * 1080; // Wild spins

      // Target clean grid structure
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const targetX = `${col * cellWidth + cellWidth / 2 + (Math.random() - 0.5) * 60}px`;
      const targetY = `${row * cellHeight + cellHeight / 2 + (Math.random() - 0.5) * 60}px`;

      generated.push({
        id: i,
        width,
        height,
        initX,
        initY,
        initRotate,
        targetX,
        targetY,
        type,
        delay: Math.random() * 2, // Stagger the start times
        duration: 8 + Math.random() * 5, // 8-13 seconds of slow organizing
      });
    }

    setFragments(generated);
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {fragments.map((frag) => (
        <motion.div
          key={frag.id}
          className="absolute flex items-center justify-center origin-center"
          initial={{
            x: frag.initX,
            y: frag.initY,
            rotate: frag.initRotate,
            opacity: 0,
            scale: 0.5,
          }}
          animate={{
            x: frag.targetX,
            y: frag.targetY,
            rotate: 0,
            opacity: 0.15, // Keep it very subtle
            scale: 1,
          }}
          transition={{
            duration: frag.duration,
            delay: frag.delay,
            ease: [0.16, 1, 0.3, 1], // Custom bouncy ease out
            opacity: { duration: 4, delay: frag.delay },
          }}
          style={{
            // Center the anchor point using negative margins based on size
            marginLeft: -frag.width / 2,
            marginTop: -frag.height / 2,
          }}
        >
          {/* Inner floating container to keep movement active after settling */}
          <motion.div
            className={`rounded-md border border-white/10 bg-zinc-800/10 backdrop-blur-xs flex flex-col gap-1.5 p-2 shadow-xl shadow-black/50`}
            style={{ width: frag.width, height: frag.height }}
            animate={{
              y: [0, -15 + Math.random() * -10, 0],
              x: [0, -5 + Math.random() * -10, 0],
              rotate: [0, Math.random() * 4 - 2, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          >
            {frag.type === "document" && (
              <>
                <div className="w-full h-[2px] bg-white/20 rounded-full" />
                <div className="w-4/5 h-[2px] bg-white/10 rounded-full" />
                <div className="w-1/2 h-[2px] bg-white/10 rounded-full mt-auto" />
              </>
            )}
            {frag.type === "block" && (
              <div className="w-full h-full border border-white/5 rounded-sm bg-white/5" />
            )}
            {frag.type === "line" && (
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
