// HIGHLIGHT: removed unused useRef
import React from "react";
import { Link } from "react-router-dom"; // HIGHLIGHT
import {
  motion,
  useMotionTemplate, // HIGHLIGHT
  useMotionValue,
  useSpring, // HIGHLIGHT
} from "framer-motion";
import { PublicNavbar } from "./PublicNavbar";

// --- Types for our theme configuration ---
interface ThemeConfig {
  bg: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  cardBorder: string;
  buttonPrimary: string;
  gradientLeft: string;
  gradientBlob: string;
}

// --- Reusable Dashboard Card Component ---
const DashboardCard = ({ theme }: { theme: ThemeConfig }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // HIGHLIGHT: springs for smooth 3D tilt
  const rotateX = useSpring(0, { stiffness: 120, damping: 18 });
  const rotateY = useSpring(0, { stiffness: 120, damping: 18 });

  // HIGHLIGHT: animated glow following the cursor
  const cardGlow = useMotionTemplate`
    radial-gradient(circle at ${mouseX}px ${mouseY}px,
      rgba(255,255,255,0.16),
      transparent 65%
    )
  `;

  // HIGHLIGHT: mouse move now drives tilt + glow
  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const { currentTarget, clientX, clientY } = event;
    const rect = currentTarget.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    mouseX.set(relativeX);
    mouseY.set(relativeY);

    const percentX = relativeX / rect.width - 0.5;
    const percentY = relativeY / rect.height - 0.5;

    rotateY.set(percentX * 16); // tilt left/right
    rotateX.set(percentY * -12); // tilt up/down
  }

  // HIGHLIGHT: reset tilt on leave
  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      onMouseMove={handleMouseMove} // HIGHLIGHT
      onMouseLeave={handleMouseLeave} // HIGHLIGHT
      className={`group relative backdrop-blur-md rounded-3xl p-6 shadow-2xl border ${theme.cardBg} ${theme.cardBorder}`} // HIGHLIGHT: added group
      style={{
        transformStyle: "preserve-3d",
        rotateX, // HIGHLIGHT
        rotateY, // HIGHLIGHT
      }}
    >
      {/* HIGHLIGHT: cursor glow layer */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ backgroundImage: cardGlow }}
      />

      {/* HIGHLIGHT: content wrapped so glow sits behind it */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p
              className={`text-xs uppercase tracking-wide ${theme.textSecondary} opacity-70`}
            >
              Fleet snapshot
            </p>
            <p className={`text-lg font-semibold ${theme.textPrimary}`}>
              This week
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
              Live
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-xs">
          {[
            { label: "Revenue", val: "$4,820", sub: "+18%", color: "text-emerald-400" },
            { label: "Active", val: "7 / 8", sub: "1 Maint.", color: "text-amber-400" },
            { label: "Avg Cash-in", val: "$146", sub: "Daily", color: theme.textSecondary },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className={`rounded-2xl p-3 border ${theme.cardBorder} bg-black/10`}
            >
              <p className={`${theme.textSecondary} opacity-70 mb-1`}>
                {stat.label}
              </p>
              <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                {stat.val}
              </p>
              <p className={`text-[10px] mt-1 ${stat.color}`}>{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Animated Progress Bars */}
        <div className="space-y-3">
          <p className={`text-xs ${theme.textSecondary} opacity-70`}>
            Real-time Performance
          </p>
          {[0.9, 0.75, 0.6, 0.4].map((val, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-[10px] opacity-80">
                <span className={theme.textPrimary}>Vehicle {i + 10}</span>
                <span className={theme.textSecondary}>
                  {(val * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${val * 100}%` }}
                  transition={{
                    duration: 1.5,
                    delay: 0.8 + i * 0.1,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: theme.accent }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Layout Shell ---
export const GenericLandingLayout = ({
  theme,
  headline,
  subheadline,
}: {
  theme: ThemeConfig;
  headline: React.ReactNode;
  subheadline: string;
}) => {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Background Gradients */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[40%]"
        style={{ background: theme.gradientLeft, opacity: 0.6 }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="pointer-events-none absolute -right-40 top-[-10rem] h-[35rem] w-[35rem] rounded-full blur-[140px]"
        style={{ background: theme.gradientBlob }}
      />

      <PublicNavbar
        textPrimaryClassName={theme.textPrimary}
        cardBorderClassName={theme.cardBorder}
        accentColor={theme.accent}
        buttonPrimaryColor={theme.buttonPrimary}
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-14 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center"> {/* HIGHLIGHT (EDITED): tighter mobile padding */}
        <div className="space-y-6 sm:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`inline-flex items-center text-[11px] sm:text-xs font-medium rounded-full border px-2.5 sm:px-3 py-1 ${theme.cardBorder} bg-white/5 ${theme.textSecondary}`} // HIGHLIGHT (EDITED): smaller text on mobile
          >
            Built for African fleet operators
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-3xl sm:text-5xl lg:text-6xl font-semibold leading-tight ${theme.textPrimary}`} // HIGHLIGHT (EDITED): smaller base font
          >
            {headline}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-base sm:text-lg max-w-lg leading-relaxed ${theme.textSecondary} opacity-90`} // HIGHLIGHT (EDITED): base text smaller
          >
            {subheadline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4" // HIGHLIGHT (EDITED): stack on mobile
          >
            {/* <Link
              to="/book-a-demo" // HIGHLIGHT
              className="w-full sm:w-auto text-center px-6 py-3 rounded-full text-sm font-semibold text-white shadow-lg hover:brightness-110 transition-all"
              style={{ backgroundColor: theme.buttonPrimary }}
            >
              Book a demo
            </Link> */}

            <Link
              to="/product-overview" // HIGHLIGHT
              className={`w-full sm:w-auto text-center px-6 py-3 rounded-full text-sm border ${theme.cardBorder} ${theme.textPrimary} hover:bg-white/5 transition-colors`}
            >
              Product overview
            </Link>

            {/* HIGHLIGHT (ADDED): explicit Login button visible on mobile and desktop */}
            <Link
              to="/login"
              className={`w-full sm:w-auto text-center px-6 py-3 rounded-full text-sm font-semibold border ${theme.cardBorder} ${theme.textPrimary} bg-white/90/0 sm:bg-transparent hover:bg-white/10 transition-colors`} // HIGHLIGHT
            >
              Log in
            </Link>
          </motion.div>
        </div>

        {/* Right Side: Interactive Dashboard */}
        <div
          className="relative mt-8 lg:mt-0"
          style={{ perspective: 1000 }} // HIGHLIGHT: inline perspective instead of class
        >
          <DashboardCard theme={theme} />
        </div>
      </main>
    </div>
  );
};