
import Footer from "@/components/home/Footer"
import CTASection from "@/components/home/CTASection"
import Testimonials from "@/components/home/Testimonials"
import HowItWorks from "@/components/home/HowItWorks"
import Features from "@/components/home/Features"
import HeroSection from "@/components/home/Hero"
import Navbar from "@/components/home/Navbar"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-56 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>
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
