/**
 * @file ContentPlaceholderPage.tsx
 * @description Placeholder page for future content types (Radicals, Grammar, etc.)
 * Story 18.1: Route infrastructure for future epics. Full content in Epics 19+.
 */
export function ContentPlaceholderPage({ title }: { title: string }) {
  return (
    <div className="tab-placeholder flex-col gap-sm text-center p-2xl">
      <h2>{title}</h2>
      <p className="text-muted">Coming in a future update.</p>
    </div>
  );
}
