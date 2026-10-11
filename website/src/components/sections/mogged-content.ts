// Shared /mogged content. Plain (non-"use client") module so the server page can
// pull MOGGED_FAQ into FAQPage JSON-LD while the client component renders it too.
//
// Deliberate constraint: the commercial competitor's domain is never written as a
// literal string in this file, so it can never end up inside machine-readable
// JSON-LD. The competitor is named in plain visible copy only, and never as a link
// — consistent with "only so much of the mark as reasonably necessary."

export const MOGGED_FAQ: { q: string; a: string }[] = [
  {
    q: "Did TypePilot get sued?",
    a: "No. TypePilot received a cease-and-desist letter — a demand letter from a law firm, not a lawsuit. No case has been filed. The mark in question is unregistered: USPTO Application No. 99/779938 is still pending, so the sender holds at most limited common-law rights, not a federal registration."
  },
  {
    q: "Is TypePilot affiliated with the commercial Dripwriter service?",
    a: "No. TypePilot is an independent, free, open-source browser extension with no account and no OAuth. It is not affiliated with, endorsed by, or connected to the separate commercial Dripwriter service, which is a paid product that costs $15 per month and works only in Google Docs."
  },
  {
    q: "Why is it called TypePilot and not Dripwriter?",
    a: "TypePilot is a deliberately chosen, completely distinct name — it shares no letters, no syllables, and no phonetic similarity with the commercial product's name. This is intentional: a free, open-source browser extension needs a name that can't be confused with a paid SaaS product. Every word on this page that refers to the competitor does so only as much as is necessary to identify it — and never as a link."
  },
  {
    q: "Is it legal to compare TypePilot to the paid Dripwriter?",
    a: "Yes. Truthfully naming a competitor to describe your own product is nominative fair use under New Kids on the Block v. News America and Toyota v. Tabari. Every comparison on this page states verifiable facts — price, platform support, account requirements — and nothing implies sponsorship or endorsement."
  },
  {
    q: "Did TypePilot comply with the cease-and-desist?",
    a: "No. The domain stays, the repository stays, the extension stays, and the name stays. A formal written response was sent declining every demand — citing the unregistered mark, the absence of any likelihood of confusion, the clearly distinct names, and nominative fair use."
  },
  {
    q: "Does the commercial Dripwriter have a free tier?",
    a: "Yes, but a heavily limited one. As of its own pricing page (archived August 18, 2026), the free plan caps you at 250 words per day, limits drips to 60 minutes, allows “use existing Google Doc” for only the first 3 days, permits one drip at a time on standard queue priority, and reserves its version-history features for paid plans. TypePilot is free with no word caps, no queue, and no time limits."
  },
  {
    q: "Is TypePilot really free?",
    a: "Yes. TypePilot is free for all noncommercial use under the TypePilot License, and the full source is public on GitHub. There is no subscription, no paid tier, no account, and no OAuth. Commercial use requires a separate license."
  }
];
