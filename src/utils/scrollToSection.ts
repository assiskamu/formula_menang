export const scrollToSection = (sectionId: string, focusSelector?: string) => {
  if (typeof window === "undefined") return;

  const target = document.getElementById(sectionId);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!focusSelector) return;

  window.setTimeout(() => {
    const focusTarget = document.querySelector<HTMLElement>(focusSelector);
    focusTarget?.focus();
  }, 320);
};
