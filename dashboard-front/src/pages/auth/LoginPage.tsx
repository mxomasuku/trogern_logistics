import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLoginMutation } from "@/pages/auth/authSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "@/pages/auth/ThemeToggle";
import { useAuth } from "@/state/AuthContext";
import { firebaseAuth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  getIdTokenResult,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { PublicNavbar } from "../LandingPage/PublicNavbar";
import { http } from "@/lib/http-instance";

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  // HIGHLIGHT: Google Sign-In handler
  const handleGoogleSignIn = async () => {
    setFormError("");
    setIsGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();

      // Send token to backend to create session cookie
      const { data } = await http.post<{ isSuccessful: boolean; message?: string; error?: { message?: string } }>(
        "/auth/google",
        { idToken }
      );

      if (!data?.isSuccessful) {
        throw new Error(data?.error?.message ?? "Google sign-in failed");
      }

      setIsRedirecting(true);
      await refreshClaimsFromFirebase();

      // Check if user has company
      const tokenResult = await getIdTokenResult(result.user, true);
      const claims = tokenResult.claims as any;
      const hasCompany = !!claims.companyId;

      const redirectParam = searchParams.get("next");
      if (redirectParam && redirectParam.startsWith("/")) {
        navigate(redirectParam, { replace: true });
        return;
      }

      if (hasCompany) navigate("/app/home", { replace: true });
      else navigate("/onboarding", { replace: true });
    } catch (e: any) {
      setIsRedirecting(false);
      // Handle specific Firebase errors
      if (e?.code === "auth/popup-closed-by-user") {
        // User closed popup, no error message needed
        return;
      }
      const msg = e?.message || "Google sign-in failed. Please try again.";
      setFormError(msg);
    } finally {
      setIsGoogleLoading(false);
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

            {/* Forgot Password Link */}
            <div className="mt-2 text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || isRedirecting || isGoogleLoading}
              className="mt-6 w-full py-3 rounded-xl font-semibold text-white shadow-lg
                         bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500
                         hover:shadow-xl hover:brightness-110 transition-all active:scale-[0.99]"
            >
              {(isLoading || isRedirecting) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLoading || isRedirecting ? "Signing in…" : "Sign In"}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/70 px-3 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isRedirecting || isGoogleLoading}
              variant="outline"
              className="w-full py-3 rounded-xl font-medium border-gray-300 bg-white hover:bg-gray-50
                         shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-3"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
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