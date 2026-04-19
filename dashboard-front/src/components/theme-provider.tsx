import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider(props: ThemeProviderProps) {
  // attribute="class" toggles the `class` on <html>
  return <NextThemesProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false} {...props} />;
}