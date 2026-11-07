import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement, useState, type Context as ReactContext } from "react";

/**
 * PHASE 335 — W1-3c (remediation plan §6.2, audit A-01): the EVO drawer —
 * the AI chat surface on EVERY page — is a REAL modal dialog on the Radix
 * primitives (`@radix-ui/react-dialog`, the same engine the W1-3a `<Modal>`
 * wrapper rides).
 *
 * The A-01 gaps this canary pins as CLOSED:
 *   - the drawer was an unlabeled `<aside>` (no role="dialog"/aria-modal) —
 *     it now renders role=dialog with a named Title (aria-labelledby);
 *   - Escape did nothing — it now funnels through ONE onOpenChange(false);
 *   - focus escaped to the page behind the drawer and never returned —
 *     Radix traps focus inside and restores it to the trigger bubble (the
 *     bubble stays mounted while open precisely to be that restore target);
 *   - the SSE token stream was never announced — the messages area is now
 *     role="log" (live region).
 *
 * Two layers, like the W1-3a/b modal canary:
 *   1. SOURCE PINS — the widget composes the Radix primitives (no hand-rolled
 *      overlay survives), a SINGLE dismissal funnel calls closeChat (so the
 *      back-button sentinel's history back can never double-fire), the
 *      trigger is always mounted, the log container carries role=log, and
 *      the Title names the dialog.
 *   2. BEHAVIOR — jsdom renders the REAL widget. The chat context is mocked
 *      at the hook seam with a React-context harness: the mocked useEvoChat
 *      reads a context this file provides, so the harness owns isOpen with
 *      plain useState (React-legal — no external mutable state) and
 *      openChat/closeChat route through the test spies before flipping it.
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

// next/image would need the image loader — the avatar renders through a
// plain img stub (the seo-image-dimensions canary owns the real <ThemeImg>
// width/height contract at the source level).
vi.mock("@/components/ThemeImg", () => ({
  ThemeImg: ({ alt }: { alt?: string }) =>
    createElement("img", { alt: alt ?? "" }),
}));

// Web Speech API is absent in jsdom (the real button self-nulls when
// unsupported); mocked null to keep the composer row deterministic.
vi.mock("@/components/VoiceMicButton", () => ({
  VoiceMicButton: () => null,
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    profile: null,
    loading: false,
    isCoach: false,
    isAdmin: false,
    coachKind: null,
    isSiteCoach: false,
    isB2BCoach: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInGoogle: vi.fn(),
    signOutAsync: vi.fn(),
  }),
}));

// The chat CONTEXT is mocked at the hook seam: useEvoChat reads a harness
// context (created here, exported as __DrawerHarnessContext for this file
// to provide). The canary's subject is the DRAWER's a11y contract, not the
// context logic (quota/streaming/persistence have their own coverage).
vi.mock("@/lib/evo-chat-context", async () => {
  const React = await import("react");
  type EvoDrawerCtx = {
    isOpen: boolean;
    isTyping: boolean;
    messages: Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      timestamp: number;
    }>;
    dailyCount: number;
    dailyLimit: number | null;
    dailyLimitReached: boolean;
    isPaidTier: boolean;
    quota: unknown;
    refreshQuota: () => void;
    openChat: () => void;
    closeChat: () => void;
    toggleChat: () => void;
    sendMessage: (content: string) => Promise<void>;
  };
  const DrawerHarnessContext = React.createContext<EvoDrawerCtx | null>(null);
  return {
    useEvoChat: () => {
      const ctx = React.useContext(DrawerHarnessContext);
      if (!ctx) throw new Error("evo-drawer-a11y: harness context missing");
      return ctx;
    },
    __DrawerHarnessContext: DrawerHarnessContext,
  };
});

import { I18nProvider } from "@/lib/i18n";
import { EvoFloatingWidget } from "@/components/EvoFloatingWidget";

const repoRoot = resolve(__dirname, "../../..");
const widgetSrc = () =>
  readFileSync(resolve(repoRoot, "src/components/EvoFloatingWidget.tsx"), "utf8");

type HarnessProps = {
  initialOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  messages?: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }>;
};

const SEED_MESSAGES: HarnessProps["messages"] = [
  { id: "m1", role: "user", content: "How many calories in chicken breast?", timestamp: 1 },
  { id: "m2", role: "assistant", content: "A 100g portion has about 165 kcal.", timestamp: 2 },
];

/** Stateful harness — owns isOpen with plain useState and provides it to
 * the mocked useEvoChat through the harness context; openChat/closeChat
 * route through the test spies before flipping the state (exactly the
 * contract the real context exposes). */
function makeHarness(DrawerCtx: ReactContext<unknown>) {
  return function Harness({ initialOpen = false, onOpen, onClose, messages }: HarnessProps) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const ctx = {
      isOpen,
      isTyping: false,
      messages: messages ?? SEED_MESSAGES,
      dailyCount: 0,
      dailyLimit: 10,
      dailyLimitReached: false,
      isPaidTier: false,
      quota: null,
      refreshQuota: () => {},
      openChat: () => {
        onOpen?.();
        setIsOpen(true);
      },
      closeChat: () => {
        onClose?.();
        setIsOpen(false);
      },
      toggleChat: () => setIsOpen((v) => !v),
      sendMessage: () => {},
    };
    return createElement(
      DrawerCtx.Provider as ReactContext<unknown>,
      { value: ctx },
      createElement(EvoFloatingWidget)
    );
  };
}

async function renderWidget(props: HarnessProps = {}, locale: "en" | "ar" = "en") {
  const rtl = await import("@testing-library/react");
  const mocked = (await import("@/lib/evo-chat-context")) as unknown as {
    __DrawerHarnessContext: ReactContext<unknown>;
  };
  const Harness = makeHarness(mocked.__DrawerHarnessContext);
  return {
    view: rtl.render(
      // eslint-disable-next-line react/no-children-prop -- createElement needs children in props (test-only; repo precedent modal-a11y.test.tsx)
      createElement(I18nProvider, {
        urlLocale: locale,
        children: createElement(Harness, props),
      })
    ),
    // fireEvent is act-wrapped: dispatching raw events would leave the
    // harness's controlled state updates unflushed (the modal-a11y canary
    // could assert right after a raw dispatch because its onOpenChange
    // was a bare spy — this harness actually re-renders).
    fireEvent: rtl.fireEvent,
  };
}

const dialogEl = () => document.body.querySelector('[role="dialog"]');
const triggerEl = () =>
  document.body.querySelector('button[aria-label="Open EVO chat"]');

describe("W1-3c source pins — the drawer is a Radix dialog, funneled and live", () => {
  it("composes the @radix-ui/react-dialog primitives (not a fresh hand-rolled overlay)", () => {
    const s = widgetSrc();
    expect(s).toContain('from "@radix-ui/react-dialog"');
    for (const part of [
      "DialogPrimitive.Root",
      "DialogPrimitive.Trigger",
      "DialogPrimitive.Portal",
      "DialogPrimitive.Overlay",
      "DialogPrimitive.Content",
      "DialogPrimitive.Title",
      "DialogPrimitive.Close",
    ]) {
      expect(s).toContain(`<${part}`);
    }
  });

  it("the old hand-rolled backdrop is extinct — the dim div IS the Radix overlay", () => {
    const s = widgetSrc();
    // The one dark backdrop, now a Radix overlay (portal-rendered, part of
    // the dialog's dismissal contract). No bare <div> overlay survives.
    expect(s).toMatch(
      /<DialogPrimitive\.Overlay[^>]*className="fixed inset-0 z-50 bg-black\/20"/
    );
    expect(s).not.toMatch(/<div[^>]*fixed inset-0/);
    // ...and the backdrop no longer closes through its own onClick.
    expect(s).not.toContain("onClick={closeChat}");
  });

  it("a SINGLE dismissal funnel — closeChat()/openChat() each have exactly one call site", () => {
    const s = widgetSrc();
    // Escape · overlay click · the X button all land in onOpenChange; the
    // funnel is what keeps the back-button sentinel's history back from
    // ever double-firing (the old backdrop + close button were two paths).
    expect((s.match(/closeChat\(\)/g) ?? []).length).toBe(1);
    expect((s.match(/openChat\(\)/g) ?? []).length).toBe(1);
    expect(s).toMatch(/onOpenChange=\{handleDrawerOpenChange\}/);
  });

  it("the messages area is a live region — role=log + explicit aria-live", () => {
    const s = widgetSrc();
    expect(s).toContain('role="log"');
    expect(s).toContain('aria-live="polite"');
  });

  it("the drawer is NAMED — the visible EVO header is the DialogTitle (aria-labelledby wiring)", () => {
    const s = widgetSrc();
    expect(s).toMatch(/<DialogPrimitive\.Title[^>]*>\s*\n?\s*EVO\s*\n?\s*<\/DialogPrimitive\.Title>/);
    // No description is used — the suppression is explicit, not accidental
    // (Radix warns on a description-less Content without this).
    expect(s).toMatch(/<DialogPrimitive\.Content asChild aria-describedby=\{undefined\}>/);
  });

  it("the trigger bubble is ALWAYS mounted — the focus-restore target cannot unmount", () => {
    const s = widgetSrc();
    // The old conditional unmount ({!isOpen && …}) is what made focus
    // restore impossible: Radix returns focus to the trigger node, and an
    // unmounted node cannot receive it.
    expect(s).not.toContain("!isOpen && (");
  });
});

describe("W1-3c behavior — the real widget in jsdom", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.body.innerHTML = "";
    navState.pathname = null;
  });

  it("renders role=dialog with the EVO title wired via aria-labelledby", async () => {
    const { view } = await renderWidget({ initialOpen: true });
    const dialog = dialogEl();
    expect(dialog).not.toBeNull();
    const labelledBy = dialog?.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy as string)?.textContent).toBe("EVO");
    // The drawer is still the slide-in <aside> it always was.
    expect(dialog?.tagName.toLowerCase()).toBe("aside");
    view.unmount();
  });

  it("the transcript is a role=log region carrying the messages", async () => {
    const { view } = await renderWidget({ initialOpen: true });
    const log = dialogEl()?.querySelector('[role="log"]');
    expect(log).not.toBeNull();
    expect(log?.getAttribute("aria-live")).toBe("polite");
    expect(log?.textContent).toContain("How many calories in chicken breast?");
    expect(log?.textContent).toContain("165 kcal");
    view.unmount();
  });

  it("Escape closes through the single funnel — once", async () => {
    const onClose = vi.fn();
    const { view, fireEvent } = await renderWidget({ initialOpen: true, onClose });
    expect(dialogEl()).not.toBeNull();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    // The controlled root unmounted the portal with it.
    expect(dialogEl()).toBeNull();
    view.unmount();
  });

  it("the X button rides DialogClose — one funnel call, dialog gone", async () => {
    const onClose = vi.fn();
    const { view, fireEvent } = await renderWidget({ initialOpen: true, onClose });
    const close = dialogEl()?.querySelector('button[aria-label="Close"]');
    expect(close).not.toBeNull();
    fireEvent.click(close as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialogEl()).toBeNull();
    view.unmount();
  });

  it("the trigger bubble: aria-haspopup=dialog and aria-expanded flips on open", async () => {
    const onOpen = vi.fn();
    const { view, fireEvent } = await renderWidget({ onOpen });
    const trigger = triggerEl();
    expect(trigger).not.toBeNull();
    expect(trigger?.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger as HTMLElement);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    expect(dialogEl()).not.toBeNull();
    view.unmount();
  });

  it("focus lands INSIDE the dialog on open (FocusScope arms the trap)", async () => {
    const { view } = await renderWidget({ initialOpen: true });
    const dialog = dialogEl();
    expect(
      dialog === document.activeElement || dialog?.contains(document.activeElement)
    ).toBe(true);
    view.unmount();
  });

  it("focus RESTORES to the trigger bubble after Escape-close — the exact A-01 gap", async () => {
    const { view, fireEvent } = await renderWidget({ initialOpen: true });
    const dialog = dialogEl();
    expect(dialog).not.toBeNull();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(dialogEl()).toBeNull();
    // Radix restores focus in a post-unmount task (a setTimeout(0) inside
    // FocusScope's cleanup) — waitFor crosses that timer boundary.
    const { waitFor } = await import("@testing-library/react");
    await waitFor(() => expect(document.activeElement).toBe(triggerEl()));
    view.unmount();
  });

  it("modal isolation — the outside world is aria-hidden while the drawer is open", async () => {
    const { view } = await renderWidget({ initialOpen: true });
    expect(dialogEl()).not.toBeNull();
    // Radix 1.1.x implements modal-ness by aria-hiding everything outside
    // the dialog (hideOthers — its documented "better supported equivalent"
    // of a literal aria-modal): pin the sibling-hide, not the attribute.
    expect(view.container.getAttribute("aria-hidden")).toBe("true");
    view.unmount();
    // …and the hide is undone when the drawer closes.
    expect(view.container.getAttribute("aria-hidden")).toBeNull();
  });

  it("the close button's accessible name is localized (EN then AR)", async () => {
    const en = await renderWidget({ initialOpen: true });
    expect(
      dialogEl()?.querySelector('button[aria-label="Close"]')
    ).not.toBeNull();
    en.view.unmount();

    // F-2-A: Arabic now renders the URL-correct way — urlLocale "ar"
    // under an /ar path (the saved-preference override is gone).
    navState.pathname = "/ar";
    const ar = await renderWidget({ initialOpen: true }, "ar");
    expect(
      dialogEl()?.querySelector('button[aria-label="إغلاق"]')
    ).not.toBeNull();
    ar.view.unmount();
  });
});
