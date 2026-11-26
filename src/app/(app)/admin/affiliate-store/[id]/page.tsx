"use client";
import { use } from "react";
import { AffiliateStoreEditorView } from "@/components/views/AffiliateStoreEditorView";

/**
 * /admin/affiliate-store/[id] — the product editor (client page; React 19 `use`
 * unwraps the Next 16 params promise; the view loads the row through
 * /api/admin/affiliate-store/products?id=… behind requireAdmin).
 */
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AffiliateStoreEditorView mode="edit" productId={id} />;
}
