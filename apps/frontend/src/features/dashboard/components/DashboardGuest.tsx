/**
 * DashboardGuest
 *
 * Guest-facing dashboard. Owns the page's section rhythm via PageStack (the page
 * container owns the PageShell measure).
 *
 * Rework (§8): the order is INVERTED. The guest used to be pitched registration
 * first, then handed the course. BM-2 §4 says the opposite: prove the delta in
 * session 1 — the DEMO leads, and registration is the outcome of it ("keep this
 * queue", "keep these numbers"), not the entry fee. The wedge card therefore
 * sits directly under the h1, the Blueprint invitation is the single primary
 * CTA, and "Create account" is a ghost in the same row as the page's other
 * secondary actions.
 *
 * Rework (§8 close-out): the four phase preview cards are gone. They were the
 * last grid of destinations on the home surface — the same shape §8 deleted
 * from the registered dashboard — and they told a first-time visitor about
 * Phases 2–4 before they had learned a single initial. The rail already carries
 * every Learn surface; the home surface's job is one next step, one proof.
 * They also never claimed a lock (BM-1 makes every Learn surface open).
 */
import { useNavigate } from "react-router-dom";
import { Button, PageHeader, PageStack } from "shared/components";
import { learn_foundations, register_page } from "shared/constants";
import { ToneDemoCard } from "./ToneDemoCard";

export function DashboardGuest() {
  const navigate = useNavigate();

  return (
    <PageStack size="default">
      {/* Header — value pitch; the single primary CTA is starting to learn. */}
      <PageHeader
        title="Welcome to PinyinPal!"
        description="Start learning Mandarin — no account needed"
      >
        <Button variant="primary" size="lg" onClick={() => navigate(learn_foundations)}>
          Start the Blueprint
        </Button>
      </PageHeader>

      {/* BM-2 wedge FIRST — prove the delta before asking for anything. */}
      <ToneDemoCard onTry={() => navigate(`${learn_foundations}/reference?tab=tones`)} />

      <div>
        <Button variant="ghost" onClick={() => navigate(register_page)}>
          Create an account to keep your progress
        </Button>
      </div>
    </PageStack>
  );
}
