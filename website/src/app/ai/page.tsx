import type { Metadata } from "next";
import AiGuide from "@/components/sections/AiGuide";

export const metadata: Metadata = {
  title: "TypePilot AI — Let Claude Type Into Google Docs, Canvas & More",
  description:
    "Connect TypePilot to Claude and let AI type your text into Google Docs, Canvas, and virtually any text box with human cadence. Step-by-step setup for the Claude Chrome extension and TypePilot API mode.",
  keywords: [
    "typepilot ai",
    "typepilot claude",
    "ai type into google docs",
    "claude google docs typing",
    "ai type into any website",
    "claude canvas typing"
  ],
  alternates: { canonical: "https://typepilot.org/ai" },
  openGraph: {
    title: "TypePilot AI — Let Claude Type Into Google Docs, Canvas & More",
    description:
      "Let Claude type for you — human-like, into Google Docs, Canvas, or any text box.",
    url: "https://typepilot.org/ai",
    type: "article"
  }
};

export default function AiPage() {
  return <AiGuide />;
}
