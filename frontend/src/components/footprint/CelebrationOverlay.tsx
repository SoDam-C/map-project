'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  speedX: number;
  speedY: number;
  delay: number;
}

interface CelebrationOverlayProps {
  active: boolean;
  type: 'confetti' | 'milestone';
  message?: string;
  onComplete?: () => void;
}

const COLORS = ['#fbbf24', '#f87171', '#60a5fa', '#34d399', '#a78bfa', '#fb923c', '#f472b6'];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
    speedX: (Math.random() - 0.5) * 3,
    speedY: 2 + Math.random() * 3,
    delay: Math.random() * 0.5,
  }));
}

export function CelebrationOverlay({ active, type, message, onComplete }: CelebrationOverlayProps) {
  const [particles] = useState(() => generateParticles(type === 'milestone' ? 50 : 30));
  const [visible, setVisible] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      setMessageVisible(false);
      return;
    }
    setVisible(true);
    const msgTimer = setTimeout(() => setMessageVisible(true), 200);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setMessageVisible(false);
      onComplete?.();
    }, 2500);
    return () => {
      clearTimeout(msgTimer);
      clearTimeout(hideTimer);
    };
  }, [active, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.size > 7 ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
            opacity: 0,
            animation: `confetti-fall 2s ease-out ${p.delay}s forwards`,
            '--speed-x': `${p.speedX}px`,
            '--speed-y': `${p.speedY * 100}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Message */}
      {messageVisible && message && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center animate-bounce">
          <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/10">
            <div className="text-lg font-bold text-white whitespace-nowrap">{message}</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: rotate(0deg) translate(0, 0);
          }
          100% {
            opacity: 0;
            transform: rotate(${360 + Math.random() * 360}deg) translate(var(--speed-x), var(--speed-y));
          }
        }
      `}</style>
    </div>
  );
}

/** Hook to detect newly lit adcodes */
export function useNewlyLitAdcodes(footprints: Record<string, unknown>): Set<string> {
  const prevRef = useState<Set<string>>(() => new Set(Object.keys(footprints)))[0];

  return useMemo(() => {
    const current = new Set(Object.keys(footprints));
    const diff = new Set<string>();
    for (const code of current) {
      if (!prevRef.has(code)) diff.add(code);
    }
    // Update ref for next comparison
    prevRef.clear();
    for (const code of current) prevRef.add(code);
    return diff;
  }, [footprints, prevRef]);
}

const MILESTONES = [1, 5, 10, 20, 34];

/** Check if newly lit adcodes trigger a milestone */
export function checkMilestone(newAdcodes: Set<string>, totalProvinces: number): { isMilestone: boolean; count: number } | null {
  // Check if any new adcode is a province (ends with 0000)
  const hasNewProvince = [...newAdcodes].some(a => a.endsWith('0000'));
  if (!hasNewProvince) return null;

  if (MILESTONES.includes(totalProvinces)) {
    return { isMilestone: true, count: totalProvinces };
  }
  return null;
}
