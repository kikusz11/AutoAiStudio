"use client";

import { Canvas } from "@react-three/fiber";

export default function TestScene() {
  return (
    <div style={{ width: "100vw", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 0 }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="purple" />
        </mesh>
      </Canvas>
    </div>
  );
}
