# Green Circle — How We Verify Data

**v1.0 · June 2026 · Bemnet Mussa · Addis Ababa, Ethiopia**

> Our whole product is trust. So this is the one rule we never break: **we never show a number we can't point to a source for.**

---

## The one-liner (tell this to anyone)

> **Every figure on Green Circle is real and sourced. Small facts need one trustworthy source. Big claims — funding, valuations, rounds — need two independent sources that agree, or direct confirmation from the company. A person signs off before anything goes live, and every figure shows a clickable source so you can check it yourself.**

That's it. If someone asks "how do you know your data is right?", that paragraph is the answer.

---

## The key idea: there is no single magic check

Verification isn't one system — **it's a stack of checks, and a fact has to pass enough of them.** No serious data company (Crunchbase, Dealroom, PitchBook) relies on one trick; they layer several. We do the same:

1. **Source authority** — *who* said it. An official filing or the company's own announcement outranks a news article, which outranks a tweet or rumor.
2. **Corroboration** — do **two or more *independent* sources agree?** (Five news articles all rewriting the same press release count as *one* source, not five — they have to be genuinely separate.)
3. **Direct confirmation** — for the figures that matter most, we confirm straight with the company or the investor.
4. **Human sign-off** — a person reviews and approves before anything is published. Nothing shaky goes live automatically.
5. **Visible provenance** — we store and **show** every source. The clickable source *is* the proof.

A fact's confidence comes from how many of these it clears — so we can label something **rumored → reported → confirmed → verified** instead of pretending everything is equally certain.

---

## How one fact gets verified (a quick example)

Say a story appears: *"Startup X raised a $2.1M seed round led by Investor Y."*

1. **We capture it** — from the news source, a filing, an investor's portfolio page, or a founder telling us directly.
2. **We pull out the facts** — company, round type, amount, date, investors, source link (AI does the reading; it also keeps the exact quote it took the number from).
3. **We cross-check** — do other independent sources agree on $2.1M? Is "$2.1M seed" sensible? Is it even the right company (matched by website/founders, not just the name)? Conflicts get flagged.
4. **A human approves** — we see the value and its 2–3 sources side by side, click through, and approve (or fix the number). Single-source or conflicting items *must* be approved by a person first.
5. **It goes live with its source** — the figure shows on the profile with a little **"source ▸"** link to the citations.

At no point does the live site show something unverified.

---

## The pipeline (how it runs)

```
Sources → AI extraction → Staging (with source + confidence) → Human review → Published with source
```

- **Sources**: a curated list of trustworthy Ethiopian sources (local press, funding databases, registries, hub and investor portfolios) plus **founder and partner submissions**.
- **AI extraction**: turns articles and filings into structured, *sourced* facts automatically — this is what lets a small team cover a whole ecosystem.
- **Staging**: new facts sit in a holding area, scored for confidence, **never touching the live profiles** until approved.
- **Human review**: fast approve / fix / reject.
- **Published**: the value, every source, and an "as of" date — re-checked over time so stale facts don't mislead.

---

## Why this matters

For investors, an unsourced number is worthless — or a red flag. The thing that makes a data platform valuable isn't *secret* data; it's **comprehensive data where every point is sourced and checked.** That is the moat, and it's the same promise our Signal Score already keeps: real inputs, no fabrication.

**Short version, again:** real sources, two independent ones for the big stuff (or direct confirmation), a human signs off, and every number shows where it came from.
