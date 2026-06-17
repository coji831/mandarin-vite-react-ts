/**
 * @file ContentPlaceholderPage.tsx
 * @description Placeholder page for future content types (Radicals, Grammar, etc.)
 * Story 18.1: Route infrastructure for future epics. Full content in Epics 19+.
 */
export function ContentPlaceholderPage({ title }: { title: string }) {
  return (
    <div className="tab-placeholder" style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <h2 style={{ marginBottom: "0.5rem" }}>{title}</h2>
      <p style={{ color: "#888" }}>Coming in a future update.</p>
    </div>
  );
}
