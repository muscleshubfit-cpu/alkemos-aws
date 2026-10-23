"use client"

/**
 * PHASE 333 — W1-3a (remediation plan docs/FULL-STACK-AUDIT-AND-REMEDIATION-
 * PLAN-2026-10-02.md §6.2): the unified accessible `<Modal>` wrapper over the
 * EXISTING Radix primitives in `src/components/ui/dialog.tsx`.
 *
 * WHY (audit A-03): the three hand-rolled overlays (PlansView · ReferralView ·
 * CoachClientView) ship none of the dialog semantics — no role="dialog" /
 * aria-modal, no Escape, no focus trap, no focus restore, and (PlansView) a
 * literally-empty close button. Radix already ships ALL of that (ProgressView
 * proves the pattern in-repo), so the fix is ONE wrapper every surface can
 * adopt. This file makes the accessible path the easy path:
 *
 *   1. `title` is REQUIRED — a Modal without an accessible name does not
 *      compile. Radix wires it through DialogTitle → aria-labelledby.
 *   2. The close button ALWAYS carries the X icon + a localized aria-label
 *      (i18n `common.close` — Close / إغلاق). The stock DialogContent button
 *      is disabled here (`showCloseButton={false}`) because its sr-only name
 *      is hardcoded English.
 *   3. RTL-correct from day one: logical properties only (`end-*` / `text-start`
 *      / `pe-*`). The A-11 sweep of LEGACY physical properties is W3-2's
 *      frame — this file adds nothing to that debt.
 *
 * ADOPTION MAP (W1-3b — the NEXT frame, NOT this one):
 *   - PlansView plan overlay      → size="lg" + scroll + actions (print/download)
 *   - ReferralView payout modal   → size="sm" + description
 *   - CoachClientView plan editor → size="lg" + scroll + actions + editable
 *                                    title node (W1-3b decides the exact shape)
 * This frame is infrastructure only — no view is migrated here (plan law:
 * one row = one frame = one commit).
 */

import * as React from "react"
import { XIcon } from "lucide-react"

import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"

type ModalSize = "sm" | "md" | "lg"

/** Width presets — mapped onto the stock DialogContent classes
 *  (tailwind-merge dedupes the `sm:max-w-*` pair, so the preset
 *  cleanly overrides the `sm:max-w-lg` default). */
const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "sm:max-w-md", // compact forms (e.g. the payout modal)
  md: "", // stock DialogContent default (sm:max-w-lg)
  lg: "sm:max-w-2xl", // plan viewers / editors (the 85vh-scroll surfaces)
}

export interface ModalProps {
  /** Controlled open state (Radix Dialog root). */
  open: boolean
  /** Controlled open-state change — Escape / overlay click / close all land here. */
  onOpenChange: (open: boolean) => void
  /**
   * REQUIRED accessible name — rendered inside Radix DialogTitle, which the
   * Content wires via aria-labelledby. A string in the simple case; a node for
   * editable headers (e.g. an inline Input — W1-3b's CoachClientView case).
   */
  title: React.ReactNode
  /** Optional subtitle — Radix DialogDescription (aria-describedby wiring). */
  description?: React.ReactNode
  /** Optional leading header icon (rendered shrink-0 before the title). */
  icon?: React.ReactNode
  /** Optional header action cluster (print/download/regenerate buttons). */
  actions?: React.ReactNode
  /** Optional footer cluster — rendered inside Radix DialogFooter. */
  footer?: React.ReactNode
  /** Width preset. Defaults to "md" (stock sm:max-w-lg). */
  size?: ModalSize
  /** Scroll the body region (long plan content) — max-h + overflow-y-auto. */
  scroll?: boolean
  /** Render the labeled close button. Defaults to true. */
  showClose?: boolean
  /** Escape hatch for adoption-specific content tweaks (W1-3b). */
  contentClassName?: string
  /** Modal body. */
  children: React.ReactNode
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  actions,
  footer,
  size = "md",
  scroll = false,
  showClose = true,
  contentClassName,
  children,
}: ModalProps) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(SIZE_CLASSES[size], contentClassName)}
      >
        {/* Header: icon + (required) accessible title … actions + labeled close. */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {icon ? (
              <span className="flex shrink-0 items-center text-primary">{icon}</span>
            ) : null}
            <DialogTitle className="min-w-0 flex-1 truncate text-start">
              {title}
            </DialogTitle>
          </div>
          {actions || showClose ? (
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              {showClose ? (
                <DialogClose
                  type="button"
                  aria-label={t("common.close")}
                  className="ring-offset-background focus:ring-ring hover:bg-accent hover:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                >
                  <XIcon />
                </DialogClose>
              ) : null}
            </div>
          ) : null}
        </div>

        {description ? (
          <DialogDescription>{description}</DialogDescription>
        ) : null}

        {/* Body — optionally a scroll region so the title stays reachable.
            NOTIF→PLAN 2026-10-24 (owner order item 6 — mobile overflow root
            cause): DialogContent is a GRID whose items default to
            `min-width: auto` — a wide child (the plan tables' min-content
            width on a 360px phone) stretched the grid track past the
            dialog's bounded width and painted OUTSIDE the viewport with no
            scrollbar (the live bug: only the right edge of the plan modal
            was reachable). `min-w-0` lets the body shrink to the real
            container width, and the explicit `overflow-x-auto` scrolls
            any remaining wide content INSIDE the modal — the page behind
            never moves (Radix already locks body scroll). */}
        <div className={cn("min-w-0", scroll && "max-h-[70vh] overflow-x-auto overflow-y-auto scrollbar-thin pe-1")}>
          {children}
        </div>

        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}
