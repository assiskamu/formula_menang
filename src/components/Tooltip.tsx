import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDashboard } from "../data/dashboard";

type TooltipProps = {
  label: string;
  maksud: string;
  formula?: string;
  contoh?: string;
  className?: string;
};

const mobileQuery = "(max-width: 767px)";

const useMobile = () => {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.matchMedia(mobileQuery).matches : false));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const matcher = window.matchMedia(mobileQuery);
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(matcher.matches);
    matcher.addEventListener("change", onChange);
    return () => matcher.removeEventListener("change", onChange);
  }, []);

  return isMobile;
};

const Tooltip = ({ label, maksud, formula, contoh, className = "" }: TooltipProps) => {
  const { dashboardMode } = useDashboard();
  const isBeginner = dashboardMode === "beginner";
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useMobile();

  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("touchstart", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("touchstart", onClickOutside);
    };
  }, [open]);

  const overlay = useMemo(() => {
    if (!open || typeof document === "undefined") return null;

    if (isMobile) {
      return createPortal(
        <div className="info-mobile-backdrop" role="presentation">
          <div ref={panelRef} className="info-mobile-panel" role="dialog" aria-modal="true" aria-label={label}>
            <div className="info-overlay-header">
              <strong>{label}</strong>
              <button type="button" className="info-overlay-close" onClick={() => setOpen(false)}>Tutup</button>
            </div>
            <p><strong>Maksud:</strong> {maksud}</p>
            {isBeginner ? null : formula ? <p><strong>Formula:</strong> {formula}</p> : null}
            {contoh ? <p><strong>Contoh:</strong> {contoh}</p> : null}
          </div>
        </div>,
        document.body,
      );
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    const top = (rect?.bottom ?? 0) + window.scrollY + 8;
    const left = (rect?.left ?? 0) + window.scrollX;

    return createPortal(
      <div ref={panelRef} className="info-overlay-content" role="tooltip" style={{ top, left }}>
        <p><strong>{label}</strong></p>
        <p><strong>Maksud:</strong> {maksud}</p>
        {isBeginner ? null : formula ? <p><strong>Formula:</strong> {formula}</p> : null}
        {contoh ? <p><strong>Contoh:</strong> {contoh}</p> : null}
      </div>,
      document.body,
    );
  }, [contoh, formula, isBeginner, isMobile, label, maksud, open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`info-tooltip ${className}`.trim()}
        aria-label={`Info: ${label}`}
        aria-expanded={open}
        onMouseEnter={() => !isMobile && setOpen(true)}
        onMouseLeave={() => !isMobile && setOpen(false)}
        onFocus={() => !isMobile && setOpen(true)}
        onBlur={() => !isMobile && setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
      >
        i
      </button>
      {overlay}
    </>
  );
};

export default Tooltip;
