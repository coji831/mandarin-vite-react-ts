export function trackExamplesShown(cacheHit: boolean): void {
  try {
    const evt = { event: "examples_shown", cacheHit, ts: Date.now() };
    console.info("Analytics:", evt);
    const raw = localStorage.getItem("analytics_events") || "[]";
    const arr = JSON.parse(raw);
    arr.push(evt);
    localStorage.setItem("analytics_events", JSON.stringify(arr));
  } catch (err) {
    // ignore storage errors
    console.info("Analytics (fallback):", { cacheHit });
  }
}

export function trackExamplePlayed(exampleIndex: number, cacheHit: boolean): void {
  try {
    const evt = { event: "example_played", exampleIndex, cacheHit, ts: Date.now() };
    console.info("Analytics:", evt);
    const raw = localStorage.getItem("analytics_events") || "[]";
    const arr = JSON.parse(raw);
    arr.push(evt);
    localStorage.setItem("analytics_events", JSON.stringify(arr));
  } catch (err) {
    console.info("Analytics (fallback):", { exampleIndex, cacheHit });
  }
}
