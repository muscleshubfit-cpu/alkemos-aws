/**
 * src/lib/evo-reply-repair.ts
 *
 * AI-QUALITY-REPAIR-LOOP (owner order 2026-11-16 — «لا تقتصر المهمة
 * على محركات توليد المقالات… يجب أن يشمل التدقيق والإصلاح منظومة
 * الذكاء الاصطناعي في Alkemos بالكامل… المحادثات والمساعدات
 * الذكية»).
 *
 * THE GAP THIS CLOSES for the EVO chat surface: the chat route had
 * pre-generation safety (crisis shield), deterministic POST-generation
 * cleaning (reasoning-block stripping), and a ≥10-char floor with a
 * local fallback — but NO content-quality validation of the cleaned
 * answer: a wrong-language answer (English reply to an Arabic member,
 * the measured tail-model failure class) or a strongly dialect-colored
 * Arabic answer shipped to the member as-is. Detection existed for
 * reasoning artifacts only; nothing REPAIRED the language/dialect
 * defects.
 *
 * THE MECHANISM (fitted to the task's nature — the owner's criterion:
 * «عدم افتراض أن آلية إصلاح واحدة تناسب جميع أنواع المخرجات»):
 *   1. validateEvoReplyQuality — deterministic, pure: language match
 *      against the member's replyLanguage + STRONG dialect markers
 *      (the SAME blog-msa single source; WEAK markers are deliberately
 *      ignored — EVO speaks a warm register and the weak set is
 *      MSA-ambiguous).
 *   2. repairEvoReply — ONE directed regeneration carrying the named
 *      defects (the plan-family named-reason repair law, ported to
 *      chat), WITHOUT onDelta (the first attempt's raw tokens already
 *      streamed; the final event REPLACES the streamed text client-side
 *      — evo-chat-context.ts:530 — so the member sees the repaired
 *      answer, not a second stream). A second failure falls back to
 *      the existing local reply — never a wrong-language answer.
 *
 * Pure module (the dispatch call is injected — no provider import; the
 * chat route is the only production rider).
 */

import { AR_DIALECT_STRONG_MARKERS, countDialectMarker } from "@/lib/blog-msa";
import { languageDefect, summarizeDefects, type QualityDefect } from "@/lib/quality-repair/defect-report";

/** Count Arabic-bearing words vs Latin-bearing words in a reply. */
function countWordClasses(text: string): { arabic: number; latin: number; total: number } {
  const words = text.split(/\s+/).filter(Boolean);
  let arabic = 0;
  let latin = 0;
  for (const w of words) {
    if (/[\u0600-\u06FF]/.test(w)) arabic++;
    else if (/[A-Za-z]/.test(w)) latin++;
  }
  return { arabic, latin, total: words.length };
}

/**
 * Deterministic quality validation of a CLEANED chat reply.
 * Defect classes (each pinned by canaries):
 *   - language: the reply's dominant script contradicts the member's
 *     replyLanguage (a Latin-dominant answer to an Arabic member and
 *     vice versa — bilingual glosses/facts keep passing: the threshold
 *     is dominance, not presence).
 *   - dialect-strong: an AR reply carrying any STRONG dialect marker
 *     (the unambiguous colloquial set — «دلوقتي/عشان/إيه…» never ship
 *     in the assistant's voice).
 * WEAK dialect markers are deliberately NOT defects here: EVO's tone is
 * warm and the weak set is MSA-ambiguous (the chat marketing law bans
 * specific phrases, not the whole register).
 */
export function validateEvoReplyQuality(
  cleanText: string,
  replyLanguage: "ar" | "en",
): QualityDefect[] {
  const defects: QualityDefect[] = [];
  if (!cleanText.trim()) return defects;

  const { arabic, latin, total } = countWordClasses(cleanText);
  if (total >= 4) {
    // Dominance threshold: ≥70% of the word-bearing reply in the WRONG
    // script. A bilingual answer (AR reply carrying brand names / EN
    // reply quoting an Arabic term) passes both directions.
    if (replyLanguage === "ar" && latin / total >= 0.7) {
      defects.push(languageDefect("en-dominant", "ar"));
    }
    if (replyLanguage === "en" && arabic / total >= 0.7) {
      defects.push(languageDefect("ar-dominant", "en"));
    }
  }

  if (replyLanguage === "ar") {
    for (const marker of AR_DIALECT_STRONG_MARKERS) {
      const hits = countDialectMarker(cleanText, marker);
      if (hits > 0) {
        defects.push({
          kind: "dialect-strong",
          location: `${marker}×${hits}`,
          cause: "علامة عامية قوية في صوت المساعد (قانون MSA — مجموعة STRONG)",
          fixInstruction: `استبدل «${marker}» بمقابلها في العربية الفصحى الحديثة السهلة`,
        });
        if (defects.length >= 4) break; // cap the directive size
      }
    }
  }
  return defects;
}

/** The one-shot repair directive appended to the original prompt. */
export function buildEvoRepairDirective(
  defects: QualityDefect[],
  replyLanguage: "ar" | "en",
): string {
  const summary = summarizeDefects(defects);
  return replyLanguage === "ar"
    ? `إعادة إصلاح موجّهة — ردك السابق رُفض فحص الجودة الحتمي لهذه المخالفات بالضبط (أصلح كل واحدة عند سببها ثم أعد الرد كاملًا بضعف عمق المحاولة الأولى لا بترديدها): ${summary}`
    : `DIRECTED REPAIR RETRY — your previous reply was REJECTED by the deterministic quality check for EXACTLY these violations (fix each one at its actual cause, then re-emit the FULL reply with more depth than the first attempt, not a repetition of it): ${summary}`;
}

/**
 * The chat repair orchestration — ONE directed regeneration, never a
 * blind one (progress law: the retry must name the defects; the result
 * must pass the SAME validator). Returns the repaired reply or null
 * (caller falls back to the existing local reply — the pre-2026-11-16
 * behavior, never a wrong-language answer shipped as success).
 *
 * `dispatch` is injected by the route (its callAI/dispatchAI wiring) —
 * the repair call carries NO onDelta (the first attempt already
 * streamed; the final event replaces the streamed text client-side).
 */
export async function repairEvoReply(args: {
  prompt: string;
  firstReply: string;
  replyLanguage: "ar" | "en";
  defects: QualityDefect[];
  dispatch: (prompt: string) => Promise<{ text: string }>;
  clean: (raw: string) => string;
}): Promise<{
  reply: string | null;
  violationsAfter: string[];
  attempts: Array<{ strategy: string; verdict: string }>;
}> {
  const directive = buildEvoRepairDirective(args.defects, args.replyLanguage);
  const attempts: Array<{ strategy: string; verdict: string }> = [
    { strategy: "first-draw", verdict: `rejected: ${summarizeDefects(args.defects).slice(0, 200)}` },
  ];
  try {
    const second = await args.dispatch(`${directive}\n\n${args.prompt}`);
    const cleaned = args.clean(second.text ?? "");
    const remaining = validateEvoReplyQuality(cleaned, args.replyLanguage);
    if (remaining.length === 0 && cleaned.trim().length >= 10) {
      attempts.push({ strategy: "directed-regeneration", verdict: "resolved" });
      return { reply: cleaned, violationsAfter: [], attempts };
    }
    attempts.push({
      strategy: "directed-regeneration",
      verdict: `no-progress: ${summarizeDefects(remaining).slice(0, 200)}`,
    });
  } catch (e) {
    attempts.push({
      strategy: "directed-regeneration",
      verdict: `threw: ${e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200)}`,
    });
  }
  // Honest termination: NOT repaired — the caller keeps its local
  // fallback (never marked success with a defective reply).
  return { reply: null, violationsAfter: ["unfixable after directed regeneration"], attempts };
}
