import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLoginMutation } from "@/pages/auth/authSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "@/pages/auth/ThemeToggle";
import { useAuth } from "@/state/AuthContext";
import { firebaseAuth } from "@/lib/firebase";
import { signInWithEmailAndPassword, getIdTokenResult } from "firebase/auth";
import { PublicNavbar } from "../LandingPage/PublicNavbar";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [login, { isLoading, error }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string>("");
  const { refreshClaimsFromFirebase } = useAuth();

  // HIGHLIGHT: track post-login redirect / workspace prep
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSubmit = async () => {
    setFormError("");
    setIsRedirecting(false); // HIGHLIGHT: reset before attempt

    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        setFormError("Email and password are required.");
        return;
      }

      const apiRes = await login({ email: trimmedEmail, password }).unwrap();
      if (!apiRes?.isSuccessful) throw new Error(apiRes?.message ?? "Login failed");

      // HIGHLIGHT: backend auth passed – now we're in "redirect / setup" phase
      setIsRedirecting(true);

      await signInWithEmailAndPassword(firebaseAuth, trimmedEmail, password);
      await refreshClaimsFromFirebase();

      let hasCompany = false;
      const currentUser = firebaseAuth.currentUser;
      if (currentUser) {
        const tokenResult = await getIdTokenResult(currentUser, true);
        const claims = tokenResult.claims as any;
        hasCompany = !!claims.companyId;
      }

      const redirectParam = searchParams.get("next");
      if (redirectParam && redirectParam.startsWith("/")) {
        navigate(redirectParam, { replace: true });
        return;
      }

      if (hasCompany) navigate("/app/home", { replace: true });
      else navigate("/onboarding", { replace: true });
    } catch (e: any) {
      // HIGHLIGHT: clear redirect state on failure
      setIsRedirecting(false);

      const msg =
        e?.message ||
        (error as any)?.data?.error ||
        (error as any)?.message ||
        "Invalid email or password.";
      setFormError(msg);
    }
  };

  const serverError =
    (error as any)?.data?.error ||
    (error as any)?.message ||
    (error as any)?.error ||
    "";

  const showError = formError || serverError;

  return (
    // root
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 text-gray-900">
      {/* shared public navbar */}
      <div className="relative z-20">
        <PublicNavbar
          textPrimaryClassName={"text-slate-900"}
          cardBorderClassName={"border-slate-200"}
          accentColor={"#4B67FF"}
          buttonPrimaryColor={"#4B67FF"}
        />
      </div>

      {/* background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-28 -left-20 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute top-1/3 -left-10 h-48 w-48 rounded-full bg-slate-200/50 blur-xl" />
        <div className="absolute bottom-1/4 left-1/4 h-64 w-64 rounded-full border-[3px] border-blue-300/60" />
        <div
          className="absolute top-1/4 right-10 h-60 w-60 rounded-full blur-xl opacity-90"
          style={{
            background:
              "radial-gradient(circle at center, rgba(56,189,248,0.5), rgba(59,130,246,0.3), transparent 70%)",
          }}
        />
        <div className="absolute -rotate-45 top-1/2 -right-32 h-96 w-96 bg-gradient-to-br from-blue-200/40 to-sky-300/30 blur-xl rounded-3xl border-[2px] border-blue-200/50" />
        <div
          className="absolute inset-0 opacity-50 mix-blend-soft-light"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.45) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>

      {/* theme toggle */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <ThemeToggle />
      </div>

      {/* HIGHLIGHT: redirect overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-800">
              Preparing your workspace…
            </p>
          </div>
        </div>
      )}

      {/* centered content */}
      <div className="relative z-20 flex w-full justify-center px-6 py-20">
        <div className="w-full max-w-md p-6 md:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-sky-500 text-transparent bg-clip-text">
              Fleet <span className="text-blue-700">Manager</span>
            </h1>
            <p className="mt-2 text-sm text-gray-600">Sign in to continue.</p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.05)] p-6 md:p-7">
            {showError && (
              <div className="mb-4 text-sm rounded-lg border border-red-300 bg-red-50 text-red-700 px-3 py-2">
                {String(showError)}
              </div>
            )}

            <label htmlFor="email" className="block text-sm mb-1 text-gray-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3 rounded-xl bg-white border border-gray-300 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-400"
            />

            <label htmlFor="password" className="block text-sm mb-1 text-gray-700">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 rounded-xl bg-white border border-gray-300 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-2 flex items-center justify-center text-blue-600 hover:text-blue-800 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || isRedirecting} // HIGHLIGHT
              className="mt-6 w-full py-3 rounded-xl font-semibold text-white shadow-lg
                         bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500
                         hover:shadow-xl hover:brightness-110 transition-all active:scale-[0.99]"
            >
              {(isLoading || isRedirecting) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLoading || isRedirecting ? "Signing in…" : "Sign In"}
            </Button>

            <div className="mt-5 text-center text-sm text-gray-600">
              No account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 hover:text-blue-800 underline underline-offset-4"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}