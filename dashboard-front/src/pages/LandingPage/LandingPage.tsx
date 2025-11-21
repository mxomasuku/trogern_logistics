import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LandingLayoutDeepNavy } from "./LandingLayoutDeepNavy";
import { LandingLayoutMidNavy } from "./LandingLayoutMidNavy";
import { LandingLayoutLight } from "./LandingLayoutLight";

const ROTATION_INTERVAL_MS = 8000;

const layouts = [
  { component: LandingLayoutDeepNavy, id: "deep-navy" },
  { component: LandingLayoutMidNavy, id: "mid-navy" },
  { component: LandingLayoutLight, id: "light" },
];

// HIGHLIGHT: keep a stable count
const LAYOUT_COUNT = layouts.length;

export default function LandingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((previousIndex) => (previousIndex + 1) % LAYOUT_COUNT);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPaused]);

  const CurrentLayout = layouts[currentIndex].component;

  return (
    <div
      // HIGHLIGHT: use min-h-screen instead of h-full so the container actually has height
      className="relative w-full min-h-screen overflow-hidden bg-black"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          <CurrentLayout />
        </motion.div>
      </AnimatePresence>

      {/* INTERACTIVE NAVIGATION DOTS */}
      <div className="absolute bottom-8 left-0 right-0 z-50 flex justify-center gap-3">
        {layouts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                : "w-2 bg-white/30 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}