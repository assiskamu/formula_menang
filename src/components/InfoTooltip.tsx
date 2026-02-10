import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  label: string;
  maksud: string;
  formula: string;
  contoh: string;
  className?: string;
};

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_MEDIA_QUERY).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return isMobile;
};

const getNativeTitle = ({ label, maksud, formula, contoh }: Omit<Props, "className">) => (
  `${label}\n${maksud}\nFormula: ${formula}\nContoh: ${contoh}`
);

const InfoTooltip = ({ label, maksud, formula, contoh, className = "" }: Props) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const isMobile = useIsMobile();
  const nativeTitle = getNativeTitle({ label, maksud, formula, contoh });

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const overlay = useMemo(() => {
    if (!open) return null;

    if (isMobile) {
      return createPortal(
        <div className="info-mobile-backdrop" onClick={() => setOpen(false)}>
          <div className="info-mobile-panel" role="dialog" aria-modal="true" aria-label={label} onClick={(event) => event.stopPropagation()}>
            <div className="info-overlay-header">
              <strong>{label}</strong>
              <button type="button" className="info-overlay-close" onClick={() => setOpen(false)}>Tutup</button>
            </div>
            <p><strong>Maksud:</strong> {maksud}</p>
            <p><strong>Formula:</strong> {formula}</p>
            <p><strong>Contoh:</strong> {contoh}</p>
          </div>
        </div>,
        document.body,
      );
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    const top = (rect?.bottom ?? 0) + window.scrollY + 8;
    const left = (rect?.left ?? 0) + window.scrollX;

    return createPortal(
      <div className="info-overlay-content" role="tooltip" style={{ top, left }}>
        <p><strong>{label}</strong></p>
        <p><strong>Maksud:</strong> {maksud}</p>
        <p><strong>Formula:</strong> {formula}</p>
        <p><strong>Contoh:</strong> {contoh}</p>
      </div>,
      document.body,
    );
  }, [contoh, formula, isMobile, label, maksud, open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`info-tooltip ${className}`.trim()}
        aria-label={`Info ${label}`}
        aria-expanded={open}
        title={nativeTitle}
        onMouseEnter={() => !isMobile && setOpen(true)}
        onMouseLeave={() => !isMobile && setOpen(false)}
        onFocus={() => !isMobile && setOpen(true)}
        onBlur={() => !isMobile && setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
      >
        ⓘ
      </button>
      {overlay}
    </>
  );
};

export default InfoTooltip;
