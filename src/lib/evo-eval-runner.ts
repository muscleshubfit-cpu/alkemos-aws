/**
 * EVO-5 (W5) — weekly eval harness runner (server-only).
 *
 * Answers the reference question set (evo-eval.ts) with the REAL production
 * system prompt (evo-system-prompt.ts — anonymous baseline, no RAG) via the
 * standard provider chain, scores each answer with a cheap judge model on
 * the SAME chain, and persists one evo_eval_runs row per question
 * (migration 0081 — service-role writer). Called by
 * scripts/ai-jobs-runner/evo-eval.mts under GHA evo-weekly-eval.yml.
 *
 * POSTURE (mirrors evo-learning-runner.ts):
 * - Per-question containment: one question failing (answer or judge) is a
 *   soft error that never aborts the run; the judge gets ONE retry on an
 *   unparseable verdict before the question is skipped (RATE-LIMIT
 *   RESILIENCE LAW — a transient 429 on 1/10 must not fail the run).
 * - Honest color: ok=false on a hard error (config/DB) OR when scored
 *   questions fall below HALF the reference set — an eval that evaluated
 *   less than half its set must not paint the run green. Soft errors are
 *   always printed (visible, counted), they only fail the run when they
 *   push the run below that majority floor.
 * - Provider tags: "evo-eval" (answers) and "evo-eval-judge" (judge) —
 *   both ride callFreeAIFallbackChain (UNIVERSAL MODEL SWITCHER law) with
 *   chain:"fast" — the SAME selection mechanism production EVO chat uses
 *   (EVAL FIDELITY LAW, Phase 5-A 2026-10-31: the workflow deliberately
 *   carries NO gemini key — the owner rejected the §12-7 key-add; the
 *   post-cancellation production fast chain is led by the 3 providers the
 *   eval has keys for, with gemini as a tail entry the eval's maxModels
 *   clamp never reaches).
 *
 * CLEANING: answers get the same user-visible sanitizers as the chat route
 * (think-block strip + sanitizeLatexToPlain + stripMarkdownSyntax) so the
 * curve measures what users actually see.
 *
 * NOTE (evo-learning-runner convention): NO `import "server-only"` here —
 * that package THROWS under plain tsx resolution (the GHA runner has no
 * react-server condition). Server-only-ness is enforced by what this file
 * imports: supabase/admin + ai-provider never touch the client bundle.
 */
import { callFreeAIFallbackChain } from "@/lib/ai-provider";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase/admin";
import {
  buildSystemPrompt,
  type EvoClientContext,
} from "@/lib/evo-system-prompt";
import {
  EVO_EVAL_QUESTIONS,
  answerMatchesQuestionLanguage,
  buildEvalAnswerPrompt,
  buildEvalJudgePrompt,
  parseEvalVerdict,
  summarizeEvalResults,
  type EvalQuestion,
  type EvalResultRow,
} from "@/lib/evo-eval";
import {
  sanitizeLatexToPlain,
  stripMarkdownSyntax,
} from "@/lib/evo-chat-format";
import { detectEvoCrisis } from "@/lib/evo-safety";

export type EvoEvalSummary = {
  ok: boolean;
  scored: number;
  total: number;
  avgScore: number;
  safetyFailures: number;
  languageMismatches: number;
  errors: string[];
};

/** Anonymous-baseline context — the eval never sees personal data. */
const BASELINE_CTX: EvoClientContext = {
  name: "EVO Eval",
  isSubscriber: false,
};

/** Strip reasoning blocks the chat route strips before display. */
function stripReasoningBlocks(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>\s*/gi, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>\s*/gi, "")
    .replace(/<reflection>[\s\S]*?<\/reflection>\s*/gi, "")
    .replace(/<analysis>[\s\S]*?<\/analysis>\s*/gi, "");
}

async function answerQuestion(
  question: EvalQuestion,
  systemPrompt: string,
): Promise<{ answer: string; provider: string; model: string }> {
  const { text, provider, model } = await callFreeAIFallbackChain(
    buildEvalAnswerPrompt(systemPrompt, question),
    {
      tag: "evo-eval",
      chain: "fast",
      temperature: 0.6,
      maxTokens: 800,
      timeoutMs: 20_000,
      maxModels: 3,
    },
  );
  // User-visible shape = what the judge grades (route parity).
  const cleaned = stripMarkdownSyntax(
    sanitizeLatexToPlain(stripReasoningBlocks(text || "")),
  ).trim();
  if (cleaned.length < 10) {
    throw new Error(`answer for ${question.id} unusably short (${cleaned.length} chars)`);
  }
  return { answer: cleaned, provider, model };
}

async function judgeAnswer(
  question: EvalQuestion,
  answer: string,
): Promise<{ score: number; safetyPass: boolean; languageMatch: boolean; notes: string }> {
  // ONE retry on an unparseable verdict — transient judge hiccups (429 /
  // chatter output) must not burn a question (RATE-LIMIT RESILIENCE LAW).
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { text } = await callFreeAIFallbackChain(buildEvalJudgePrompt({ question, answer }), {
      tag: "evo-eval-judge",
      chain: "fast",
      temperature: 0,
      maxTokens: 300,
      timeoutMs: 15_000,
      maxModels: 2,
    });
    const verdict = parseEvalVerdict(text);
    if (verdict) {
      // Boolean facts are CODE-computed, never judge-opinioned (168.2):
      // safety = the SAME deterministic shield production uses (a crisis
      // signal in an answer is an instant fail); language = dominant
      // script detection. Zero false positives by construction.
      return {
        score: verdict.score,
        safetyPass: !detectEvoCrisis(answer),
        languageMatch: answerMatchesQuestionLanguage(question.language, answer),
        notes: verdict.notes,
      };
    }
    lastError = new Error(`judge verdict for ${question.id} unparseable (attempt ${attempt + 1})`);
  }
  throw lastError ?? new Error(`judge verdict for ${question.id} unparseable`);
}

export async function runEvoWeeklyEval(): Promise<EvoEvalSummary> {
  const errors: string[] = [];
  const rows: EvalResultRow[] = [];

  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return {
      ok: false,
      scored: 0,
      total: EVO_EVAL_QUESTIONS.length,
      avgScore: 0,
      safetyFailures: 0,
      languageMismatches: 0,
      errors: ["supabase service-role is not configured — nothing can be persisted"],
    };
  }

  // The REAL production prompt, anonymous baseline — identical text for
  // every run so the curve is comparable across weeks (stable input).
  const systemPrompt = buildSystemPrompt(BASELINE_CTX, [], null, [], [], false);

  for (const question of EVO_EVAL_QUESTIONS) {
    try {
      const { answer, provider, model } = await answerQuestion(question, systemPrompt);
      let verdict: Awaited<ReturnType<typeof judgeAnswer>>;
      try {
        verdict = await judgeAnswer(question, answer);
      } catch (judgeErr) {
        errors.push(
          `${question.id}: judge failed (${judgeErr instanceof Error ? judgeErr.message : judgeErr})`,
        );
        continue;
      }
      const { error } = await supabaseAdmin.from("evo_eval_runs").insert({
        question_id: question.id,
        language: question.language,
        provider,
        model,
        score: verdict.score,
        safety_pass: verdict.safetyPass,
        language_match: verdict.languageMatch,
        notes: verdict.notes || null,
        answer_excerpt: answer.slice(0, 400),
      });
      if (error) {
        errors.push(`${question.id}: DB write failed — ${error.message}`);
        continue;
      }
      rows.push({
        question_id: question.id,
        language: question.language,
        score: verdict.score,
        safety_pass: verdict.safetyPass,
        language_match: verdict.languageMatch,
      });
    } catch (e) {
      errors.push(`${question.id}: ${e instanceof Error ? e.message : e}`);
    }
  }

  const summary = summarizeEvalResults(rows);
  // Honest color with a resilience floor: a majority of the reference set
  // must score for the run to be green — a single transient (judge hiccup,
  // one 429) stays visible in errors but cannot fail a healthy majority
  // (RATE-LIMIT RESILIENCE LAW). Zero-scored or half-failed runs are RED.
  const majority = Math.ceil(EVO_EVAL_QUESTIONS.length / 2);
  const ok = summary.count >= majority && summary.count > 0;
  return {
    ok,
    scored: summary.count,
    total: EVO_EVAL_QUESTIONS.length,
    avgScore: summary.avgScore,
    safetyFailures: summary.safetyFailures,
    languageMismatches: summary.languageMismatches,
    errors,
  };
}
