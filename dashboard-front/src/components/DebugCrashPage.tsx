
import { useEffect } from "react";

export default function DebugCrashPage() {
  useEffect(() => {
    throw new Error("Frontend test crash"); // HIGHLIGHT
  }, []);

  return <div className="mt-8">Debug Crash Page</div>;
}