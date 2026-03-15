"use client";

import { useState, useEffect } from "react";

export default function TestPage() {
  const [mounted, setMounted] = useState(false);
  const [canvasExists, setCanvasExists] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadR3F = async () => {
      try {
        const { Canvas } = await import("@react-three/fiber");
        setCanvasExists(true);
        console.log("R3F Canvas imported successfully:", Canvas);
      } catch (e) {
        setError(String(e));
        console.error("R3F import failed:", e);
      }
    };
    loadR3F();
  }, [mounted]);

  return (
    <div style={{ padding: 40, color: "white", background: "#111" }}>
      <h1>R3F Test Page</h1>
      <p>Mounted: {String(mounted)}</p>
      <p>R3F Canvas import: {canvasExists ? "SUCCESS" : "PENDING"}</p>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {mounted && canvasExists && (
        <div id="canvas-container" style={{ width: 400, height: 300, border: "1px solid purple" }}>
          <R3FCanvas />
        </div>
      )}
    </div>
  );
}

function R3FCanvas() {
  const [Comp, setComp] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("@react-three/fiber").then(({ Canvas }) => {
      const C = () => (
        <Canvas>
          <ambientLight />
          <mesh>
            <boxGeometry />
            <meshStandardMaterial color="hotpink" />
          </mesh>
        </Canvas>
      );
      setComp(() => C);
    });
  }, []);

  if (!Comp) return <p style={{ color: "yellow" }}>Loading R3F...</p>;
  return <Comp />;
}
