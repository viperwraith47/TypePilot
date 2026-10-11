import { SectionHeading } from "@/components/ui/SectionHeading";

export function BrandClarification() {
  return (
    <section id="brand-clarification" className="py-24 lg:py-32 bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Clarification"
          title="An independent, open-source project."
          subtitle="TypePilot is not affiliated with Dripwriter, LLC."
        />
        <div className="mt-16 bg-[#111] border border-[#1a1a1a] rounded-xl p-6 lg:p-8">
          <p className="text-[#a0a0a0] text-sm leading-relaxed">
            <span className="text-white font-semibold">TypePilot</span> is an
            independent, open-source project created and maintained by Tanush Kulkarni.
            It is not affiliated with, endorsed by, or connected to Dripwriter, LLC or
            the commercial service at dripwriter.com.
          </p>
          <p className="text-[#a0a0a0] text-sm leading-relaxed mt-4">
            TypePilot is a completely distinct name &mdash; it shares no letters, no syllables,
            and no phonetic similarity with the commercial product&lsquo;s name. This is
            intentional: a free, open-source project needs a name that can&rsquo;t be confused
            with a paid SaaS product. Any reference to &ldquo;Dripwriter&rdquo; describes that
            separate product solely for identification and comparison.
          </p>
        </div>
      </div>
    </section>
  );
}
