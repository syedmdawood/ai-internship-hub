
import Footer from "@/components/home/Footer"
import CTASection from "@/components/home/CTASection"
import Testimonials from "@/components/home/Testimonials"
import HowItWorks from "@/components/home/HowItWorks"
import Features from "@/components/home/Features"
import HeroSection from "@/components/home/Hero"
import Navbar from "@/components/home/Navbar"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
