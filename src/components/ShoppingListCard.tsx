"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  aggregateShoppingList,
  formatAmount,
  formatShoppingListText,
  shoppingListTotalGrams,
  SHOPPING_LIST_DAY_CHOICES,
  SHOPPING_LIST_DEFAULT_BUFFER,
  type ShoppingListSourceMeal,
} from "@/lib/shopping-list";
import { ShoppingCart, Copy, Check } from "lucide-react";

/**
 * ShoppingListCard — §12.30 (owner directive «مكتوب وعد بعمل قائمة تسوق
 * للاكل ولاكن لا يوجد أداة لتنفيذ الامر»): the tool that fulfills the
 * written grocery-list promise on the meal planner's own page.
 *
 * Renders under the plan's grand total: pick the basket horizon (1 · 3 · 7
 * days), toggle the ~20% waste/appetite buffer the reference content
 * teaches, and read the aggregated list — every food across every meal
 * merged into one row, scaled, and copyable as plain text.
 *
 * NO membership gate: the list derives from the visitor's own (free) plan
 * — the same inputs the planner already shows live totals for.
 */
export function ShoppingListCard({
  meals,
}: {
  meals: ShoppingListSourceMeal[];
}) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [days, setDays] = useState<number>(3);
  const [buffer, setBuffer] = useState(true);
  const [copied, setCopied] = useState(false);

  const rows = useMemo(
    () =>
      aggregateShoppingList(meals, {
        days,
        buffer: buffer ? SHOPPING_LIST_DEFAULT_BUFFER : 0,
      }),
    [meals, days, buffer],
  );

  const hasItems = rows.length > 0;

  const copy = async () => {
    const text = formatShoppingListText(rows, isAr ? "ar" : "en");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard denied (e.g. insecure context): the visible table
      // remains fully usable — no error state needed.
    }
  };

  return (
    <div className="marble-card mt-6 p-5 md:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--edge)] bg-[var(--tint)] text-[var(--muted-2)]" aria-hidden="true">
          <ShoppingCart className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
            {isAr ? "قائمة التسوق من خطتك" : "Shopping list from your plan"}
          </h3>
          <p className="text-sm font-normal text-[var(--muted-foreground)]">
            {isAr
              ? "كل صنف عبر كل الوجبات في سطر واحد — بالكميات للمدة التي تختارها."
              : "Every food across every meal in one row — quantities for the horizon you pick."}
          </p>
        </div>
      </div>

      {hasItems ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-[var(--edge)] bg-[var(--tint)] p-1">
              {SHOPPING_LIST_DAY_CHOICES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    days === d
                      ? "bg-[var(--text)] text-[var(--bg)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--text)]"
                  }`}
                  aria-pressed={days === d}
                >
                  {isAr
                    ? d === 1 ? "يوم" : d === 3 ? "3 أيام" : "أسبوع"
                    : d === 1 ? "1 day" : d === 3 ? "3 days" : "Week"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setBuffer((b) => !b)}
              aria-pressed={buffer}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                buffer
                  ? "border-[var(--chrome-edge)] text-[var(--text)]"
                  : "border-[var(--edge)] text-[var(--muted-foreground)]"
              }`}
            >
              {isAr ? "احتياط +20%" : "+20% buffer"}
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--edge)]">
            <table className="w-full min-w-[320px] border-collapse text-sm font-normal">
              <thead>
                <tr className="bg-[var(--tint)]">
                  <th scope="col" className="border-b border-[var(--edge)] px-3 py-2 text-start font-medium text-[var(--text)]">
                    {isAr ? "الصنف" : "Item"}
                  </th>
                  <th scope="col" className="border-b border-[var(--edge)] px-3 py-2 text-center font-medium text-[var(--text)]">
                    {isAr ? "يوم واحد" : "1 day"}
                  </th>
                  <th scope="col" className="border-b border-[var(--edge)] px-3 py-2 text-center font-medium text-[var(--text)]">
                    {isAr ? "السلة" : "Basket"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className="odd:bg-[var(--tint)]/40">
                    <td className="border-b border-[var(--edge)]/60 px-3 py-2 text-[var(--muted-foreground)]">{r.name}</td>
                    <td className="border-b border-[var(--edge)]/60 px-3 py-2 text-center text-[var(--muted-foreground)]" dir="ltr">
                      {formatAmount(r.dayGrams)}
                    </td>
                    <td className="border-b border-[var(--edge)]/60 px-3 py-2 text-center font-medium text-[var(--text)]" dir="ltr">
                      {formatAmount(r.grams)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-normal text-[var(--muted-foreground)]">
              {isAr
                ? `إجمالي السلة: ${formatAmount(shoppingListTotalGrams(rows))} · الكميات مقربة لأقرب 5 غرامات`
                : `Basket total: ${formatAmount(shoppingListTotalGrams(rows))} · quantities rounded to the nearest 5 g`}
            </p>
            <button
              type="button"
              onClick={copy}
              className="btn-outline inline-flex items-center gap-2 px-4 py-2 text-xs"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copied
                ? isAr ? "تم النسخ" : "Copied"
                : isAr ? "انسخ القائمة" : "Copy list"}
            </button>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm font-normal text-[var(--muted-foreground)]">
          {isAr
            ? "أضف أطعمة لوجباتك أعلاه — تظهر القائمة هنا فورًا بالكميات المجمعة."
            : "Add foods to your meals above — the list appears here instantly with aggregated quantities."}
        </p>
      )}
    </div>
  );
}
