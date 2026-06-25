---
description: "Use when integrating external DOM-manipulating libraries (hanzi-writer, D3, charts, canvas libraries) with React components. Covers ref stability, DOM ownership, and lifecycle coordination."
applyTo: "**/hanzi-writer*,**/useHanziWriter*,**/*canvas*,**/*animation*"
---

# External Library Integration with React

## Golden Rule

Never let React and an external library own the same DOM subtree. React's reconciliation will conflict with the library's mutations.

## Pattern: Ref-Only Container

```tsx
// ✅ DO — Container div with no React children
function MyCanvas({ onInit }: { onInit: (lib: ExternalLib) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const libRef = useRef<ExternalLib | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    libRef.current = new ExternalLib(containerRef.current);
    onInit(libRef.current);
    return () => libRef.current?.destroy();
  }, []);

  // Loading/error states go OVERLAY, not as children
  return (
    <div style={{ position: "relative" }}>
      <div ref={containerRef} />
      <div style={{ position: "absolute", top: 0 }}>Loading...</div>
    </div>
  );
}
```

## CDN/Data Loading

- Always provide custom data loaders with error handling for CDN-backed libraries
- Default loaders often hang silently on network failure (status === 0 with no callback)

## Key Points

- Use `useRef` for library instance — never store in state
- Destroy library instance in `useEffect` cleanup
- Don't conditionally render the container div — keep it mounted
- Use `useMemo` + `useCallback` for stable ref assignment
