import { GenericLandingLayout } from "./AnimatedLayout";

export function LandingLayoutDeepNavy() {
  const theme = {
    bg: "#111A2E",
    accent: "#4B67FF",
    textPrimary: "text-white",
    textSecondary: "text-blue-200",
    cardBg: "bg-slate-900/60",
    cardBorder: "border-white/10",
    buttonPrimary: "#4B67FF",
    gradientLeft: "linear-gradient(180deg, #3D3CFF 0%, #5A5DFF 40%, #8DA0FF 100%)",
    gradientBlob: "radial-gradient(circle at center, rgba(120,150,255,0.45), transparent 70%)"
  };

  return (
    <GenericLandingLayout 
      theme={theme}
      headline={<>From guesswork to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">real-time control</span>.</>}
      subheadline="Trogern connects vehicles, drivers, and cash flow into a single live dashboard."
    />
  );
}