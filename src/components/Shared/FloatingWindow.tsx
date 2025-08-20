import React, { useEffect, useRef, useState } from 'react';

type FloatingWindowProps = {
  title?: string;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
};

export const FloatingWindow = ({
  title = 'Preview',
  initialX = 32,
  initialY = 32,
  initialWidth = 520,
  initialHeight = 360,
  onClose,
  children,
  className = '',
}: FloatingWindowProps) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ w: initialWidth, h: initialHeight });
  const draggingRef = useRef(false);
  const resizingRef = useRef(false);
  const offsetRef = useRef({ dx: 0, dy: 0 });
  const startSizeRef = useRef({ w: initialWidth, h: initialHeight });
  const startPosRef = useRef({ x: initialX, y: initialY });

  // Drag handlers (header)
  const onHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    offsetRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Resize handlers (corner)
  const onResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    resizingRef.current = true;
    startSizeRef.current = { w: size.w, h: size.h };
    startPosRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (draggingRef.current) {
        const nextX = e.clientX - offsetRef.current.dx;
        const nextY = e.clientY - offsetRef.current.dy;
        setPos({ x: Math.max(8, nextX), y: Math.max(8, nextY) });
      } else if (resizingRef.current) {
        const dx = e.clientX - startPosRef.current.x;
        const dy = e.clientY - startPosRef.current.y;
        const w = Math.max(320, startSizeRef.current.w + dx);
        const h = Math.max(240, startSizeRef.current.h + dy);
        setSize({ w, h });
      }
    };

    const handleUp = () => {
      draggingRef.current = false;
      resizingRef.current = false;
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [pos.x, pos.y, size.w, size.h]);

  return (
    <div
      className={[
        'fixed z-50 rounded-2xl shadow-2xl border border-neutral-800 bg-neutral-950/95 backdrop-blur',
        'flex flex-col overflow-hidden',
        className,
      ].join(' ')}
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      role="dialog"
      aria-modal="false"
    >
      <div
        className="cursor-grab active:cursor-grabbing select-none px-3 py-2 bg-neutral-900 flex items-center justify-between"
        onPointerDown={onHeaderPointerDown}
      >
        <span className="text-sm font-bold text-white/90">{title}</span>
        <button
          onClick={onClose}
          // prevent the header's onPointerDown from initiating a drag when clicking close
          onPointerDown={(e) => e.stopPropagation()}
          className="text-white/70 hover:text-white hover:cursor-pointer font-semibold px-2 py-1 rounded-md hover:bg-white/10"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 min-h-0">{children}</div>

      {/* resize handle */}
      <div
        className="absolute right-1.5 bottom-1.5 w-4 h-4 cursor-nwse-resize"
        onPointerDown={onResizePointerDown}
      >
        {/* simple corner glyph */}
        <svg width="18" height="18" viewBox="0 0 18 18" className="opacity-80">
          <path d="M6 10h6v2H6v-2zm0-4h10v2H6V6z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
