import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";

export function LandingPage() {
  return (
    <main
      className="relative w-full flex flex-col items-center"
      style={{ backgroundColor: "var(--bg-white)" }}
    >
      <Navbar />
      <Hero />
    </main>
  );
}
