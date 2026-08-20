---
purpose: 2026 research round parsed findings (M1–M19) — source data for the business model validation
status: active
last-verified: 2026-08-17
type: business
---

# PinyinPal 2026 Research Round — Parsed Findings (M1–M19)

> ⚠️ This document is the official, ratified record of the 2026 research round — Class 2 research source data for the [RATIFIED business model](../business-model.md). It was originally developed as a gitignored working spec (in `wip/`) that is NOT official documentation and may be deleted; do not treat it as authoritative or reference it. See [Business Index](../README.md).

**Purpose**: 2026 research round **source data** for the final business/AI validation — to update **V10** (pricing), **V11** (conversion 4.5% / churn 8% / $0.12-hr-voice), **Q11** (ASR vendor/budget — de-gates **B19**), **RAG-1** (C16), and to feed the feature/calibration docs. Maps each theme to the [feature inventory](feature-inventory.md) and the decision IDs of the [feature validation 2026](feature-validation-2026.md) / calibration rounds.

**Source**: Claude share — [2026 research round (coji) — 19 themes M1–M19 in 6 batches](https://claude.ai/share/3594a5bf-fa2d-45be-9389-c6f2c0b5ad36)

**Last Updated:** August 17, 2026 — promoted to `docs/business/research/` (2026-08-15, verbatim); flags (a)–(c) resolved by §23 Final Validation (2026-08-14)

**Status**: raw research **parsed, not validated** — numbers to be validated in the final round; some are secondary sources (flagged inline). This doc is **source data for decisions, not a decision document** — no decision ID is changed here.

**Related**: [System Feature Inventory](feature-inventory.md) · [Feature Validation 2026 (Axes 1–2)](feature-validation-2026.md) · [Business Model](../business-model.md)

---

## One-Page Quick Index

| Theme                        | Key headline finding                                                                                                                                                                                                          | Validates / closes                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **M1** Market size           | Global language-learning $85.1B (2025)→$649B (2035); Mandarin-specific $37.33B (2026)→$166.09B (2035); HSK 3.0 launches **Jul 2026**                                                                                          | Business case; **override-2** timing (don't over-claim "HSK 3.0" pre-rollout) |
| **M2** Competitors           | "Stack, don't choose one" — no app owns full journey; Duolingo Max Chinese = **Video Call only (no Roleplay)**; 216% YoY Mandarin surge (RedNote)                                                                             | **V10** anchor; **B18/C9** conversation scope                                 |
| **M3** Pricing/WTP           | Duolingo Super **$95.99/yr** / Max **$167.99/yr** / Family **$119.99–240/yr**; "Explain My Answer" free since Jan 2026; HelloChinese **$11.99/mo**; Speak ~**$83.99/yr**; Skritter **$14.99/mo**; LingoDeer Plus **$8.99/mo** | **V10** (pricing set)                                                         |
| **M4** Conversion/funnel     | Hard paywall D35 **10.7%** vs freemium **2.1%**; Education median **$44.99/yr**; 17–32-day trials **42.5%** trial→paid; Duolingo ~**9.2%** MAU→paid                                                                           | **V11** (conversion/churn); **G7** (funnel capture)                           |
| **M5** Voice/AI-tutor        | Speak = AI tutor + lessons; Praktika ~**$8/mo** annualized (~$2M/mo iPhone subs, Sensor Tower Mar 2026)                                                                                                                       | **V11** ($0.12-hr voice); **V10**; **B18/C9**                                 |
| **M6** HSK 3.0 syllabus      | L1–6 = **300/500/1000/2000/3600/5400**, 7–9 = **11,000** total; trial 2026-01-31, rollout **Jul 2026**                                                                                                                        | **override-2** (HSK 2025 rebase; **F2**)                                      |
| **M7** Pinyin phonemes       | **21 initials**, ~35–39 finals (source variance), ~1,300 syllables, 4+1 tones                                                                                                                                                 | **D14** (pinyin phoneme gap 18+32→21+38)                                      |
| **M8** Reference counts      | Kangxi **214** radicals (PRC 201-standard since 2009); chengyu 20k–50k dicts / ~500 core for learners; HSK char **~3,000 ceiling** — 3,088 vs 3,109 **not settled**                                                           | **D15** (radicals/Core-300); **override-2** char-total **OPEN**               |
| **M9** Tone/ASR vendors      | Azure STT **$1/hr** real-time; zh-CN pron-assessment **same price**; FunASR SenseVoice **7.81% CER** vs Whisper **20.02%**; FireRedASR2-LLM **2.89%**; iFlytek ISE price **not retrievable**                                  | **Q11** (ASR vendor/budget → de-gates **B19**)                                |
| **M10** Practice formats     | Cloze = distractor-generation problem (LLM-based CDGP); dictation = analysis-by-synthesis, correlates with L2 proficiency                                                                                                     | **B6** (cloze Q6), **B9** (dictation Q9); P1/P5                               |
| **M11** SRS/FSRS             | FSRS default since Anki **23.10**; **15–20%** fewer reviews; retention **0.85–0.90**; ~**400 reviews** min for Optimize; Kim & Webb (2022) **g=1.15** spaced-vs-massed; pronunciation → **blocked** may beat interleaving     | **T3/T11/T14** (ts-fsrs pin, not py-fsrs); **S5/B16** (interleaved review)    |
| **M12** RAG/hybrid           | "Do you even need RAG": full-context fine to **~1,000 docs**; 4 legitimate RAG reasons; **pgvector** default for Postgres                                                                                                     | **RAG-1** (C16), **S14** (deterministic retrieval)                            |
| **M13** Embeddings           | Qwen3-Embedding-8B **70.6 MTEB** (open-weight); Gemini Embedding **$0.15/1M**; BGE-M3 = workhorse; **C-MTEB** for Chinese                                                                                                     | **RAG-1** / **C18** (embeddings pipeline)                                     |
| **M14** Question-gen quality | LLM-as-judge ~**85%** agreement; **generate-then-validate** (LAK'26); DailyMed retrieval-grounded loop                                                                                                                        | **S15-amended** (**C17** Guardian eval)                                       |
| **M15** Conversational AI    | Duolingo Max = **GPT-4**, prototype in a day; memory/state-injection patterns (OpenAI context-personalization)                                                                                                                | **AS12** (**C15** learner context); **C9**/E.2                                |
| **M16** Personalization      | HLR **p=2^(−Δ/h)**; cold-start LLM-as-difficulty-rater = **emerging**, not finished                                                                                                                                           | **T2.3/D7** adaptive difficulty; **C10** recommender                          |
| **M17** LLM/voice costs      | Gemini ladder: 3.1 Pro **$2/$12**, 3.5 Flash-Lite **$0.30/$2.50**, 2.5 Flash-Lite **$0.10/$0.40** floor; batch **−50%**; caching **10%**; **2.5 family retires Oct 16 2026**                                                  | **V11** (voice cost), **Q11**, **C7** (epic-29 AI gateway)                    |
| **M18** GDPR/consent         | EDPB **Art 5(3)** tech-neutral **incl. IndexedDB/fingerprinting/local storage**; "legitimate interest" ≠ analytics consent; **Consent Mode v2 mandatory 2026**                                                                | **T12/G7/OB6** (privacy/consent); **T15** guest IndexedDB                     |
| **M19** Observability        | OTel GenAI semconv still **"Development"** (May 2026); PII-safe by default, content capture opt-in; liveness ≠ readiness                                                                                                      | **OB1–OB6** (G-series), **E9/G3** health split                                |

---

## 1. Market & Positioning

### M1 — Mandarin / HSK Market Size

**Key findings** (verbatim numbers + named sources):

- Global language-learning market: **$85.1B in 2025 → $101.5B in 2026 → $649B by 2035 (22.9% CAGR)**; EF Education First leads (>6.7% share), top 5 hold 14% (2025). [Global Market Insights](https://www.gminsights.com/industry-analysis/language-learning-market)
- Mandarin-specific: **$37.33B in 2026 → $166.09B by 2035 (18.1% CAGR)**. [Business Research Insights](https://www.businessresearchinsights.com/market-reports/mandarin-learning-market-124154)
- China domestic language-learning market: **$9.1B in 2025**. [Global Market Insights](https://www.gminsights.com/industry-analysis/language-learning-market)
- Separate estimate (HolonIQ, dated): Chinese-language learning $7.4B → $13.1B by 2027; TAM ~**7.5M learners** (K-12 diaspora, business, cultural). [Emp0](https://articles.emp0.com/chinese-language-learning-market-growth/)
- K-12 Chinese Language Education: **$4.96B (2025) → $16.55B (2035, 12.8% CAGR)**. [Market Research Future](https://www.marketresearchfuture.com/reports/chinese-language-education-for-k12-market-51123)
- Broader Chinese e-learning: **$80B (2025) → $200B (2034, 10.5% CAGR)**. [Verified Market Reports](https://www.verifiedmarketreports.com/product/chinese-e-learning-market/)
- **HSK test prep**: no standalone category; folded into test-prep ($142.8B in 2025 globally, 7.1% CAGR). **HSK 3.0 launches officially July 2026** — 6-level → 9-level (Elementary 1–3 / Intermediate 4–6 / Advanced 7–9); first global trial **Jan 31, 2026**; **June 28, 2026** = last HSK 2.0 sitting. [Mandarin Zone](https://www.mandarinzone.com/hsk-test-dates-2026/)
- Test fees ~**$20–35** (HSK 1/2, higher for upper levels); certificates valid **2 years** for academic/visa. [Learningchinesewithhari](https://www.learningchinesewithhari.com/post/hsk-2026-schedule)

**Validates**: market opportunity + **override-2** timing nuance (HSK 3.0 rollout is a disruption point for test-prep content; frame marketing as "2025-syllabus aligned" until full rollout, per F2/N3 Axis-1 note).

**Actionable takeaway**: the market is large and growing, and the HSK 2.0→3.0 transition is a **content-refresh disruption** — an owned, rebased syllabus is a competitive wedge. No dedicated HSK-prep market figure exists → use test-prep + Mandarin figures as the sizing envelope.

### M2 — Competitor Landscape

**Key findings**:

- 2026 verdict pattern: **"stack, don't choose one"** — no single app owns the full learner journey. HelloChinese for serious Mandarin; Duolingo Chinese for low-pressure habit; Pleco early; Migaku/Novli (immersion), Skritter (writing), Clozemaster (intermediate) complementary. [Mandarin Atlas](https://mandarin-atlas.vercel.app/hellochinese-vs-duolingo-chinese) · [Migaku](https://migaku.com/blog/chinese/duolingo-chinese-review-vs-alternatives) · [The Ivy Mandarin](https://www.theivymandarin.com/blogs/news/is-duolingo-good-for-learning-chinese)
- HelloChinese edge: grammar explanations in every lesson, tone training w/ visual feedback, stroke-order writing; priced ~**$11.99/month** (2026). [Migaku](https://migaku.com/blog/chinese/duolingo-chinese-review-vs-alternatives)
- Duolingo Max **Video Call**: FaceTime-style calls with AI character **Lily** (adapts, remembers calls); second beginner character **Falstaff** (guided calls, **iOS-only**). **Chinese gets Video Call only — NOT Roleplay** (Roleplay reserved for Spanish/French/German/Italian/Portuguese). [Duolingo/duoplanet](https://duoplanet.com/duolingo-video-call/) · [Copycat Cafe](https://copycatcafe.com/blog/duolingo-max)
- Mandarin demand surge: **216% YoY** increase in Mandarin learners, tied to TikTok-US uncertainty driving migration to RedNote (briefly #1 free App Store app). [Neowin](https://www.neowin.net/news/duolingo-brings-ai-video-calling-to-android-amid-mandarin-learning-boom-driven-by-rednote/)
- Max pricing: **$168/year (~$14/mo annual)** or **$29.99/month** US; family ~**$240/year** for up to 6. [Copycat Cafe](https://copycatcafe.com/blog/duolingo-max)

**Validates**: **V10** (pricing anchors), **B18/C9** conversation scope (Chinese conversation is premium-gated in the market — aligns with auth-only/hidden-for-guests P10/P16), and the **"bridge casual + serious HSK"** positioning opportunity.

**Actionable takeaway**: PinyinPal's opening = owned HSK-aligned depth (grammar/tone/characters) that casual-first Duolingo Chinese doesn't cover — and conversation (E.2) is exactly where the market puts the paywall, which supports PinyinPal keeping it auth-gated.

---

## 2. Monetization & Pricing

### M3 — Competitor Pricing / Willingness-to-Pay

**Key findings** (verbatim):

- **Duolingo**: Free $0 / **Super $95.99/yr** / **Max $167.99/yr**; **Family Plan $119.99/yr** (up to 6) — range up to ~$240/yr. Max = **$29.99/mo**. [Languageappguide](https://languageappguide.com/pricing/duolingo-cost/) · [Copycat Cafe](https://copycatcafe.com/blog/duolingo-max)
- **"Explain My Answer" became free for everyone as of January 2026** — Max now differentiated only by Video Call + Roleplay. [My Engineering Buddy](https://www.myengineeringbuddy.com/blog/duolingo-reviews-pricing-alternatives-2026/) → **directly validates P15 free-for-registered S1-Explain stance**.
- Heavy promo discounting: New Year sales cut Super 50–60% (~$35–42/yr); back-to-school 25–30% off. [Checkthat](https://checkthat.ai/brands/duolingo/pricing)
- **HelloChinese Premium**: official ~**$11.99/mo**, **$25.99/3mo**, **$69.99/12mo** (US). Premium+ tier higher (one 2025 review: ~$19.99/mo, $89.99/6mo, $149.99/yr; other sources ~$15.99/mo) — region/promo variance. [App Store](https://apps.apple.com/us/app/hellochinese-learn-chinese/id1001507516) · [FluentU](https://www.fluentu.com/blog/reviews/hellochinese/)
- **Speak**: Annual Premium **$83.99** ($17.99/mo); Annual Premium Plus **$164.99** ($39.99/mo). [App Store](https://apps.apple.com/us/app/speak-language-learning/id1286609883) Independent reviews: ~**$99/yr** Premium, ~$20/mo. [Practiceme](https://practiceme.app/vs/speak) · [SpeakShark](https://speakshark.com/blog/speak-app-pricing-per-month-2026) Supports Chinese (Simplified & Traditional) among 16 languages.
- **Skritter**: **$14.99/mo**; **$59.99/6mo ($9.99/mo)**, **$99.99/12mo ($8.33/mo)**, **$179.99/24mo ($7.50/mo)** — stable for years, flagged as premium ("$15/mo … pricey"). [Skritter FAQ](https://legacy.skritter.com/faq) · [Hacking Chinese](https://www.hackingchinese.com/skritter-chinese-review-boosting-your-character-learning/)
- **LingoDeer Plus** (separate app): **$8.99/mo**, $17.99/quarterly, **$35.99/yr** (saves 50%); reviewers skeptical ("too expensive for what it is"). Core LingoDeer runs separately: $14.99/mo, $39.99/quarter, $95.99/yr, ~$199.99 lifetime. [App Store](https://apps.apple.com/us/app/lingodeer-plus-language-games/id1476253711) · [Langoly](https://www.langoly.com/lingodeer-review/) · [Languavibe](https://languavibe.com/lingodeer-review/)

**Validates**: **V10** (pricing set — the market band for a Mandarin-focused sub: ~$8–15/mo annualized; $44.99/yr category median in M4 anchors a PinyinPal Pro yearly price).

**Actionable takeaway**: specialist Chinese apps cluster at **$11–15/mo monthly / ~$70–100/yr annual**; an AI-voice-differentiated tier (Speak/Praktika/Max pattern) can price higher (~$84–168/yr). V10's existing $9.99/$59.99 assumption is **conservative but defensible**; the source supports raising the annual price toward the $70–100 band.

### M4 — Conversion / Funnel Benchmarks (RevenueCat State of Subscription Apps 2026)

**Key findings** (verbatim):

- Dataset: **115,000+ apps, $16B revenue, 1B+ transactions**. [RevenueCat](https://www.revenuecat.com/state-of-subscription-apps)
- **Hard paywalls convert ~5× better at Day-35 download-to-paid: 10.7% median vs freemium 2.1% median**; top-decile hard-paywall reaches **38.7%**. [RevenueCat education](https://www.revenuecat.com/state-of-subscription-apps-2026-education/)
- **But retention is nearly identical**: Y1 retention freemium **28%** vs hard paywall **27%** (yearly plans) — access method changes conversion timing, not stickiness. [RevenueCat education](https://www.revenuecat.com/state-of-subscription-apps-2026-education/)
- Education category: **6.5%** download-to-trial median; **highest yearly median price of any category at $44.99**; annual-plan share 59–66%; low Day-0 immediate conversion (28.5%); **Y1 RLTV per payer $22.82**. [RevenueCat education](https://www.revenuecat.com/state-of-subscription-apps-2026-education/)
- Trial length: **17–32-day trials convert 42.5% median trial→paid vs 25.5% for ≤4 days (1.7× gap)** — yet share of ≤4-day trials rose 42.1%→46.5% YoY. [RevenueCat education](https://www.revenuecat.com/state-of-subscription-apps-2026-education/)
- Day 0 dominates: **55% of 3-day-trial cancellations on Day 0**; ~half of paid conversions on Day 0. [RevenueCat education](https://www.revenuecat.com/state-of-subscription-apps-2026-education/)
- Geography: North America D35 conversion **2.6–2.8%** median ≈ 2× IN/SEA (0.7–1.4%). [RevenueCat education](https://www.revenuecat.com/state-of-subscription-apps-2026-education/)
- **Duolingo: ~9.2% MAU→paid** (12.2M paid / 133.1M MAU FY2025) — above category benchmarks; one case study claims 8.9% = "elite" vs ~2% industry / ~4% strong. Growth decelerating: **+300K net new paid subs in Q1 2026** (vs 600–900K/quarter pace), trading ~$50M bookings for free-tier engagement. [Alphastreet](https://news.alphastreet.com/duolingo-duol-has-a-subscription-and-ai-monetization-engine-bigger-than-a-free-language-app/) · [Relaunch](https://relaunch.ai/blog/duolingo-onboarding-teardown-7-b-tests-behind-their-9-conver.html) · [Class Central](https://www.classcentral.com/report/duolingo-q1-2026)

**Validates**: **V11** (conversion/churn assumptions — the 4.5% conversion sits between freemium 2.1% and hard-paywall 10.7%; the data supports a hard-paywall/D-day-funnel design and longer trials) and **G7** (consent-gated funnel capture).

**Actionable takeaway**: the guest-first design (free Phase-1 trial-of-fundamentals + register-to-save) matches the **freemium-style funnel** — so V11's 4.5% conversion is a **mid-point assumption needing validation**; the source suggests **17–32-day trials** and an **annual-leaning** price ($44.99 category median) to lift trial→paid.

### M5 — Voice / AI-Tutor Patterns

**Key findings**:

- **Duolingo Max Video Call**: Max-exclusive, AI character Lily, adapts to level, remembers calls; Falstaff = beginner "guided" calls (**iOS-only**); **Chinese: Video Call only, no Roleplay**. [Duolingo/duoplanet](https://duoplanet.com/duolingo-video-call/) · [Copycat Cafe](https://copycatcafe.com/blog/duolingo-max)
- **Speak app**: built around an AI "Speak Tutor" + core structured lessons; Premium vs Premium Plus differ mainly on **unlimited custom lessons** (Plus only); reviewers find the AI tutor's grammar-explanation depth underwhelming (redirects to drilling). [Languatalk](https://languatalk.com/blog/speak-app-review/)
- **Praktika**: generative-AI video avatars; free + premium; commonly cited ~**$8/month**; App Store SKUs $9.99/mo, $49.99/3mo, $119.99–139.99/yr (+ promos $19.99–49.99); **effective annual ~$8/mo**. Grosses ~**$2M/month from iPhone subs alone** (Sensor Tower, March 2026). Weakness: guided/rigid path vs more adaptive competitors (Langua). [Praktika](https://praktika.ai/) · [Futurepedia](https://www.futurepedia.io/tool/praktika-ai) · [App Store](https://apps.apple.com/us/app/praktika-ai-language-tutor/id1624701477) · [Practiceme](https://practiceme.app/vs/praktika) · [Medium (teacher review)](https://oh-yeah-sarah.medium.com/unbiased-praktika-review-by-a-qualified-language-teacher-bf14a26e9813)

**Validates**: **V11** (voice/AI-tutor unit economics — $0.12-hr-voice target sits against a market that prices AI voice practice at $8–168/yr), **V10**, and **B18/C9** (conversation as the AI-gated monetization surface).

**Actionable takeaway**: AI-voice/conversation is a proven monetizable surface (Speak/Praktika/Max), but **grammar-explanation depth is the weakness** competitors leave open — PinyinPal's E.1 Explain (free-for-registered, P15) + E.2 Conversation (auth-gated) is a differentiated pairing. Praktika's ~$8/mo effective annual and $2M/mo revenue signal real WTP for avatar-driven practice.

---

## 3. HSK 2025 Syllabus / Linguistic Reference

### M6 — HSK 3.0 Rollout & New Syllabus

**Key findings** (verbatim — definitive figure set):

- Rollout: **first global trial test Jan 31, 2026**; official rollout effective **July 2026**; **June 28, 2026** = last HSK 2.0 sitting; official syllabus published by **CLEC in November 2025**. [Mandarin Zone](https://www.mandarinzone.com/hsk-test-dates-2026/) · [Hskstory](https://hskstory.com/guides/hsk-30-vocabulary-complete)
- Structure: 6 levels → **9 levels** (Elementary 1–3 / Intermediate 4–6 / Advanced 7–9). [Mandarin Zone](https://www.mandarinzone.com/hsk-test-dates-2026/)
- **Vocabulary counts (cumulative): L1=300, L2=500, L3=1,000, L4=2,000, L5=3,600, L6=5,400, L7–9=11,000 total.** vs HSK 2.0: 150/300/600/1,200/2,500/5,000. [HanziStroke](https://www.hanzistroke.com/hsk)
- Characters: **300 at L1 → ~3,000 by L9**, alongside ~11,000-word ceiling. [Coco Chinese](https://www.coco-chinese.com/blog/characters-per-hsk-level)
- Full syllabus: **11,000 numbered vocabulary entries (10,896 distinct after dedup)**; characters split into 词汇字 (vocabulary chars), 认读字 (recognition chars), 书写字 (writing chars). [Hskstory](https://hskstory.com/guides/hsk-30-vocabulary-complete)

**Validates**: **override-2** (HSK 2025 rebase) — the finalized L1–6 word counts (300…5,400) match the rebase spec exactly; **F2** (HSK 2025-rebase, GATED on data).

**Actionable takeaway**: the rebase's L1–6 figures are now **confirmed by multiple 2026 sources** (300/500/1000/2000/3600/5400). The 11,000-total / 10,896-distinct distinction is the authoritative anchor for the ~11,000 word-count framing.

### M7 — Pinyin Phonemes

**Key findings** (verbatim):

- **Initials: 21** (b, p, m, f, d, t, n, l, g, k, h, j, q, x, zh, ch, sh, r, z, c, s) — consistent across sources. [Zhong Chinese](https://zhongchinese.com/pinyin-chart/)
- **Finals: ~35 / 36 / 39** depending on whether zero-initial (y/w) spellings and retroflex 儿/er are counted separately; grouped by medial (open / i / u / ü). [Elon.io](https://elon.io/grammar/chinese-mandarin/hanzi/pinyin-syllable-structure) · [Dig Mandarin](https://www.digmandarin.com/learn-chinese-pinyin.html) · [Scribd pinyin table](https://www.scribd.com/doc/171380615/Pinyin-Table)
- Syllable inventory: 21 initials × ~35 finals (not all pairings valid) → **~1,300 distinct syllables** before tones. [Elon.io](https://elon.io/grammar/chinese-mandarin/hanzi/pinyin-syllable-structure)
- Tones: **4 basic + 1 neutral**. [Dig Mandarin](https://www.digmandarin.com/learn-chinese-pinyin.html)

**Validates**: **D14** (pinyin phoneme gap — `PinyinPhoneme` 18+32 → target 21+38; the 38–39 finals figure brackets the D14 target).

**Actionable takeaway**: 21 initials confirmed; finals variance (35/36/39) means D14 should pin the **38–39** count (the standard incl. er/ê/üan/ün/apical-i/ueng) and document the counting convention; ~1,300 syllables + 4+1 tones are the reference inventory.

### M8 — Reference Counts

**Key findings** (verbatim):

- **Kangxi radicals: 214** (Kangxi Dictionary, 1716), sorted by stroke count; lists 47,035 characters across 214 radicals (~220 avg / 64 median per radical). **Since 2009 the PRC promotes a separate 201-radical standard for Simplified Chinese** — relevant if targeting Mainland learners. [Wikipedia](https://en.wikipedia.org/wiki/Kangxi_radical) · [HandWiki](https://handwiki.org/wiki/Kangxi_radical)
- **Chengyu**: no single authoritative number — Xinhua Chengyu Da Cidian lists 20,000+; broader/older compilations 30,000–50,000; native speakers know ~5,000–8,000; **~500 core idioms** is considered sufficient for intermediate learners; **300–500** cited for fluency-adjacent cultural competence. [Mengxueclass](https://mengxueclass.com/how-many-chinese-idioms-are-there/) · [Chinese Idioms](https://www.chineseidioms.com/faq) · [Sapore di Cina](https://www.saporedicina.com/english/list-chengyu/)
- **HSK characters**: HSK 2.0 had no official char list (2,600 was a widely-used approximation for HSK 6). HSK 3.0 specifies chars **300 at L1 → ~3,000 at L9** — "likely the source of the 3,088 figure in your prompt, though I could not find that exact number independently confirmed; the closest official anchor is the ~3,000-character ceiling for the full 9-level HSK 3.0 system." [Coco Chinese](https://www.coco-chinese.com/blog/characters-per-hsk-level)

**Validates**: **D15** (radicals — Kangxi 214 is the reference index; PRC 201-standard note), **override-2** (char-total open item — see Flags), and F5 (chengyu 55-idiom subset is defensible vs ~500 core).

**Actionable takeaway**: radical expansion path (20→50→100) is well below the 214 reference — defensible as an MVP subset; Core-300 (D15) can be framed against the ~3,000-char HSK ceiling. Chengyu 55 = tiny defensible subset of ~500 core. **The 3,088-vs-3,109 char total remains unresolved** (see Flags §b).

---

## 4. Practice & Pedagogy

### M9 — Tone / ASR Vendors

**Key findings** (verbatim):

- **iFlytek (讯飞) ISE 语音评测**: pricing pages are **JS-rendered / login-gated — exact current RMB per-call pricing NOT retrievable** via search/fetch. Confirmed: legacy "普通版" standard tier **deprecated Aug 2020** in favor of streaming (流式版); legacy WebAPI renewals need a support ticket. Product returns a **声韵分 (initial/final accuracy)** and **调型分 (tone-accuracy)** score for Chinese — exactly the tone-feedback signal PinyinPal wants. [Xfyun FAQ](https://www.xfyun.cn/doc/voiceservice/ise/ise_faq.html) · [Ai-sip API doc](https://www.ai-sip.com/doc/voiceservice/ise/API.html) → **recommend direct console/sales contact** (Flag a).
- Adjacent iFlytek transcription (讯飞听见): ¥2.17/min Chinese, ¥30/min English (human-verified). [Iflyrec](https://m.iflyrec.com/help/help_charge.html) General ASR comparison: domestic CN vendors (Baidu/Alibaba/Tencent) ~¥50–70 per 10K calls; Azure/Google ~$0.006/min internationally. [Xfyun](https://www.xfyun.cn/site/1867.html)
- **Azure Speech (zh-CN) pronunciation assessment**: **costs the same as standard STT — no separate premium**. 2026 rates: **real-time standard $1/audio hr**, fast $0.36/hr, batch $0.18/hr; custom models $1.20/hr (real-time) / $0.225/hr (batch) + $10/compute-hr training + ~$0.054/model-hr hosting. Enhanced features (diarization, language ID, **pronunciation assessment**) **+$0.30/hr/feature real-time, free in batch**. **zh-CN is one of only two locales (with en-US) supporting phoneme-level SAPI scoring**. Free tier (F0): **5 audio hrs/mo**. [Azure Docs](https://docs.azure.cn/en-us/ai-services/speech-service/how-to-pronunciation-assessment) · [Blocksentient](https://blocksentient.com/review/microsoft-azure-speech-service/)
- **FunASR (open source) beats Whisper on Mandarin** (2026 benchmarks): **SenseVoice-Small 7.81% CER vs Whisper-large-v3 20.02%** (turbo 21.71%) — ~half the error rate, ~12× faster on GPU (169.6x vs 13.4x realtime), still beats Whisper-on-GPU from CPU (17.2x). **Paraformer 9.9%**, **Fun-ASR-Nano 8.3%** vs Whisper-class ~22–31% (~2.7× gap). Frontier: **FireRedASR2-LLM 2.89% avg CER** across 4 public Mandarin benchmarks (Feb 2026; beats Doubao-ASR, Qwen3-ASR, Fun-ASR). [Funasr blog](https://www.funasr.com/en/blog/funasr-vs-whisper-benchmark.html) · [Funasr vs faster-whisper](https://www.funasr.com/en/blog/funasr-vs-faster-whisper-chinese.html) · [arXiv 2603.10420](https://arxiv.org/html/2603.10420v1)
- **Methodological**: **CER (not WER) is the standard Mandarin metric** (no whitespace word boundaries). [Hamming AI](https://hamming.ai/resources/voice-agent-evaluation-metrics-guide)

**Validates**: **Q11** (ASR vendor/budget — de-gates **B19**). The do-not-trust discipline ("no vendor tone-error-rate") still holds: **none of these sources publish an explicit tone-error-rate** — that remains PinyinPal's open differentiator if Q11 passes.

**Actionable takeaway**: Azure zh-CN pronunciation assessment at **standard-STT price ($1/hr real-time, ~$0.0167/min)** with phoneme-level SAPI scoring is the **lowest-friction Q11 candidate** (5-hr/mo free tier); FunASR SenseVoice is the self-hosted cost floor (~7.8% CER). iFlytek ISE pricing needs direct contact before it can be compared. **V11's $0.12-hr-voice is ~7× Azure's raw STT rate** — generous headroom, but tone-scoring/batch/annotation add on.

### M10 — Practice-Format Design

**Key findings**:

- **Cloze generation** = fundamentally a **distractor-generation** problem (1 correct + ~3 distractors); poor distractors undermine validity; shift from knowledge-graph (Probase/WordNet) to **pretrained-LLM-based ranking (CDGP)** which "significantly outperforms" older baselines. [arXiv 2403.10326](https://arxiv.org/pdf/2403.10326)
- 2026 framework **Questify-TheEduBot**: transformer-based (BERT/GPT) generation + keyword extraction + topic modeling → MCQ/cloze/descriptive questions, reportedly >90% quality (per abstract), pedagogical gains over template/Seq2Seq baselines in human eval. [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0306457326000051)
- **Personalized cloze** (2024): LLM generation tuned to a learner's CEFR level; selects vocab on gap between item difficulty and estimated learner ability. [ACL Anthology](https://aclanthology.org/2024.inlg-main.26.pdf)
- **Listening dictation pedagogy**: dictation = listening comprehension + spelling accuracy + phonetic processing in one task — **"an active analysis-by-synthesis process," not passive echoing (Oller & Streiff, 1975)**; **correlates more strongly with overall L2 proficiency** than vocab/cloze/writing tests; narrows performance gaps (equitable outcomes); embodies both comprehensible input AND output. [ERIC EJ1240717](https://files.eric.ed.gov/fulltext/EJ1240717.pdf) · [ResearchGate](https://www.researchgate.net/publication/375061362_A_STUDY_ON_IMPROVING_LISTENING_SKILLS_WITH_DICTATION_FOR_SECOND_ENGLISH_MAJOR_STUDENTS_AT_HUNG_YEN_UNIVERSITY_OF_TECHNOLOGY_AND_EDUCATION) · [Bcpublication](https://bcpublication.org/index.php/SJOHSS/article/download/7519/7482/9022)
- Nuances: **dictation + explicit listening-strategy instruction > raw transcription drills**; dictation is most effective with **already-known vocabulary in unfamiliar collocations** (chunking/phrase-level reinforcement). [ResearchGate](https://www.researchgate.net/publication/360227850_The_Effectiveness_of_Frequent_Dictation_Practices_in_Students'_Listening_Performance) · [Sage Journals](https://journals.sagepub.com/doi/10.1177/13621688221117242)

**Validates**: **B6** (cloze Q6), **B9** (listening dictation Q9), and P1/P5 (curated-content-first; LLM generation defers to E.4).

**Actionable takeaway**: dictation is pedagogically **high-value and correlates with proficiency** — a strong justification for Q9; the distractor-generation literature says B6's quality hinges on **distractor selection**, and the personalized-LLM-cloze work prefigures E.4/N2. Strategy-scaffolded (not bare) dictation is the better UX.

### M11 — SRS / FSRS

**Key findings** (verbatim):

- **FSRS = Anki default since 23.10 (released Oct 31, 2023)**; created by Jarrett Ye; trained on **700M real reviews from 20,000 Anki users**; replaces SM-2 (fixed ease-factor, Wozniak 1980s). Mechanism = Three Component Model (Retrievability R = f(time, Stability S)); ML-fit per-user weights from Again/Hard/Good/Easy presses. [MedAnkiGen](https://medankigen.com/blog/fsrs-anki) · [Anki FAQ](https://faqs.ankiweb.net/what-spaced-repetition-algorithm) · [StudyCards AI](https://studycardsai.com/blog/anki-fsrs-algorithm)
- Efficiency: **15–20% fewer reviews** at same retention (one source: 20–30% vs SM-2). Setup: enable FSRS, **desired retention 0.85–0.90**, new cards 15–25/day, **re-run "Optimize" ~monthly**; **Optimize needs ~400 reviews min (Anki 24.04; 1,000 in older versions)** before beating defaults. [Lingomoto](https://www.lingomoto.com/posts/best-anki-settings-language-learning) · [StudyCards AI](https://studycardsai.com/blog/anki-fsrs-algorithm) · [fsrs4anki tutorial](https://github.com/open-spaced-repetition/fsrs4anki/blob/main/docs/tutorial.md)
- FSRS open-source dev is **directly funded by 墨墨背单词 (MaiMemo Inc.)**, a Chinese vocab-app company. [fsrs4anki wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm)
- **Interleaving vs blocked** — contested, domain-dependent:
  - General: interleaving may impede training but increases long-term learning (contextual-interference effect); replicates at 30-day delays. [nih PMC4989027](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4989027/) · [arXiv 2504.00707](https://arxiv.org/pdf/2504.00707)
  - L2 grammar: interleaving stronger for similar-between-categories; **blocking advantage for word-based material (g = −0.39)**. [ResearchGate](https://www.researchgate.net/publication/392777843_The_effects_of_interleaving_and_blocking_practice_on_L2_contextualized_grammar_learning)
  - Fluency vs accuracy (French grammar, 2026): **blocked → greater fluency** (fewer mid-clause pauses); **interleaved → greater accuracy** at fluency's expense (blocking = proceduralization; interleaving = error-correction/discrimination). [John Benjamins](https://www.jbe-platform.com/content/journals/10.1075/jsls.00047.buh)
  - **Pronunciation: blocked/high-similarity sequencing may beat interleaving** — directly relevant to tone-drill sequencing. [ResearchGate](https://www.researchgate.net/publication/234142482_The_effects_of_interleaving_versus_blocking_on_foreign_language_pronunciation_learning)
  - Low-achieving learners (2025): interleaving = "undesirable difficulty" → **blocked→interleaved progression** better. Heuristic: block to generalize a pattern (tone class/grammar rule); interleave to discriminate confusable items (minimal-pair tones). [Wiley](https://onlinelibrary.wiley.com/doi/10.1111/lang.12659)
- **Kim & Webb (2022)** — definitive L2 spacing meta-analysis (Language Learning): **98 effect sizes, 48 experiments, N=3,411**; spaced vs massed / longer vs shorter / equal vs expanding. **Overall g = 1.15** (spaced vs massed). **Immediate feedback g = 1.04 (95% CI [0.59, 1.49])**; delayed feedback g = 0.64–2.34 (95% CI [0.15, 3.04]). Positive spacing effects also for L2 grammar/morphology & pronunciation, but may draw on different memory systems. **Follow-up (2023)**: spaced benefits were **greater for fill-in-the-blanks than flashcards** on immediate posttest — contradicts Kim & Webb's own earlier unstable fill-in-the-blanks note → format×spacing interaction still open. [Wiley](https://onlinelibrary.wiley.com/doi/abs/10.1111/lang.12479) · [Academia.edu](https://www.academia.edu/120579340/Does_spaced_practice_have_the_same_effects_on_different_second_language_vocabulary_learning_activities_Fill_in_the_blanks_versus_flashcards) · [ResearchGate (feedback)](https://www.researchgate.net/publication/376584142_Does_spaced_practice_have_the_same_effects_on_different_second_language_vocabulary_learning_activities_Fill-in-the-blanks_versus_flashcards) · [ResearchGate (meta)](https://www.researchgate.net/publication/358406370_The_Effects_of_Spaced_Practice_on_Second_Language_Learning_A_Meta-Analysis)

**Validates**: **T3/T11/T14** (FSRS-6 via pinned `ts-fsrs`; **not `py-fsrs`** — do-not-trust item), retention 0.85–0.90, and **S5/B16** (interleaved mixed-type review). The pronunciation-blocking finding directly informs **tone-drill sequencing** (B10 tone-judgment / tone review).

**Actionable takeaway**: FSRS's 15–20% efficiency + 0.85–0.90 retention + ~400-review Optimize threshold give concrete targets for `srs-core`/`ts-fsrs` integration (epic-34). **Do-not-trust reconciliation**: the do-not-trust list bans citing g=0.74 (a **misattribution belonging to Latimier 2021**); the correct Kim & Webb (2022) spaced-vs-massed figure is **g=1.15** (see Flags §c). For tone drills, **blocked/high-similarity sequencing is the evidence-backed default** — a design nuance for tone-review/quiz.

---

## 5. Embedded AI / RAG

### M12 — RAG / Hybrid: "Do You Even Need RAG" for Small Corpora (+ pgvector vs Qdrant vs Pinecone)

**Key findings**:

- 2026 consensus swung toward questioning RAG by default: 200K+ (Gemini up to 2M) token contexts displace RAG for **small, stable corpora** (policy docs, product catalog, internal guidelines). [Sthambh](https://www.sthambh.com/blog/when-you-need-rag-2026)
- **Scale guidance: full-context works for 10–500 docs (one builder: 95% token reduction vs context-stuffing); scales poorly past ~1,000 docs** → real RAG needed. Decision heuristic: large/frequently-changing corpus → RAG; hard/multi-step/multi-doc → hybrid; else detail. [TrueStandard](https://truestandard.ai/blog/long-context-vs-rag-2026) · [Open-TechStack](https://open-techstack.com/blog/rag-vs-long-context-2026/)
- **Four legitimate RAG reasons** even for small setups: **freshness, permissions, reliability/citations, latency/cost**. "Your content and product design matter more than your embedding model" — most "RAG doesn't work" complaints trace to underspecified questions/flaky ingestion/access control/near-duplicates, not retrieval. [Field Journal](https://fieldjournal.ai/blog/the-return-of-rag-in-2026/)
- **RAG vs CAG**: seven axes (corpus size, freshness, latency budget, cost shape, citation auditability, query distribution, tenant model). Freshness rule: if you rewrite the cache more than once per 10K reads, RAG is cheaper. Retrieval hop costs **100–500ms** — CAG removes it (matters for sub-500ms first tokens: voice/autocomplete). [Substack futureagi](https://futureagi.substack.com/p/rag-vs-cag-when-to-stop-retrieving)
- **pgvector vs Qdrant vs Pinecone (2026)**: Pinecone = fully managed, zero-ops, sub-20ms p95 at 5M+ vectors but **3–8× cost of comparable Postgres**; Qdrant = Rust OSS, best self-hosted economics, **~850 QPS (p95 ~8ms) on 1M vectors**, best-in-class filtered search; **pgvector = default for most RAG builds (runs inside Postgres, 2M vectors without special tuning)**; aggressive pgvectorscale benchmark: **471 QPS @ 99% recall on 50M vectors** (11.4× better than Qdrant, p95 28× lower than Pinecone s1). Crossover ~10M vectors; 100M+ → self-host Qdrant/Weaviate/Milvus justified. Default recommendation: **Qdrant (best balance) or pgvector (already on Postgres)**; Pinecone only for zero-ops premium. [CallMissed](https://www.callmissed.com/en/blog/vector-database-comparison-2026) · [Kalvium Labs](https://www.kalviumlabs.ai/blog/vector-databases-compared-pgvector-pinecone-qdrant-weaviate/) · [Firecrawl](https://www.firecrawl.dev/blog/best-vector-databases) · [TigerData](https://www.tigerdata.com/blog/pgvector-vs-qdrant) · [Vecstore](https://vecstore.app/blog/vector-database-performance-compared)
- PinyinPal implication (from source): grammar explanations + HSK vocab + a few hundred graded passages is **squarely "you might not need RAG"** — full-context prompting or a lightweight retrieval layer (not a vector DB) may suffice.

**Validates**: **RAG-1** (C16 — the gate criterion: embeddings only if the E.2 golden free-form set top-1 retrieval hit-rate drops below ~85% / high low-confidence-turn share) and **S14** (deterministic retrieval first). **pgvector (Neon reservation) is the right default** if RAG-1 fires — matches the existing C16 pgvector-column-reservation design.

**Actionable takeaway**: the C16 hybrid-ready, pgvector-reserved, deterministic-first design is **2026-validated**; the golden set (authored at E.0/E.1) is the correct gate instrument. **Do not build embeddings before RAG-1 fires** — the research supports deferring.

### M13 — Embeddings: Best Multilingual Model / MTEB (2026)

**Key findings**:

- **Qwen3-Embedding-8B**: best open-weight multilingual (70.6 MTEB), strong cross-lingual; ~75% avg MTEB tasks on MTEB v2 (open-weight top). [Ailog](https://app.ailog.fr/en/blog/news/embedding-models-2026) · [Presenc AI](https://presenc.ai/research/best-open-weight-embedding-models-2026)
- **Google Gemini Embedding**: strong multilingual at **$0.15/1M tokens ($0.075 batch)**; on MMTEB multilingual leaderboard the top spot (as of Jul 2026) is **Tencent KaLM-Embedding-Gemma3-12B @ 72.32**; Gemini Embedding led on MTEB(Multilingual) at release (Classification +9.6, Clustering +3.7, Retrieval +9.0 vs 2nd-best). [Ailog](https://app.ailog.fr/en/blog/guides/choosing-embedding-models) · [arXiv 2503.07891](https://arxiv.org/pdf/2503.07891)
- **BGE-M3 = production "workhorse"** (MIT, 100+ languages, dense+sparse+multi-vector in one model) + BGE-reranker-v2 for self-hosted multilingual RAG. [Innovativeais](https://innovativeais.com/blog/best-embedding-models-for-rag-in-2026)
- **C-MTEB** = dedicated Chinese MTEB variant — check directly for Chinese-optimized rankings. [arXiv 2510.23896](https://arxiv.org/pdf/2510.23896)
- Practical: **test on your own data** — leaderboards are a starting point; **768–1024 dims** = best precision/cost for most RAG; Matryoshka can cut to 256 dims with only 2–3% precision loss. [Innovativeais](https://innovativeais.com/blog/best-embedding-models-for-rag-in-2026) · [Ailog](https://app.ailog.fr/en/blog/news/embedding-models-2026)

**Validates**: **RAG-1** / **C18** (embeddings pipeline story — model/version/dimension/refresh decisions, gated on RAG-1).

**Actionable takeaway**: if/when RAG-1 fires, the source supports a **BGE-M3 (self-host) or Qwen3-Embedding-8B** path, with **Gemini Embedding at $0.15/1M** as the API convenience option; **C-MTEB** is the Chinese-specific benchmark to validate against; 768–1024 dims is the default.

### M14 — Question-Gen Quality: LLM-as-Judge & Generate-Then-Validate

**Key findings**:

- **LLM-as-judge agrees with human reviewers ~85% of the time** — higher than human-human agreement on the same task; the default 2026 eval method. [Confident AI](https://www.confident-ai.com/blog/why-llm-as-a-judge-is-the-best-llm-evaluation-method)
- **QAG (question-answer generation) metrics**: decompose a broad quality judgment into closed-ended yes/no questions, score from answers — directly applicable to scoring generated practice questions for clarity/correctness pre-serve. [DeepEval](https://deepeval.com/blog/llm-as-a-judge)
- Failure modes: **self-preference bias** (judge rates its own model family higher — GPT-4 judge+generator partly measures stylistic similarity); **reference dependency** (without high-quality references, judge "vibes" on open-ended tasks). [Medium (2026 toolkit)](https://medium.com/@vinayak.talikot/llm-as-judge-got-us-this-far-here-is-what-2026-adds-to-the-toolkit-6922e3b532b3)
- 2026 operational trend: evals in the deployment pipeline (every PR runs evals before merge); newest pattern (Galileo, early 2026): pre-prod evals auto-convert to **production guardrails** (eval scores control agent actions/escalation at runtime). [Medium (2026 toolkit)](https://medium.com/@vinayak.talikot/llm-as-judge-got-us-this-far-here-is-what-2026-adds-to-the-toolkit-6922e3b532b3)
- **Generate-then-validate** (Wei, Stamper, Carvalho — CMU, accepted **LAK'26**, Dec 2025/Jan 2026): expansive generation → selective validation via probabilistic reasoning, **using small language models**; two evals (7 human experts + LLM judge) found most judges agreed questions had clear answers and aligned with learning objectives. [arXiv 2512.10110](https://www.arxiv.org/pdf/2512.10110)
- **DailyMed medical-education pipeline** (production reference): generate question/options/hint/explanation → retrieve supporting papers (Semantic Scholar) from a query derived from the question → use abstracts to verify → **regenerate on failure** → only verified questions proceed to difficulty grading + final validity check. A strong template for validating generated cloze/vocab questions. [medrxiv](https://www.medrxiv.org/content/10.1101/2024.11.11.24317087.full.pdf)

**Validates**: **S15-amended** (**C17** — Guardian E.4 question-quality eval: LLM-as-judge spot-check + generate-then-validate pattern beyond constraint checks).

**Actionable takeaway**: C17 should combine **LLM-as-judge spot-checks (~85% agreement baseline)** with the **retrieval-grounded generate-then-validate loop** (DailyMed template) — with explicit mitigation for **self-preference bias** (judge ≠ generator model family) and **reference dependency** (maintain high-quality reference answers).

### M15 — Conversational AI: Duolingo Max Video Call Architecture

**Key findings**:

- **Underlying model: OpenAI GPT-4**, above Super Duolingo, 188 countries; Video Call for Spanish/French/German/Italian/Portuguese + Japanese/Korean/Chinese (**Chinese = Video Call only, no Roleplay**). [AgentsIndex](https://agentsindex.ai/duolingo-max)
- **Development-speed signal**: "within a day we were able to build a prototype… gets us from zero-to-ninety-five-percent very quickly; then hand-tuning data for the last five percent" — core loop leans on GPT-4 native capability, not heavy fine-tuning. [OpenAI](https://openai.com/index/duolingo/)
- Broader architecture (**case-study writeup — treat with caution, secondary/marketing-adjacent**): proprietary NLP pipeline fine-tuned on millions of lesson interactions; internal LLM **"Birdbrain" (Llama-based)** generates adaptive lessons (content-creation weeks→hours); hallucination guardrails via prompt engineering + human review. [Reruption](https://reruption.com/en/knowledge/industry-cases/duolingo-max-gpt-4-transforms-language-tutoring)
- Feature mechanics: Lily has **memory of prior calls**, adapts to skill level, varies context per session; **post-2025**: expressive animations, conversation transcripts for post-call review, proactive "Lily calls you" re-engagement prompts. **Error handling**: users report AI mistakes by holding an inaccurate message → flagged for retraining (lightweight human-in-the-loop QA in the conversational UI). [Duolingo blog](https://blog.duolingo.com/duolingo-max) · [Investors](https://investors.duolingo.com/news-releases/news-release-details/duolingo-launches-ai-powered-video-call-android)
- **User-state injection patterns** (general best practice): core behavioral guidelines constant + elements adapting to user; **task-specific injection** (temporary instructions per operation). State-injection architecture: structured state object (profile + notes, local-first), distill during session (tool call → session notes), consolidate to global notes at end (dedup + conflict resolution), inject state summary at each new run/turn with precedence rules. [Tetrate](https://tetrate.io/learn/ai/system-prompts-guide) · [OpenAI Developers context-personalization](https://developers.openai.com/cookbook/examples/agents_sdk/context_personalization)
- Context-window management: keep last N user turns; on trim, **re-inject session-scoped memories into the system prompt next turn**. Consistency risk: personalization must balance adaptation with stable persona. [OpenAI Developers](https://developers.openai.com/cookbook/examples/agents_sdk/context_personalization) · [Tetrate](https://tetrate.io/learn/ai/system-prompts-guide)

**Validates**: **AS12** (**C15** — learner-context snapshot assembled from E.5 endpoints and injected as system context), **C9/E.2** (conversation), and B18.

**Actionable takeaway**: the **OpenAI context-personalization pattern (distill → consolidate → re-inject)** maps 1:1 onto C15/AS12 (known vocab, weak tone-pairs, recent topics) and the E.2 conversation memory design. The "report a mistake" in-UI QA loop is a cheap, high-value addition to C11/Guardian. **Flag**: the "Birdbrain/Llama/NLP-pipeline" architecture details are a **marketing-adjacent secondary source** — don't cite as primary.

### M16 — Personalization: Adaptive Item Difficulty Without Large Data

**Key findings**:

- **Half-Life Regression (HLR)** — Duolingo's foundational model (Settles & Meeder, ACL): **p = 2^(−Δ/h)** (p = recall probability, Δ = days since last seen, h = half-life); half-life **ĥ = 2^(Θ·x)** (learned weight vector over feature vector). Reduced prediction error **45%+** vs baselines; **+12% daily student engagement** in operational study. MIT-licensed + **13M-row training dataset on GitHub**. [arXiv 2004.11327](https://arxiv.org/pdf/2004.11327) · [Duolingo research](https://research.duolingo.com/papers/settles.acl16.pdf) · [Semantic Scholar](https://www.semanticscholar.org/paper/A-Trainable-Spaced-Repetition-Model-for-Language-Settles-Meeder/cb836d2b8e126dc31ded5e674d73021604dcc6e0) · [GitHub halflife-regression](https://github.com/duolingo/halflife-regression)
- Difficulty modeling: learned per-lexeme weights by linguistic characteristics — irregular verbs/abstract concepts → low half-life (fast decay); cognates → high half-life. **For Mandarin**: tone-pair confusability, stroke count, radical-sharing with known characters = natural difficulty features. [Medium](https://medium.com/@rohithparambil/how-duolingo-predicts-when-youll-forget-using-data-mining-2abab0a921f4)
- 2026 evolution: HLR (predict when to show) + **LLMs (generate novel practice sentences with that word)** — infinite contextual variation from a fixed bank. [Medium](https://medium.com/@rohithparambil/how-duolingo-predicts-when-youll-forget-using-data-mining-2abab0a921f4)
- **Cold-start difficulty estimation** (the direct M16 answer):
  - Duolingo English Test: **multi-task generalized linear model with BERT features**; quality with **as few as 500 test-takers, ~6 exposures/item, ~4,000-item bank** — limits exposure, no full piloting. [Nau](https://experts.nau.edu/en/publications/jump-starting-item-parameters-for-adaptive-language-tests/)
  - **LLM-as-difficulty-rater (newest, small-team relevant)**: off-the-shelf LLMs rate zero-data items (2026: GPT-4o, DeepSeek-V3.2, Qwen3-235B tested) — "best understood as an **emerging methodological direction, not a finished solution**." [arXiv 2605.18562](https://arxiv.org/abs/2605.18562)
  - **Hybrid neural-IRT**: dynamic fusion shifts weight from neural cold-start (aux info) to classical IRT as data accumulates — graceful-handoff template for launching new HSK content without a big user base. [DOI 10.3390/computers15020132](https://doi.org/10.3390/computers15020132)
  - General principle: cold-start difficulty mitigation (predict from item features before response data) **meaningfully improves learning outcomes** given sufficient difficulty variability. [ResearchGate](https://www.researchgate.net/publication/350081539_Alleviating_the_Cold_Start_Problem_in_Adaptive_Learning_using_Data-Driven_Difficulty_Estimates)

**Validates**: **T2.3/D7** (adaptive item difficulty; missing `responseMs` gap), **C10** (weak-item recommender), and the from-scratch §19 tracking substrate.

**Actionable takeaway**: **LLM-as-difficulty-rater is explicitly "emerging, not finished"** — do NOT gate a launch on it; the **hybrid neural-IRT fusion** (or DET-style BERT-feature cold-start) is the more proven template, but for v1 the FSRS-free rule/score recommender (C10, SU1–SU3) remains the correct scope. HLR is a reference model for the future Tier-2 deep-modeling phase, not v1.

---

## 6. Platform & Operations

### M17 — LLM / Voice Costs

**Key findings** (verbatim):

- **Gemini pricing restructured at I/O 2026**: Google AI Ultra $249.99→**$99.99/mo**; Prepay/Postpay billing from **March 23, 2026** (replacing pay-as-you-go). [CloudZero](https://www.cloudzero.com/blog/gemini-pricing/)
- **Model ladder (Aug 2026)**: Gemini **3.1 Pro and 3 Pro $2/$12** per M input/output (≤200K tokens); **3.6 Flash $1.50/$7.50**; **3.5 Flash-Lite $0.30/$2.50**; **2.5 Flash-Lite $0.10/$0.40 = floor**. [BenchLM](https://benchlm.ai/google/api-pricing)
- Long-context penalty: Pro rates to 200K only — beyond: 3.1 Pro/3 Pro **$4/$18**; 2.5 Pro $1.25/$10 → **$2.50/$15**. [BenchLM](https://benchlm.ai/google/api-pricing)
- Cost levers: **Batch API −~50%** (3.1 Pro → $1.00/$6.00); **prompt caching 10% of base input on cache reads**, storage $1–4.50/M tokens/hr by model. [Costgoat](https://costgoat.com/pricing/gemini-api)
- **Audio input** bills higher than text: **$0.50/M on 3.1 Flash-Lite, $1.00/M on 3 Flash**; video gen from $0.15/sec. [Puter](https://developer.puter.com/tutorials/gemini-api-pricing/)
- **Retirement watch: Gemini 2.0 Flash/Flash-Lite shut down Jun 1, 2026; the entire 2.5 family retires Oct 16, 2026** → plan 3.x for anything long-term. [Curlscape](https://curlscape.com/blog/google-gemini-api-pricing-guide-2026)
- **Azure ASR** (builds on M9): real-time standard **$1/audio hr (~$0.0167/min)**, fast $0.36/hr (~$0.006/min), batch $0.18/hr (~$0.003/min); **zh-CN pronunciation assessment = same price as standard STT**; enhanced features (diarization/language ID) +$0.30/hr/feature real-time (free batch); F0 free tier 5 hrs/mo.

**Validates**: **V11** (voice/AI cost assumptions — $0.12-hr-voice vs Azure $0.0167/min raw STT and Gemini audio input rates), **Q11** (ASR cost envelope), and **C7** (AI gateway model choice, epic-29 — the **2.5 retirement Oct 16 2026 affects the AI-gateway model choice**; see Flags §d).

**Actionable takeaway**: pin the AI-gateway (C7/epic-29) to the **3.x line** (3.1 Pro for quality, 3.5 Flash-Lite as the cheap workhorse, 2.5 Flash-Lite only until Oct 16 2026); **batch −50%** for async content-gen (C4/passage-gen); caching (10%) for repeated system-prompt/context reads (C15/AS12 injection). Voice cost headroom: even Gemini audio input ($0.50–1.00/M tokens) + Azure STT ($0.0167/min) stays well under V11's $0.12-hr-voice.

### M18 — GDPR / Consent Mode & Analytics Guidance

**Key findings** (verbatim):

- **Consent Mode v2 mandatory for all Google advertisers in 2026**; **Google Signals removed Jun 15, 2026** (two-gate consent → single Consent Mode control) — likely a "material change" under GDPR requiring privacy-notice updates; CCPA/CPA ripple. [Elementor](https://elementor.com/blog/ultimate-how-set-up-google-analytics/) · [CookieHub](https://www.cookiehub.com/blog/google-analytics-google-ads-consent-mode-v2-2026)
- Configuration: "Basic" Consent Mode blocks collection until consent; "Advanced" recovers up to **65%** of ad-click→conversion data from non-consenting users via modeling — but needs **≥700 ad clicks over 7 days** (a threshold small apps may not clear). [Elementor](https://elementor.com/blog/ultimate-how-set-up-google-analytics/)
- Runtime verification = the real compliance bar: lawful GA4 requires consent before non-essential measurement, Consent Mode v2 where applicable, signed DPA, technical retention/transfer controls — then **verify in the browser network tab that tags don't fire pre-consent**. [SecureSpells](https://securespells.com/blog/google-analytics-gdpr-compliance-guide-2026/)
- **EDPB Guidelines 2/2023 on Technical Scope of Art 5(3)** (final Oct 16, 2024): **technology-neutral — covers tracking pixels/beacons, local storage AND IndexedDB, device fingerprinting, URL/cache-based tracking**. **Swapping cookies for "cookieless" pixels/fingerprinting/local storage does NOT dodge consent.** [CookieBeam](https://cookiebeam.com/guides/edpb-cookie-guidance-2026)
- **Art 5(3) (ePrivacy) consent and GDPR Art 6 are separate steps** — storing/reading an analytics cookie needs 5(3) consent regardless of lawful basis; downstream processing needs its own Art 6 basis (most align both on consent). [Consenteo](https://www.consenteo.com/knowledge-hub/GDPR/gdpr_cookie_consent_2026)
- **"Legitimate interest" does NOT substitute for analytics consent** — common, costly misconception. [Consenteo](https://www.consenteo.com/knowledge-hub/GDPR/gdpr_cookie_consent_2026)
- Narrow **non-EU-wide** first-party analytics exemptions: **France (CNIL 2020-092) and Luxembourg (CNPD)** — strictly configured (no ads, no combining, short retention); **NOT pan-EU — the UK ICO requires consent** (confirmed Apr 29, 2026); UK PECR Schedule A1 (in force Feb 2026) adds narrow first-party statistics-only exemptions but **"does not cover Google Analytics."** [Luxgap](https://luxgap.com/articles/cookies-analytics-exemption-cnil-cnpd-consentement-ico-2026?lang=en) · [ConsentPixel](https://consentpixel.com/blogs/uk-cookie-law-pecr-2026/)
- **Dark patterns explicitly enforced** (EDPB 03/2022): pre-selected consent, confusing language, misleading button colors, hard "reject" paths; **consent must be granular** (analytics vs advertising not bundled). [GDPRLedger](https://www.gdprledger.com/guides/cookies-and-consent-gdpr) · [CookieYes](https://www.cookieyes.com/blog/eu-cookie-compliance/)
- Enforcement: total GDPR fines **> €2.1B**; cookie/analytics misconfiguration a significant share. [Elementor](https://elementor.com/blog/ultimate-how-set-up-google-analytics/) · [CookieNox](https://cookienox.com/en/blog/google-analytics-gdpr)

**Validates**: **T12/G7/OB6** (privacy/consent), **T15** (guest session-local IndexedDB — see Flags §e), and the G4 consent-gated error-capture design.

**Actionable takeaway**: for EU users: (1) genuine pre-consent blocking (not just Consent Mode signaling) for any Google-ecosystem analytics; (2) compliant CMP with granular category toggles; (3) **"legitimate interest" = non-starter for analytics**; (4) do NOT rely on FR/LU exemptions unless truly minimal — and never in the UK. **The EDPB 2/2023 IndexedDB/fingerprinting coverage directly implicates the T15 guest IndexedDB queue + T12 telemetry consent design.**

### M19 — Observability

**Key findings** (verbatim):

- **OTel GenAI Semantic Conventions**: SIG formed Apr 2024 under the Semantic Conventions SIG; scope expanded from LLM-client tracing to **six layers: agent orchestration, MCP tool calling, content capture, quality evaluation + LLM tracing**. [Greptime](https://greptime.com/blogs/2026-05-09-opentelemetry-genai-semantic-conventions)
- **Maturity: still "Development" as of May 2026** (GenAI + MCP semconv) — transition plan to be updated before marking stable. [Greptime](https://greptime.com/blogs/2026-05-09-opentelemetry-genai-semantic-conventions)
- **PII-safe by design: no prompt/response content captured by default** — content logging requires explicit opt-in via **`OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true`**. Directly relevant to a language app handling learner speech/text under GDPR. [DEV Community](https://dev.to/x4nent/opentelemetry-genai-semantic-conventions-the-standard-for-llm-observability-1o2a)
- Compatibility: `OTEL_SEMCONV_STABILITY_OPT_IN` enables dual-emission of legacy + new attributes during transitions. Instrumentation maturity: OpenAI Python SDK most mature; Anthropic/Cohere/Bedrock via community libs; LiteLLM auto-tracing via OpenAI-compatible interfaces. Overhead negligible (<1% main-app impact; LLM calls take seconds). Backed by CNCF; adopted across Google Cloud/AWS/Azure/Datadog → avoids vendor lock-in. [DEV Community](https://dev.to/x4nent/opentelemetry-genai-semantic-conventions-the-standard-for-llm-observability-1o2a) · [MLflow](https://mlflow.org/docs/latest/genai/tracing/opentelemetry/genai-semconv/)
- **Liveness/readiness probe best practices** (2026 consensus, consistent):
  - **Liveness must NEVER check external dependencies** — DB-down → restart loop on top of the outage. **Liveness = process health only** (minimal `/healthz`, no dependency logic); **readiness = dependency health** (DB/cache/downstream needed to serve). Liveness answers "stuck?" (kill/restart); readiness answers "serve traffic?" (stop routing, no restart). [DEV Community k8s probes](https://dev.to/young_gao/kubernetes-health-probes-done-right-liveness-readiness-and-startup-5g7g) · [Kubernetes Recipes](https://kubernetes.recipes/recipes/configuration/kubernetes-liveness-probe-best-practices/)
  - Only check dependencies on the critical path; **startup probe** for slow starts (don't inflate liveness timeouts); **readiness aggressive (~10s), liveness moderate (~30s)**; **isolate health infra from the main request path** (separate port/thread pool); set explicit timeouts on readiness dependency checks; **don't reuse one endpoint for all three probe types**; size `failureThreshold × periodSeconds` to the recovery window (e.g., 10s × 3 = 30s). [DEV Community k8s probes](https://dev.to/young_gao/kubernetes-health-probes-done-right-liveness-readiness-and-startup-5g7g) · [Coding Protocols](https://codingprotocols.com/blog/kubernetes-probes-liveness-readiness-startup)

**Validates**: **OB1–OB6** (G-series), especially **OB3/G3** (liveness/readiness split — today `/v1/health` bills a real Gemini call per probe, E9 FIX), **OB6/G6** (AICallLog OTel-GenAI-aligned, no-PII-by-default, content-capture opt-in), and **G4** (consent-gated error capture).

**Actionable takeaway**: **OB6/G6 is directly de-risked** — the GenAI semconv PII-safe default matches the no-PII/retention design (T12), and the "Development" maturity (Flag h) means instrument now but keep `OTEL_SEMCONV_STABILITY_OPT_IN` for dual-emission. G3/E9 should implement the liveness/readiness split exactly per the probe guidance (liveness = no deps, no Gemini; readiness = deps).

---

## Flags / Confidence

The following items are **open, uncertain, or require reconciliation** — the final validation round must treat them accordingly:

**(a) iFlytek ISE exact pricing NOT retrievable.** The 讯飞 语音评测 (ISE) pricing pages are JavaScript-rendered and login-gated; no exact current RMB per-call rates could be pulled (only: legacy 普通版 deprecated Aug 2020; streaming 流式版 current; 讯飞听见 transcription ¥2.17/min CN / ¥30/min EN; domestic CN cloud ASR ~¥50–70/10K calls vs Azure/Google ~$0.006/min). **Recommendation: contact iFlytek's console/sales channel directly** before Q11 can compare it on price. Confidence: HIGH that pricing is behind a login; LOW on any iFlytek per-call figure.

**RESOLVED by §23 (2026-08-14):** iFlytek ISE pricing now recorded — Free New User Package = **100,000 service calls / 3 months / 5 concurrent channels**; paid starts **$150 USD / 100k calls** → **$1,300 / 1M** (FV21). Q11 vendor shortlist + budget now buildable (FV4/FV6).

**(b) HSK character total 3,088 vs 3,109 NOT settled.** The research's closest official anchor is the **~3,000-character ceiling** for the full 9-level HSK 3.0 system (300 at L1 → ~3,000 at L9); the 3,088 figure "could not be independently confirmed." The full syllabus is **11,000 numbered entries / 10,896 distinct**. **The override-2 char-total open item remains OPEN** — it still folds into the rebase scope (settle from the CLEC PDF, image-only). The do-not-trust list's "2,971 = official" claim stands rejected (2,971 = derived unique subset, not official).

**RESOLVED by §23 (2026-08-14):** char total settled at **3,088 distinct** (finalized HSK 3.0, 7–9 ceiling; FV1) — the **3,109 branch is dropped** (legacy/pre-release derived lists: hanzidb.org, nestchinese, legacy Skritter, hanzicraft); 7–9 = **11,000 total / 10,896 distinct** (FV2).

**(c) Kim & Webb 2022 g=1.15 — reconcile, do NOT cite 0.74.** The do-not-trust list (calibration §7.6 / `feature-validation-2026.md`) bans citing **g=0.74**, which is a **misattribution belonging to Latimier (2021)**. This new research reports Kim & Webb (2022) spaced-vs-massed **g=1.15** (98 effect sizes, 48 experiments, N=3,411) — a **different comparison** than the artifact's earlier spaced-vs-massed figures (g=0.58/0.80). **Note both; do not conflate.** The g=1.15 is the correct Kim & Webb (2022) headline spacing effect.

**RESOLVED by §23 (2026-08-14):** **g=1.15 confirmed as the corrected Kim & Webb (2022) headline** (98 effect sizes, 48 experiments, N=3,411, delayed post-tests; FV16); **g=0.74 stays do-not-cite** (Latimier 2021); the g 0.58/0.80 sub-figures remain valid but secondary. No change to T11/T14 (FV17).

**(d) Gemini 2.5 family retires Oct 16, 2026.** Affects the **AI-gateway model choice (epic-29, C7)** — pin to the 3.x line. It does **NOT** affect the **ts-fsrs pin** (T11) — unrelated technology. 2.0 Flash/Flash-Lite already shut down Jun 1, 2026.

**(e) EDPB 2/2023 Art 5(3) tech-neutral scope explicitly covers IndexedDB, fingerprinting, and local storage.** Directly relevant to the **T12/T15 guest IndexedDB + consent design** — a session-local IndexedDB queue and any local-storage-based tracking are within scope of ePrivacy consent, not outside it.

**(f) "Legitimate interest" does NOT justify analytics cookies.** Confirmed repeatedly (Consenteo, EDPB guidance) — consent is required under Art 5(3) regardless of lawful basis for the downstream processing. Relevant to any G7 funnel-capture decision.

**(g) Consent Mode v2 mandatory 2026.** Table stakes for Google-ecosystem measurement; advanced-mode recovery modeling needs ≥700 ad clicks/7 days (small apps may not clear it). FR/LU first-party exemptions are narrow and NOT pan-EU (UK ICO requires consent; UK PECR Schedule A1 "does not cover Google Analytics").

**(h) OTel GenAI semconv still "Development" as of May 2026.** PII-safe by default (content capture opt-in via env var); instrument now but use `OTEL_SEMCONV_STABILITY_OPT_IN` for dual-emission; relevant to OB6/G6 AICallLog design.

**Secondary-source markers** (use with attribution, not as primary):

- Duolingo Max "Birdbrain/Llama/NLP-pipeline" architecture writeup (Reruption) = **marketing-adjacent case study** — treat as directional only.
- Praktika ~$2M/mo iPhone revenue (Sensor Tower via Medium) = third-party estimate.
- Questify-TheEduBot ">90% quality" = per the paper's abstract, human-eval based.
- The 4.5% conversion / 8% churn / $0.12-hr-voice figures in V11 are PinyinPal's own assumptions — this research provides the **external benchmarks** to validate them against (M4/M5/M17), it does not confirm them directly.

---

## Source List (deduped, by theme)

**M1 — Market size**: Global Market Insights (language-learning-market); Business Research Insights (mandarin-learning-market-124154); Emp0 (chinese-language-learning-market-growth); Market Research Future (chinese-language-education-for-k12-market-51123); Verified Market Reports (chinese-e-learning-market); Mandarin Zone (hsk-test-dates-2026); Learningchinesewithhari (post/hsk-2026-schedule)

**M2 — Competitors**: Mandarin Atlas (hellochinese-vs-duolingo-chinese); Migaku (duolingo-chinese-review-vs-alternatives); The Ivy Mandarin (is-duolingo-good-for-learning-chinese); duoplanet (duolingo-video-call); Copycat Cafe (duolingo-max); Neowin (duolingo-brings-ai-video-calling…)

**M3 — Pricing**: Languageappguide (duolingo-cost); Copycat Cafe (duolingo-max); My Engineering Buddy (duolingo-reviews-pricing-alternatives-2026); Checkthat (duolingo/pricing); App Store (hellochinese); FluentU (hellochinese review); App Store (speak); Practiceme (vs/speak); SpeakShark (speak-app-pricing-per-month-2026); Toolradar (speak/pricing); Skritter FAQ; Hacking Chinese (skritter review); App Store (lingodeer-plus); Langoly (lingodeer-review); Languavibe (lingodeer-review)

**M4 — Conversion**: RevenueCat (state-of-subscription-apps; -2026-education); Alphastreet (duolingo subscription engine); Relaunch (duolingo onboarding teardown); Class Central (duolingo-q1-2026)

**M5 — Voice/AI-tutor**: duoplanet (video-call); Copycat Cafe (duolingo-max); Neowin (mandarin boom); Languatalk (speak-app-review); Praktika; Futurepedia (praktika-ai); App Store (praktika); Practiceme (vs/praktika); Medium (praktika teacher review)

**M6 — HSK 3.0**: Mandarin Zone (hsk-test-dates-2026); Hskstory (hsk-30-vocabulary-complete); HanziStroke (hsk); Coco Chinese (characters-per-hsk-level)

**M7 — Pinyin phonemes**: Zhong Chinese (pinyin-chart); Elon.io (pinyin-syllable-structure); Dig Mandarin (learn-chinese-pinyin); Scribd (pinyin-table)

**M8 — Reference counts**: Wikipedia (Kangxi_radicals); HandWiki (Kangxi_radical); Mengxueclass (how-many-chinese-idioms-are-there); Chinese Idioms (faq); Sapore di Cina (list-chengyu); Coco Chinese (characters-per-hsk-level)

**M9 — ASR/tones**: Xfyun (ise FAQ); Ai-sip (ISE API); Iflyrec (help_charge); Xfyun (site 1867); Azure Docs (how-to-pronunciation-assessment); Blocksentient (azure speech review); Funasr (funasr-vs-whisper-benchmark; funasr-vs-faster-whisper-chinese); arXiv 2603.10420 (FireRedASR2-LLM); Hamming AI (voice-agent-evaluation-metrics-guide)

**M10 — Practice formats**: arXiv 2403.10326 (cloze distractors); ScienceDirect S0306457326000051 (Questify-TheEduBot); ACL Anthology 2024.inlg-main.26 (personalized cloze); ERIC EJ1240717 (dictation); ResearchGate (dictation listening study; strategy-integrated dictation); Bcpublication SJOHSS (dictation); Sage Journals 13621688221117242 (multiword dictation)

**M11 — SRS/FSRS**: MedAnkiGen (fsrs-anki); Anki FAQ (what-spaced-repetition-algorithm); StudyCards AI (anki-fsrs-algorithm); Lingomoto (best-anki-settings); GitHub fsrs4anki (tutorial; wiki The-Algorithm); nih PMC4989027; arXiv 2504.00707; ResearchGate (interleaving-blocking L2 grammar; pronunciation; Kim & Webb follow-ups); John Benjamins 10.1075/jsls.00047.buh; Wiley 10.1111/lang.12659; Wiley 10.1111/lang.12479 (Kim & Webb 2022); Academia.edu (spaced practice flashcards)

**M12 — RAG/vector DB**: Sthambh (when-you-need-rag-2026); TrueStandard (long-context-vs-rag-2026); Open-TechStack (rag-vs-long-context-2026); Field Journal (return-of-rag-2026); Substack futureagi (rag-vs-cag); CallMissed (vector-database-comparison-2026); Kalvium Labs (vector-databases-compared); Firecrawl (best-vector-databases); TigerData (pgvector-vs-qdrant); Vecstore (vector-database-performance-compared)

**M13 — Embeddings**: Ailog (embedding-models-2026; choosing-embedding-models); Presenc AI (best-open-weight-embedding-models-2026); Innovativeais (best-embedding-models-for-rag-in-2026); arXiv 2503.07891 (Gemini embedding); arXiv 2510.23896 (C-MTEB)

**M14 — Question-gen quality**: Confident AI (why-llm-as-a-judge); DeepEval (llm-as-a-judge); Medium vinayak.talikot (2026 judge toolkit); arXiv 2512.10110 (generate-then-validate, LAK'26); medrxiv 2024.11.11.24317087 (DailyMed pipeline)

**M15 — Conversational AI**: AgentsIndex (duolingo-max); OpenAI (index/duolingo); Reruption (duolingo-max case study — secondary); Duolingo blog (duolingo-max); Duolingo investors (video-call-android); Tetrate (system-prompts-guide); OpenAI Developers (context_personalization cookbook)

**M16 — Personalization**: arXiv 2004.11327 (HLR); Duolingo research (settles.acl16); Semantic Scholar (halflife-regression paper); GitHub duolingo/halflife-regression; Medium rohithparambil (duolingo data mining); Nau (jump-starting-item-parameters); arXiv 2605.18562 (LLM difficulty raters); DOI 10.3390/computers15020132 (hybrid neural-IRT); ResearchGate (cold start adaptive learning)

**M17 — LLM/voice costs**: CloudZero (gemini-pricing); BenchLM (google/api-pricing); Costgoat (gemini-api pricing); Puter (gemini-api-pricing); Curlscape (google-gemini-api-pricing-guide-2026); Azure Docs (pronunciation assessment); Blocksentient (azure speech review)

**M18 — GDPR/consent**: Elementor (google analytics); CookieHub (consent-mode-v2-2026); SecureSpells (ga4-gdpr-guide-2026); CookieBeam (edpb-cookie-guidance-2026); Consenteo (gdpr_cookie_consent_2026); Luxgap (cnil-cnpd-consentement-ico-2026); ConsentPixel (uk-cookie-law-pecr-2026); GDPRLedger (cookies-and-consent-gdpr); CookieYes (eu-cookie-compliance); CookieNox (google-analytics-gdpr)

**M19 — Observability**: Greptime (2026-05-09 otel genai semconv); DEV Community (x4nent otel-genai-semconv); MLflow (genai semconv docs); DEV Community (young_gao k8s probes); Kubernetes Recipes (liveness-probe-best-practices); Coding Protocols (k8s probes liveness-readiness-startup)

---

## Truth-Check Notes

- **All 19 themes present** (M1–M19), none dropped; each section carries named sources + URLs.
- **Decision-critical numbers** captured verbatim from the source (pricing, CER, conversion %, dates) — see the quick index and per-theme bullets; the full checklist (HSK L1–6 + 7–9, Duolingo tiers, RevenueCat benchmarks, Azure/FunASR CER, FSRS figures, RAG-scale guidance, Gemini ladder + retirement, embedding models, LLM-judge agreement, HLR formula, EDPB/OTel status) is reproduced above.
- **Flags §a–§h** reflect the uncertainties, especially iFlytek pricing (a) and the HSK char total (b).
- **Do-not-trust reconciled** (Flag c): the g=1.15 vs g=0.58/0.80 vs g=0.74 (Latimier) distinction is explicit; no WaniKani formula, no vendor tone-error-rate, no `py-fsrs` cited (FSRS = `ts-fsrs`, T11).
- **No decision ID changed**; findings are mapped to existing IDs (V10/V11/Q11/override-2/D14/D15/RAG-1/AS12/S15-amended/T12/OB1–OB6/S14) as source data for the final round.
