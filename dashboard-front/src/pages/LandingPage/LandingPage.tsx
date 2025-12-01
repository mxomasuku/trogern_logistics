import { LandingLayoutLight } from "./LandingLayoutLight";

// HIGHLIGHT: all rotation-related constants removed

export default function LandingPage() {
  // HIGHLIGHT: removed state, interval, pause logic entirely

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden bg-black"
      // HIGHLIGHT: removed mouse enter/leave pause handlers
    >
      {/* HIGHLIGHT: removed AnimatePresence + motion wrapper */}
      <LandingLayoutLight />  {/* HIGHLIGHT: direct, static render */}
    </div>
  );
}