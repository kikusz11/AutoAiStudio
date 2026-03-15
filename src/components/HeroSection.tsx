"use client";

interface OverlayProps {
  onNavigate: (index: number) => void;
}

export function HeroOverlay({ onNavigate }: OverlayProps) {
  return (
    <div className="h-full w-full pointer-events-none" />
  );
}

