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
  (short-lived GCS signed URLs returned by the backend TTS capability) or a proxy
  endpoint. The shared engine sets `audio.src = url` directly; `AudioManager` is
  a pure transport and never touches the HTTP/service layer.
- **Autoplay policies** — `audio.play()` returns a promise; a rejected promise
  (autoplay blocked before a user gesture) must be caught and playback should
  degrade gracefully (e.g. browser `SpeechSynthesis` fallback). The engine
  contract `playUrl(url, rate, signal): Promise<PlaybackEndReason>` always
  settles (`ended`/`paused`/`aborted`/`error`) — never a dangling promise.
- **Pause on popover open / Page-Visibility** — pause playback when a popover
  opens and on `visibilitychange` (`document.hidden`); resume if it was playing
  before. This behavior is FEATURE-OWNED, not a shared-hook behavior: the
  popover pause/resume wiring and the `visibilitychange` listener live in the
  consuming page/feature (e.g. `ReadersPage` — popover-resume via the manager's
  `restart()`, plus a `document.addEventListener("visibilitychange", …)` that
  pauses when hidden). The shared `useAudioManager` / `useAudioItemPlayback`
  hooks only expose transport primitives (`pause`/`stop`/`restart`) — they do
  NOT install page-visibility or popover listeners.
- **Candidates-as-data (`AudioBehavior` contracts)** — consumers express intent
  as a contract, not imperative calls: an ordered `PlayableSource[]` candidate
  list per item, built from the service layer (URL candidates via
  `AudioService.fetchWordAudio`), a browser-TTS fallback candidate, or an empty
  list = skip. `AudioManager` plays `PlayableItem[]` and consults `onUrlFailed`
  (verdicts `"retry" | "fallback" | "skip"`) so arbitration lives in one place —
  no `SourceResolver`. Default word contract: `defaultWordBehavior` in
  `shared/audio/contracts/`; the passage contract is readers-owned
  (`PassageAudioBehavior` / `buildPassageAudioBehavior` in `features/readers/audio`).

---

**See also:** `frontend-pre-delivery-checklist.instructions.md` (animation rules) • `testing-standards.instructions.md` (test ref interactions)
