import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { VERSION } from "@/lib/version";
import "./globals.css";

export const metadata: Metadata = {
  title: "TypePilot — Free Human Typing Extension for Google Docs & Canvas",
  description:
    "TypePilot is a free, open-source browser extension that types your text into any website like a human — Google Docs, Canvas, Packback, and virtually any text box. Realistic typos, false starts, and short breaks. For Chrome, Edge & Firefox.",
  keywords: [
    "typepilot",
    "typepilot ai",
    "typepilot free",
    "free typepilot",
    "typepilot unblocked",
    "typepilot extension",
    "typepilot chrome extension",
    "drip writer",
    "google docs typing extension",
    "human-like typing google docs",
    "type into google docs",
    "human typing simulator",
    "canvas typing extension",
    "canvas lms typing",
    "packback typing",
    "type into any website",
    "human typing any text box",
    "type into textarea like a human"
  ],
  metadataBase: new URL("https://typepilot.org"),
  alternates: {
    canonical: "https://typepilot.org"
  },
  openGraph: {
    title: "TypePilot",
    description:
      "Type pasted text into any website — Google Docs, Canvas, and any text box — with realistic typos, deleted false starts, and short breaks.",
    url: "https://typepilot.org",
    siteName: "TypePilot",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "TypePilot",
    description:
      "Type into any website like a human — Google Docs, Canvas, any text box. Typos, false starts, breaks. Free, open-source, cross-browser."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true }
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://typepilot.org/#app",
      name: "TypePilot",
      alternateName: ["TypePilot", "TypePilot Google Docs Extension", "TypePilot Canvas Extension"],
      url: "https://typepilot.org",
      downloadUrl: "https://extension.typepilot.org",
      applicationCategory: "BrowserApplication",
      operatingSystem: "Chrome, Edge, Firefox",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD"
      },
      softwareVersion: VERSION,
      description:
        "Free, open-source browser extension that types pasted text into any website — Google Docs, Canvas, Packback, and virtually any text box — with believable typos, deleted false starts, and short breaks.",
      author: {
        "@type": "Person",
        name: "Alexey Fedorov"
      },
      sameAs: [
        "https://github.com/alexey-max-fedorov/typepilot",
        "https://chrome.typepilot.org",
        "https://edge.typepilot.org",
        "https://firefox.typepilot.org"
      ],
      keywords: "typepilot, typepilot ai, free typepilot, typepilot extension, google docs human typing, canvas typing extension, type into any website, human typing any text box"
    },
    {
      "@type": "FAQPage",
      "@id": "https://typepilot.org/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is TypePilot?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "TypePilot is a free, open-source browser extension that types pasted text into Google Docs, Canvas, the Packback editor, and virtually any text box on any website — with adjustable speed, keyboard-neighbor typos that auto-correct, occasional false-start words, and configurable short breaks. The result reads like a person typing live, not a script pasting in one shot."
          }
        },
        {
          "@type": "Question",
          name: "Is TypePilot free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — TypePilot is free for all noncommercial use under the TypePilot License, and the source is open on GitHub. Commercial use requires a separate license; open an issue at https://github.com/alexey-max-fedorov/typepilot/issues."
          }
        },
        {
          "@type": "Question",
          name: "Which browsers does TypePilot support?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "TypePilot works in Chrome, Microsoft Edge, and Firefox. The build pipeline ships both Chrome MV3 and Firefox MV3 packages, and extension.typepilot.org routes you to the right store for your browser."
          }
        },
        {
          "@type": "Question",
          name: "Can I use TypePilot on a school or work network?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "TypePilot runs entirely inside your browser with no external servers to call and no telemetry, so there is nothing for a network filter to block once the extension is installed. If your browser can open the extension store and the page you're typing into — a Google Doc, a Canvas assignment, or any text box — TypePilot works."
          }
        },
        {
          "@type": "Question",
          name: "Does TypePilot work with AI like Claude?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. With API mode enabled, TypePilot exposes a window._typepilot API on any site you're typing into — Google Docs, Canvas, and beyond — so an AI agent such as Claude can drive the typing engine. See the setup guide at https://typepilot.org/ai."
          }
        },
        {
          "@type": "Question",
          name: "Does TypePilot work in Microsoft Word?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It works in any web-based text box, so Microsoft Word on the web (the contenteditable editor at office.com) works. Native desktop Word does not, because it isn't a web page and has no text field the extension can reach. Google Docs remains the most polished experience, but Canvas, Packback, and most standard textareas and contenteditable fields work too."
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
