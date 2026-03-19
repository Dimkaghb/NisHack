import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { LogosTicker } from "./components/LogosTicker";
import { AboutApp } from "./components/AboutApp";
import { Features } from "./components/Features";
import { Benefits } from "./components/Benefits";
import { Reviews } from "./components/Reviews";

/* Matches Framer Content wrapper: gap=160px between sections, pb=160px */
export function LandingPage() {
  return (
    <main
      className="relative w-full flex flex-col items-center"
      style={{ backgroundColor: "var(--bg-white)" }}
    >
      <Navbar />
      <Hero />

      {/* Content sections — gap 160px between each, 160px bottom padding */}
      <div
        className="w-full flex flex-col items-center"
        style={{ gap: "160px", paddingBottom: "160px" }}
      >
        <LogosTicker />
        <AboutApp />
        <Features />
        <Benefits />
        <Reviews />
      </div>
    </main>
  );
}
