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

## Audio Playback (`<audio>` / `Audio()`)

- **No auth headers** — `new Audio()` / `<audio>` cannot attach `Authorization`
  headers; only cookies are sent. For authenticated audio use **signed URLs**
  (short-lived GCS signed URLs, as `ReadersAudioService` returns) or a proxy
  endpoint. `AudioEngine.playUrl` sets `audio.src = url` directly.
- **Autoplay policies** — `audio.play()` returns a promise; a rejected promise
  (autoplay blocked before a user gesture) must be caught and playback should
  degrade gracefully (e.g. browser `SpeechSynthesis` fallback).
- **Pause on popover open / Page-Visibility** — pause playback when a popover
  opens and on `visibilitychange` (`document.hidden`); resume if it was playing
  before (see `useAudioPlayer`).
- **Hook decomposition (readers)** — split fetch from playback: `usePassageAudio`
  loads URLs, `useAudioPlayer` plays them (single responsibility). Use distinct
  store signals for intent: `pendingIndex` (tap-to-play, auto-advance) vs
  `pendingSingleIndex` (single sentence, no auto-advance) — see `audioStore.ts`.

---

**See also:** `frontend-pre-delivery-checklist.instructions.md` (animation rules) • `testing-standards.instructions.md` (test ref interactions)
