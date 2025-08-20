import React, { useEffect, useMemo, useRef, useState } from "react";

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

const EDGE_PAD = 8;        // min gap to viewport edges
const HEADER_H = 40;       // approx header height to keep X visible
const MIN_W = 260;
const MIN_H = 200;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const FloatingWindow = ({
  title = "Preview",
  initialX = 32,
  initialY = 32,
  initialWidth = 520,
  initialHeight = 360,
  onClose,
  children,
  className = "",
}: FloatingWindowProps) => {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  // Compute mobile-safe initial size once (SSR friendly)
  const safeInitial = useMemo(() => {
    // Fit within 92vw x 80vh on small screens; else use provided defaults
    const maxW = Math.max(EDGE_PAD, vw - EDGE_PAD * 2);
    const maxH = Math.max(EDGE_PAD + HEADER_H, vh - EDGE_PAD * 2);

    const targetW =
      vw <= 640 ? Math.min(Math.floor(vw * 0.92), maxW) : Math.min(initialWidth, maxW);
    const targetH =
      vh <= 800 ? Math.min(Math.floor(vh * 0.80), maxH) : Math.min(initialHeight, maxH);

    const w = clamp(targetW, MIN_W, maxW);
    const h = clamp(targetH, MIN_H, maxH);

    const x = clamp(initialX, EDGE_PAD, Math.max(EDGE_PAD, vw - w - EDGE_PAD));
    const y = clamp(initialY, EDGE_PAD, Math.max(EDGE_PAD, vh - h - EDGE_PAD));
    return { x, y, w, h };
  }, [vw, vh, initialX, initialY, initialWidth, initialHeight]);

  const [pos, setPos] = useState({ x: safeInitial.x, y: safeInitial.y });
  const [size, setSize] = useState({ w: safeInitial.w, h: safeInitial.h });

  const draggingRef = useRef(false);
  const resizingRef = useRef(false);
  const offsetRef = useRef({ dx: 0, dy: 0 });
  const startSizeRef = useRef({ w: safeInitial.w, h: safeInitial.h });
  const startPosRef = useRef({ x: safeInitial.x, y: safeInitial.y });

  // Keep the window in-bounds on viewport resize/rotation
  useEffect(() => {
    const onResize = () => {
      const newVw = window.innerWidth;
      const newVh = window.innerHeight;
      const maxW = Math.max(EDGE_PAD, newVw - EDGE_PAD * 2);
      const maxH = Math.max(EDGE_PAD + HEADER_H, newVh - EDGE_PAD * 2);

      const w = clamp(size.w, MIN_W, maxW);
      const h = clamp(size.h, MIN_H, maxH);
      const x = clamp(pos.x, EDGE_PAD, Math.max(EDGE_PAD, newVw - w - EDGE_PAD));
      const y = clamp(pos.y, EDGE_PAD, Math.max(EDGE_PAD, newVh - h - EDGE_PAD));
      setSize({ w, h });
      setPos({ x, y });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.x, pos.y, size.w, size.h]);

  // Drag handlers (header)
  const onHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    offsetRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Resize handlers (corner)
  const onResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    resizingRef.current = true;
    startSizeRef.current = { w: size.w, h: size.h };
    startPosRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const newVw = window.innerWidth;
      const newVh = window.innerHeight;
      const maxW = Math.max(EDGE_PAD, newVw - EDGE_PAD * 2);
      const maxH = Math.max(EDGE_PAD + HEADER_H, newVh - EDGE_PAD * 2);

      if (draggingRef.current) {
        const nextX = clamp(e.clientX - offsetRef.current.dx, EDGE_PAD, Math.max(EDGE_PAD, newVw - size.w - EDGE_PAD));
        const nextY = clamp(e.clientY - offsetRef.current.dy, EDGE_PAD, Math.max(EDGE_PAD, newVh - size.h - EDGE_PAD));
        setPos({ x: nextX, y: nextY });
      } else if (resizingRef.current) {
        const dx = e.clientX - startPosRef.current.x;
        const dy = e.clientY - startPosRef.current.y;
        const w = clamp(startSizeRef.current.w + dx, MIN_W, maxW);
        const h = clamp(startSizeRef.current.h + dy, MIN_H, maxH);
        setSize({ w, h });
        // Also clamp position in case size changed while near edges
        const x = clamp(pos.x, EDGE_PAD, Math.max(EDGE_PAD, newVw - w - EDGE_PAD));
        const y = clamp(pos.y, EDGE_PAD, Math.max(EDGE_PAD, newVh - h - EDGE_PAD));
        setPos({ x, y });
      }
    };

    const handleUp = () => {
      draggingRef.current = false;
      resizingRef.current = false;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [pos.x, pos.y, size.w, size.h]);

  return (
    <div
      className={[
        "fixed z-50 rounded-2xl shadow-2xl border border-neutral-800 bg-neutral-950/95 backdrop-blur",
        "flex flex-col overflow-hidden",
        className,
      ].join(" ")}
      // Hard max against viewport to prevent oversizing even if styles change
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        maxWidth: "96vw",
        maxHeight: "85vh",
      }}
      role="dialog"
      aria-modal="false"
    >
      <div
        className="cursor-grab active:cursor-grabbing select-none px-3 py-2 bg-neutral-900 flex items-center justify-between"
        onPointerDown={onHeaderPointerDown}
      >
        <span className="text-sm font-bold text-white/90">{title}</span>
        <button
          type="button"
          onClick={onClose}
          onPointerDown={(e) => e.stopPropagation()} // avoid starting a drag when tapping ✕
          className="text-white/80 hover:text-white hover:cursor-pointer font-semibold px-2 py-1 rounded-md hover:bg-white/10"
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
        <svg width="18" height="18" viewBox="0 0 18 18" className="opacity-80">
          <path d="M6 10h6v2H6v-2zm0-4h10v2H6V6z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
};
