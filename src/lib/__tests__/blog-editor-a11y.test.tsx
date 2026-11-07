import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";

/**
 * PHASE 337 — W1-3e (remediation plan §6.2, audit A-05): the blog
 * editor's keyword/tag chips were `<span onClick>` (Badge) — invisible to
 * the keyboard: not focusable, not deletable without a mouse, and the
 * two add buttons were icon-only with NO accessible name (WCAG 4.1.2).
 *
 * The A-05 gaps this canary pins as CLOSED:
 *   - every chip is a REAL `<button>` (Badge asChild): tab-focusable and
 *     natively Enter/Space-activatable — the browser's own button
 *     contract, not a re-implemented keydown listener;
 *   - each chip's accessible name carries the ACTION + the VALUE
 *     ("Remove keyword whey" / «إزالة الكلمة المفتاحية «whey»») so a
 *     screen reader hears WHICH chip it is about to delete;
 *   - both add buttons (keyword + tag) carry localized accessible names.
 *
 * Two layers, like the W1-3a..d canaries:
 *   1. SOURCE PINS — the chips ride real buttons (asChild + type="button"),
 *      no Badge carries onClick directly (the span-with-onClick disease is
 *      extinct), and the four label literals exist (add ×2 · remove ×2).
 *   2. BEHAVIOR — jsdom renders the REAL editor (mode="new") and drives
 *      the exact user flow: type → click the labeled add button → the
 *      chip IS a focusable <button> that deletes on click, in both
 *      languages. (Enter/Space activation is the browser's native button
 *      behavior — jsdom does not synthesize click from keys, so the
 *      element-type pin IS the keyboard-contract pin.)
 */

// F-2 Option A (AR-DISCOVERY-UI-SETTLE-AUDIT-2026-11-07, owner decision
// 2026-11-07): usePathname is a MUTABLE seam so the AR case mounts the
// provider the way a real /ar page does — urlLocale "ar" under an /ar
// path. The legacy localStorage ("mhe:lang") override is gone from the
// provider, so a saved preference no longer flips the language.
const navState = vi.hoisted(() => ({ pathname: null as string | null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => navState.pathname,
}));

// next/image would need the image loader — the cover preview renders
// through a plain img stub (canary precedent: evo-drawer/mobile-drawer).
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt?: string; src?: string }) =>
    createElement("img", { alt: alt ?? "", src }),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

// The canary's subject is the editor's chip a11y, not the admin API:
// the three network functions are stubbed at the seam (mode="new" never
// calls them anyway) while the pure SEO/word-count helpers stay REAL.
vi.mock("@/lib/blog-admin", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/lib/blog-admin")>();
  return {
    ...orig,
    adminGetPost: vi.fn(),
    adminCreatePost: vi.fn(),
    adminUpdatePost: vi.fn(),
  };
});

import { I18nProvider } from "@/lib/i18n";
import { BlogEditorView } from "@/components/views/BlogEditorView";

const repoRoot = resolve(__dirname, "../../..");
const editorSrc = () =>
  readFileSync(resolve(repoRoot, "src/components/views/BlogEditorView.tsx"), "utf8");

async function renderEditor(locale: "en" | "ar" = "en") {
  const rtl = await import("@testing-library/react");
  const view = rtl.render(
    // eslint-disable-next-line react/no-children-prop -- createElement needs children in props (test-only; repo precedent modal-a11y.test.tsx)
    createElement(I18nProvider, {
      urlLocale: locale,
      children: createElement(BlogEditorView, { mode: "new" }),
    })
  );
  return { view, fireEvent: rtl.fireEvent };
}

describe("W1-3e source pins — chips are real buttons, every control named", () => {
  it("both chip families ride REAL <button> via Badge asChild (type=button)", () => {
    const s = editorSrc();
    // The keywords chips (variant secondary) and the tags chips (outline)
    // both delegate to a native button through the Radix Slot.
    expect(s).toMatch(/<Badge key=\{i\} asChild variant="secondary"/);
    expect(s).toMatch(/<Badge key=\{i\} asChild variant="outline"/);
    expect(s.match(/<button\s*$/gm)?.length).toBeGreaterThanOrEqual(2);
    expect(s).toContain('type="button"');
  });

  it("the span-with-onClick disease is extinct — no Badge carries onClick directly", () => {
    const s = editorSrc();
    expect(s).not.toMatch(/<Badge[^>]*onClick/);
  });

  it("both add buttons carry localized accessible names", () => {
    const s = editorSrc();
    expect(s).toContain('aria-label={isAr ? "أضف كلمة مفتاحية" : "Add keyword"}');
    expect(s).toContain('aria-label={isAr ? "أضف وسمًا" : "Add tag"}');
  });

  it("every chip names its ACTION + VALUE — the remover labels, all four literals", () => {
    const s = editorSrc();
    expect(s).toContain("`Remove keyword ${k}`");
    expect(s).toContain("إزالة الكلمة المفتاحية «${k}»");
    expect(s).toContain("`Remove tag ${tag}`");
    expect(s).toContain("إزالة الوسم «${tag}»");
  });

  it("the pre-existing Enter-to-add input path must not regress", () => {
    const s = editorSrc();
    expect(s).toMatch(
      /onKeyDown=\{\(e\) => e\.key === "Enter" && \(e\.preventDefault\(\), addKeyword\(\)\)\}/
    );
    expect(s).toMatch(
      /onKeyDown=\{\(e\) => e\.key === "Enter" && \(e\.preventDefault\(\), addTag\(\)\)\}/
    );
  });
});

describe("W1-3e behavior — the real editor in jsdom (keyboard user flow)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    document.body.innerHTML = "";
    navState.pathname = null;
    // The mount-time job-recovery scan fetches /api/ai/jobs — stubbed to
    // an honest not-ok so the effect settles instantly (its catch is the
    // app's own best-effort contract).
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve(null) }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const keywordInput = (ar = false) =>
    document.body.querySelector<HTMLInputElement>(
      `input[placeholder="${ar ? "أضف كلمة..." : "Add keyword..."}"]`
    );
  const tagInput = (ar = false) =>
    document.body.querySelector<HTMLInputElement>(
      `input[placeholder="${ar ? "أضف وسم..." : "Add tag..."}"]`
    );
  const addKeywordBtn = () => document.body.querySelector('button[aria-label="Add keyword"]');
  const addTagBtn = () => document.body.querySelector('button[aria-label="Add tag"]');
  const keywordChip = (value: string) =>
    document.body.querySelector(`button[aria-label="Remove keyword ${value}"]`);
  const tagChip = (value: string) =>
    document.body.querySelector(`button[aria-label="Remove tag ${value}"]`);

  it("the labeled add button adds a chip that IS a focusable <button>", async () => {
    const { view, fireEvent } = await renderEditor();
    const add = addKeywordBtn();
    expect(add).not.toBeNull();

    fireEvent.change(keywordInput() as HTMLElement, { target: { value: "whey protein" } });
    fireEvent.click(add as HTMLElement);

    const chip = keywordChip("whey protein") as HTMLButtonElement;
    expect(chip).not.toBeNull();
    // THE A-05 pin: the chip is a real BUTTON element — the browser's own
    // focusable + Enter/Space-activatable contract (the old span was
    // neither), and it still carries the X icon inside the badge skin.
    expect(chip.tagName).toBe("BUTTON");
    expect(chip.querySelector("svg")).not.toBeNull();
    expect(chip.textContent).toContain("whey protein");
    // Focusable: a keyboard user can actually reach it.
    chip.focus();
    expect(document.activeElement).toBe(chip);
    view.unmount();
  });

  it("clicking (Enter/Space in a real browser) removes the chip — and only that one", async () => {
    const { view, fireEvent } = await renderEditor();
    fireEvent.change(keywordInput() as HTMLElement, { target: { value: "creatine" } });
    fireEvent.click(addKeywordBtn() as HTMLElement);
    fireEvent.change(keywordInput() as HTMLElement, { target: { value: "casein" } });
    fireEvent.click(addKeywordBtn() as HTMLElement);
    expect(keywordChip("creatine")).not.toBeNull();
    expect(keywordChip("casein")).not.toBeNull();

    // Remove the FIRST chip — the sibling survives (index-keyed filter).
    fireEvent.click(keywordChip("creatine") as HTMLElement);
    expect(keywordChip("creatine")).toBeNull();
    expect(keywordChip("casein")).not.toBeNull();
    view.unmount();
  });

  it("the tag twin: labeled add + named removable chip button (# visible)", async () => {
    const { view, fireEvent } = await renderEditor();
    fireEvent.change(tagInput() as HTMLElement, { target: { value: "nutrition" } });
    fireEvent.click(addTagBtn() as HTMLElement);

    const chip = tagChip("nutrition") as HTMLButtonElement;
    expect(chip).not.toBeNull();
    expect(chip.tagName).toBe("BUTTON");
    expect(chip.textContent).toContain("#nutrition");
    chip.focus();
    expect(document.activeElement).toBe(chip);
    fireEvent.click(chip);
    expect(tagChip("nutrition")).toBeNull();
    view.unmount();
  });

  it("Arabic: all four control names are localized (URL /ar)", async () => {
    // F-2-A: Arabic now renders the URL-correct way — urlLocale "ar"
    // under an /ar path (the saved-preference override is gone).
    navState.pathname = "/ar";
    const { view, fireEvent } = await renderEditor("ar");

    const addKw = document.body.querySelector('button[aria-label="أضف كلمة مفتاحية"]');
    const addTag = document.body.querySelector('button[aria-label="أضف وسمًا"]');
    expect(addKw).not.toBeNull();
    expect(addTag).not.toBeNull();

    fireEvent.change(keywordInput(true) as HTMLElement, { target: { value: "بروتين" } });
    fireEvent.click(addKw as HTMLElement);
    expect(
      document.body.querySelector('button[aria-label="إزالة الكلمة المفتاحية «بروتين»"]')
    ).not.toBeNull();

    fireEvent.change(tagInput(true) as HTMLElement, { target: { value: "تغذية" } });
    fireEvent.click(addTag as HTMLElement);
    expect(
      document.body.querySelector('button[aria-label="إزالة الوسم «تغذية»"]')
    ).not.toBeNull();
    view.unmount();
  });

  it("empty input: the labeled add button is a no-op (no phantom chips)", async () => {
    const { view, fireEvent } = await renderEditor();
    fireEvent.click(addKeywordBtn() as HTMLElement);
    expect(
      document.body.querySelector('button[aria-label^="Remove keyword"]')
    ).toBeNull();
    view.unmount();
  });
});
