"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export function OrganicSphereAnimation({ activeSection }: { activeSection: number }) {
  const { scrollY } = useScroll();
  
  // Define positions for the four sections (corners)
  const sectionPositions = [
    { x: "25vw", y: "-25vh" }, // 0: Top Right (Hero)
    { x: "-25vw", y: "25vh" },  // 1: Bottom Left (Services)
    { x: "-25vw", y: "-25vh" }, // 2: Top Left (Contact)
    { x: "25vw", y: "25vh" },   // 3: Bottom Right (About)
  ];

  const currentPos = sectionPositions[activeSection] || sectionPositions[0];
  
  // Parallax effects on scroll
  const yOffset = useTransform(scrollY, [0, 1000], [0, 300]);
  const scaleScroll = useTransform(scrollY, [0, 800], [1, 0.8]);
  const opacityScroll = useTransform(scrollY, [0, 600], [1, 0.2]);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-0"
      style={{
        y: yOffset,
        scale: scaleScroll,
        opacity: opacityScroll,
      }}
    >
      {/* Corner positioning wrapper that animates smoothly when section changes */}
      <motion.div
        className="absolute flex items-center justify-center"
        animate={{ x: currentPos.x, y: currentPos.y }}
        transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }} 
      >
        {/* Central Base Container for the Sphere */}
        <motion.div
          className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px]"
          // Slow rotation and floating translation for the entire group
          animate={{
            rotate: [0, 360],
            x: [0, 15, -10, 0],
            y: [0, -20, 15, 0],
          }}
          transition={{
            rotate: { duration: 120, repeat: Infinity, ease: "linear" },
            x: { duration: 15, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" },
            y: { duration: 18, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" },
          }}
        >
          {/* Layer 1: The Core Glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-[80px] md:blur-[120px]"
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Layer 2: Deformed/Organic Shape (Horizontal stretch) */}
        <motion.div
          className="absolute top-[10%] left-[10%] right-[10%] bottom-[10%] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gradient-to-br from-primary/30 to-transparent blur-[40px] mix-blend-screen"
          animate={{
            borderRadius: [
              "40% 60% 70% 30% / 40% 50% 60% 50%",
              "60% 40% 30% 70% / 60% 30% 70% 40%",
              "40% 60% 70% 30% / 40% 50% 60% 50%",
            ],
            rotate: [0, -180],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            borderRadius: { duration: 15, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 40, repeat: Infinity, ease: "linear" },
            scale: { duration: 10, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Layer 3: Secondary Organic Shape (Vertical stretch) */}
        <motion.div
          className="absolute top-[15%] left-[20%] right-[20%] bottom-[15%] rounded-[50%_50%_40%_60%/60%_40%_50%_50%] bg-gradient-to-tl from-accent/20 to-primary/10 blur-[50px] mix-blend-screen"
          animate={{
            borderRadius: [
              "50% 50% 40% 60% / 60% 40% 50% 50%",
              "40% 60% 50% 50% / 40% 60% 40% 60%",
              "50% 50% 40% 60% / 60% 40% 50% 50%",
            ],
            rotate: [0, 180],
            scale: [1, 1.15, 1],
          }}
          transition={{
            borderRadius: { duration: 12, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 50, repeat: Infinity, ease: "linear" },
            scale: { duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 },
          }}
        />
        
        {/* Layer 4: The inner "solid" core */}
        <div className="absolute top-[30%] left-[30%] right-[30%] bottom-[30%] rounded-full bg-black/40 blur-[20px] shadow-[inset_0_0_50px_rgba(245,158,11,0.2)]" />
        
        {/* Layer 5: Subtle connecting lines rotating inside the sphere */}
        <motion.div 
          className="absolute inset-[15%] rounded-full border border-primary/10 border-dashed opacity-30"
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ rotate: { duration: 60, repeat: Infinity, ease: "linear" }, scale: { duration: 7, repeat: Infinity, ease: "easeInOut" } }}
        />
        <motion.div 
          className="absolute inset-[25%] rounded-full border border-accent/20 border-dotted opacity-20"
          animate={{ rotate: -360, scale: [0.95, 1.05, 0.95] }}
          transition={{ rotate: { duration: 80, repeat: Infinity, ease: "linear" }, scale: { duration: 9, repeat: Infinity, ease: "easeInOut" } }}
        />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
