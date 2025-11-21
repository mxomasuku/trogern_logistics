import { GenericLandingLayout } from "./AnimatedLayout";

export function LandingLayoutLight() {
  const theme = {
    bg: "#F8FAFC", // Slate-50
    accent: "#2563EB", // Blue-600
    textPrimary: "text-slate-900",
    textSecondary: "text-slate-600",
    cardBg: "bg-white/80",
    cardBorder: "border-slate-200",
    buttonPrimary: "#2563EB",
    gradientLeft: "linear-gradient(180deg, #E0E7FF 0%, #C7D2FE 40%, #EFF6FF 100%)",
    gradientBlob: "radial-gradient(circle at center, rgba(59,130,246,0.25), transparent 70%)"
  };

  return (
    <GenericLandingLayout 
      theme={theme}
      headline={<>Are you <span className="text-blue-700">making money</span> or just thinking you are?</>}
      subheadline="Daily cash-ins, expenses, and profit alerts built for SMEs in volatile markets."
    />
  );
}