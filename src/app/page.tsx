"use client";

import { LandingI18nProvider } from "@/components/landing/i18n";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { PainPoints } from "@/components/landing/pain-points";
import { SolutionFlow } from "@/components/landing/solution-flow";
import { Modules } from "@/components/landing/modules";
import { AISection } from "@/components/landing/ai-section";
import { Integrations } from "@/components/landing/integrations";
import { Security } from "@/components/landing/security";
import { Metrics } from "@/components/landing/metrics";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <LandingI18nProvider>
      <div className="dark bg-[#09090B]">
        <Navbar />
        <main>
          <Hero />
          <PainPoints />
          <SolutionFlow />
          <Modules />
          <AISection />
          <Integrations />
          <Security />
          <Metrics />
          <Pricing />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </LandingI18nProvider>
  );
}
