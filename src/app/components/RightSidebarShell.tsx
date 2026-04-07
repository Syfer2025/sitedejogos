"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const SIDEBAR_EXPANDED_WIDTH = 320; // px
const SIDEBAR_COLLAPSED_WIDTH = 48; // thin rail
const HOVER_DELAY_MS = 250;
const LEAVE_DELAY_MS = 450;
const STORAGE_KEY = "rightSidebarCollapsed";

export function RightSidebarShell({ children }: { children: ReactNode }) {
  // Always start expanded (matches server render)
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  // Transitions disabled until after hydration + localStorage read
  const [ready, setReady] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // After hydration: read localStorage, apply state, then enable transitions
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setCollapsed(true);
      }
    } catch {
      // ignore
    }
    // Enable transitions after the state is applied (next frame)
    requestAnimationFrame(() => {
      setReady(true);
    });
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      setHovering(false);
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!collapsed) return;
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    hoverTimerRef.current = setTimeout(() => {
      setHovering(true);
    }, HOVER_DELAY_MS);
  }, [collapsed]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (!collapsed) return;
    leaveTimerRef.current = setTimeout(() => {
      setHovering(false);
    }, LEAVE_DELAY_MS);
  }, [collapsed]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const showContent = !collapsed || hovering;

  return (
    <div
      className={`rsb-shell hidden xl:block ${ready ? "" : "rsb-no-transition"}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
      }}
    >
      {/* ── The thin rail (always rendered, visible when collapsed) ── */}
      <div
        className={`rsb-rail ${collapsed && !hovering ? "rsb-rail--visible" : "rsb-rail--hidden"}`}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          className="rsb-rail-btn"
          aria-label="Expandir barra lateral"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8L10 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Visual indicator dots */}
        <div className="rsb-rail-dots">
          <span className="rsb-rail-dot" />
          <span className="rsb-rail-dot" />
          <span className="rsb-rail-dot" />
        </div>
      </div>

      {/* ── The full sidebar content panel ── */}
      <div
        className={`rsb-panel ${showContent ? "rsb-panel--open" : "rsb-panel--closed"} ${collapsed && hovering ? "rsb-panel--floating" : ""}`}
      >
        {/* Toggle button inside the content */}
        <div className="rsb-panel-toggle-bar">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rsb-panel-toggle"
            aria-label={collapsed ? "Fixar barra lateral" : "Recolher barra lateral"}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            >
              <path
                d="M6 3L11 8L6 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{collapsed ? "Fixar" : "Recolher"}</span>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
