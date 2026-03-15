"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Line, Trail, Html } from "@react-three/drei";
import * as THREE from "three";

// Position targets for each section scroll state
// Home: Core Right (X=3, Y=0)
// Services: Core Left (X=-3, Y=0)
// About: Core Top Right (X=2, Y=1.5)
// Contact: Core Bottom Left (X=-2, Y=-1.5)
const TARGET_X_POSITIONS = [3, -3, 2, -2];
const TARGET_Y_POSITIONS = [0, 0, 1.5, -1.5];

/* ---------- Orbiting Section Label ---------- */
function SectionOrbit({
  label,
  index,
  isActive,
  radius,
  speed,
  yOffset,
  onClick,
}: {
  label: string;
  index: number;
  isActive: boolean;
  radius: number;
  speed: number;
  yOffset: number;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const dotRef = useRef<THREE.Mesh>(null!);
  
  // Starting angles to spread them around the core
  const startAngle = (Math.PI * 2 * index) / 4;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + startAngle;
    
    if (groupRef.current) {
      // Orbit around the Y axis
      groupRef.current.position.x = Math.cos(t) * radius;
      groupRef.current.position.z = Math.sin(t) * radius;
      // Slight vertical bobbing
      groupRef.current.position.y = yOffset + Math.sin(t * 2) * 0.2;
    }
    
    if (dotRef.current) {
      // Pulsing scale for the active section
      const targetScale = isActive ? 1.5 + Math.sin(clock.getElapsedTime() * 4) * 0.3 : 1;
      dotRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh 
        ref={dotRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => { document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial 
          color={isActive ? "#FB2576" : "#44403c"} 
          emissive={isActive ? "#3F0071" : "#44403c"}
          emissiveIntensity={isActive ? 2 : 0.5}
        />
      </mesh>
      
      {/* HTML Label attached to the 3D position */}
      <Html distanceFactor={8} zIndexRange={[100, 0]}>
        <div 
          className={`flex items-center gap-2 transition-all duration-300 ${
            isActive ? "opacity-100 scale-110" : "opacity-40 scale-90 hover:opacity-100 hover:scale-100"
          }`}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          style={{ transform: "translate3d(10px, -20px, 0)", cursor: "pointer", pointerEvents: "auto" }}
        >
          {/* Connecting line (CSS based) */}
          <div className={`w-8 h-[1px] ${isActive ? "bg-primary" : "bg-black/20"}`} />
          {/* Label box */}
          <div className={`px-2 py-1 rounded bg-white/80 backdrop-blur-md border text-xs whitespace-nowrap font-medium ${
            isActive ? "border-primary/50 text-primary-dark" : "border-black/10 text-foreground/60"
          }`}>
            {label}
          </div>
        </div>
      </Html>
    </group>
  );
}

/* ---------- Central AI Core ---------- */
function AiCore({ isActive }: { isActive: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null!);
  const haloRef = useRef<THREE.Mesh>(null!);
  const particlesRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Rotate core and particles
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.2;
      coreRef.current.rotation.x = t * 0.1;
      
      // Pulse effect
      const scale = 1 + Math.sin(t * 2) * 0.05;
      coreRef.current.scale.setScalar(scale);
    }
    
    if (haloRef.current) {
      const haloScale = 1.2 + Math.sin(t * 1.5) * 0.1;
      haloRef.current.scale.setScalar(haloScale);
      (haloRef.current.material as THREE.MeshStandardMaterial).opacity = 0.2 + Math.sin(t * 3) * 0.05;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = -t * 0.15;
      particlesRef.current.rotation.z = t * 0.05;
    }
  });

  // Generate generic background particles around the core
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map(() => {
      const radius = 1 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      return new THREE.Vector3(x, y, z);
    });
  }, []);

  return (
    <group>
      {/* Outer Halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#fde68a"
          emissive="#FB2576"
          emissiveIntensity={1}
          transparent
          opacity={0.2}
          wireframe
        />
      </mesh>

      {/* Solid Inner Core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#3F0071"
          emissive="#b45309"
          emissiveIntensity={0.6}
          wireframe={false}
          roughness={0.15}
          metalness={0.9}
        />
      </mesh>
      
      {/* Orbiting Generic Particles with Trails */}
      <group ref={particlesRef}>
        {particles.map((pos, i) => (
          <Trail
            key={i}
            width={0.5}
            color="#fcd34d"
            length={2}
            decay={2}
            local={false}
          >
            <mesh position={pos}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color={i % 2 === 0 ? "#67e8f9" : "#c4b5fd"} />
            </mesh>
          </Trail>
        ))}
        
        {/* Connection lines between some particles */}
        {particles.slice(0, 10).map((p1, i) => 
          particles.slice(i + 1, 15).map((p2, j) => {
            if (p1.distanceTo(p2) < 1.5) {
              return (
                <Line 
                  key={`l-${i}-${j}`} 
                  points={[p1, p2]} 
                  color="#7c3aed" 
                  transparent 
                  opacity={0.15} 
                  lineWidth={0.5} 
                />
              )
            }
            return null;
          })
        )}
      </group>
    </group>
  );
}

/* ---------- Camera & Position Controller ---------- */
function SceneController({ 
  activeSection, 
  sectionLabels,
  onSectionClick 
}: { 
  activeSection: number;
  sectionLabels: string[];
  onSectionClick: (i: number) => void;
}) {
  const { camera } = useThree();
  const targetGroupRef = useRef<THREE.Group>(null!);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  
  // Create smooth interpolation targets for the object container
  const targetX = useMemo(() => TARGET_X_POSITIONS[activeSection] || 0, [activeSection]);
  const targetY = useMemo(() => TARGET_Y_POSITIONS[activeSection] || 0, [activeSection]);

  useFrame((state, delta) => {
    // Smoothly interpolate the entire group's X and Y position
    if (targetGroupRef.current) {
      targetGroupRef.current.position.x = THREE.MathUtils.damp(
        targetGroupRef.current.position.x,
        targetX,
        4,
        delta
      );
      targetGroupRef.current.position.y = THREE.MathUtils.damp(
        targetGroupRef.current.position.y,
        targetY + Math.sin(state.clock.elapsedTime) * 0.2, // Base target + slight hovering
        3,
        delta
      );

      // Subtle parallax effect based on global mouse hover
      targetGroupRef.current.rotation.x = THREE.MathUtils.damp(
        targetGroupRef.current.rotation.x,
        -mouseRef.current.y * 0.3, 
        3, 
        delta
      );
      targetGroupRef.current.rotation.y = THREE.MathUtils.damp(
        targetGroupRef.current.rotation.y,
        mouseRef.current.x * 0.3,
        3,
        delta
      );
    }
  });

  return (
    <group ref={targetGroupRef}>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
        <AiCore isActive={true} />
        
        {/* Section Orbits */}
        {sectionLabels.map((label, i) => (
          <SectionOrbit
            key={i}
            index={i}
            label={label}
            isActive={i === activeSection}
            radius={2 + (i % 2) * 0.5} // slightly offset radiuses
            speed={(i % 2 === 0 ? 0.2 : -0.15)} // different speeds/directions
            yOffset={(i - 1.5) * 0.4} // spread them vertically
            onClick={() => onSectionClick(i)}
          />
        ))}
      </Float>
    </group>
  );
}

/* ---------- Exported ---------- */
export default function AiBrainScene({
  activeSection,
  sectionLabels = [],
  onSectionClick,
}: {
  activeSection: number;
  sectionLabels?: string[];
  onSectionClick: (i: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#a78bfa" />
        <pointLight position={[-5, -3, 3]} intensity={1} color="#06b6d4" />
        
        <SceneController 
          activeSection={activeSection} 
          sectionLabels={sectionLabels}
          onSectionClick={onSectionClick}
        />
      </Canvas>
    </div>
  );
}


