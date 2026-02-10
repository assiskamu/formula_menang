import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import InfoTooltip from "./InfoTooltip";

describe("InfoTooltip smoke test", () => {
  it("renders without runtime errors and keeps trigger focusable", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => renderToString(
      <InfoTooltip
        label="Smoke"
        maksud="Menguji tooltip"
        formula="A + B"
        contoh="1 + 2"
      />,
    )).not.toThrow();

    const html = renderToString(
      <InfoTooltip
        label="Smoke"
        maksud="Menguji tooltip"
        formula="A + B"
        contoh="1 + 2"
      />,
    );

    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
    expect(html).toContain("title=\"");
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
