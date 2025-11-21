import { GenericLandingLayout } from "./AnimatedLayout";

export function LandingLayoutMidNavy() {
  const theme = {
    bg: "#14203B",
    accent: "#496DFF",
    textPrimary: "text-white",
    textSecondary: "text-blue-100",
    cardBg: "bg-slate-900/50",
    cardBorder: "border-blue-200/10",
    buttonPrimary: "#496DFF",
    gradientLeft: "linear-gradient(180deg, #3B43D0 0%, #7284FF 40%, #ABC4FF 100%)",
    gradientBlob: "radial-gradient(circle at center, rgba(125,170,255,0.45), transparent 70%)"
  };

  return (
    <GenericLandingLayout 
      theme={theme}
      headline={<>From chaos to <span className="text-blue-400">clear control</span> of your fleet.</>}
      subheadline="Pull together your vehicles, drivers, and cash flow into one simple operations dashboard."
    />
  );
}