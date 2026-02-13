"use client"

import { Navigation } from "@/components/marketing/Navigation"
import { HeroSection } from "@/components/marketing/HeroSection"
import { MetricsStrip } from "@/components/marketing/MetricsStrip"
import { ProblemSection } from "@/components/marketing/ProblemSection"
import { FeaturesSection } from "@/components/marketing/FeaturesSection"
import { AIAnalystSection } from "@/components/marketing/AIAnalystSection"
import { PricingSection } from "@/components/marketing/PricingSection"
import { FooterCTA, Footer } from "@/components/marketing/Footer"

export default function LandingPage() {
    return (
        <>
            <Navigation />
            <HeroSection />
            <MetricsStrip />
            <ProblemSection />
            <FeaturesSection />
            <AIAnalystSection />
            <PricingSection />
            <FooterCTA />
            <Footer />
        </>
    )
}
