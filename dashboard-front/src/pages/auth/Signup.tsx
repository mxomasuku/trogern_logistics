// src/pages/auth/Signup.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "@/pages/auth/ThemeToggle";
import { useRegisterMutation } from "@/pages/auth/authSlice";
import { useAuth } from "@/state/AuthContext";
import { firebaseAuth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  getIdTokenResult
} from "firebase/auth";
import { PublicNavbar } from "../LandingPage/PublicNavbar";
import { http } from "@/lib/http-instance";

const publicLightNavTheme = {
  textPrimaryClassName: "text-slate-900",
  cardBorderClassName: "border-slate-200",
  accentColor: "#4B67FF",
  buttonPrimaryColor: "#4B67FF",
};

export default function SignUpPage() {
  const navigate = useNavigate();

  const [registerUser, { isLoading, error }] = useRegisterMutation();
  const { refreshClaimsFromFirebase } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [formError, setFormError] = useState<string>("");

  // HIGHLIGHT: redirect loader state
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async () => {
    setFormError("");
    setIsRedirecting(false); // HIGHLIGHT: reset before attempt

    if (!fullName.trim()) return setFormError("Please enter your full name.");
    if (!email.trim()) return setFormError("Please enter your email.");
    if (!password) return setFormError("Please enter a password.");
    if (password.length < 6)
      return setFormError("Password must be at least 6 characters.");
    if (password !== passwordConfirm)
      return setFormError("Passwords do not match.");

    try {
      const trimmedName = fullName.trim();
      const trimmedEmail = email.trim();

      const res = await registerUser({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      if ("data" in res && (res.data as any)?.isSuccessful) {
        // HIGHLIGHT: enter redirect / setup phase
        setIsRedirecting(true);

        // Best-effort client-side Firebase sign-in for AuthContext.
        // The backend already set the session cookie, so even if this
        // fails the Protected guard (/auth/me) will still work.
        try {
          await signInWithEmailAndPassword(firebaseAuth, trimmedEmail, password);
          await refreshClaimsFromFirebase();
        } catch (firebaseError) {
          console.warn("[Signup] Client-side Firebase sign-in failed (non-blocking):", firebaseError);
        }

        navigate("/onboarding", { replace: true });
      } else {
        setIsRedirecting(false); // HIGHLIGHT
        const apiErr = (res as any).error || {};
        const msg =
          apiErr?.data?.error ||
          apiErr?.error ||
          apiErr?.message ||
          "Unable to create account.";
        setFormError(msg);
      }
    } catch (e: any) {
      setIsRedirecting(false); // HIGHLIGHT
      setFormError(e?.message || "Unable to create account.");
    }
  };

  const serverError =
    (error as any)?.data?.error ||
    (error as any)?.message ||
    (error as any)?.error ||
    "";
  const showError = formError || serverError;

  // HIGHLIGHT: Google Sign-Up handler
  const handleGoogleSignUp = async () => {
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
        throw new Error(data?.error?.message ?? "Google sign-up failed");
      }

      setIsRedirecting(true);
      await refreshClaimsFromFirebase();

      // Check if user has company
      const tokenResult = await getIdTokenResult(result.user, true);
      const claims = tokenResult.claims as any;
      const hasCompany = !!claims.companyId;

      // New users go to onboarding, existing users go to app
      if (hasCompany) navigate("/app/home", { replace: true });
      else navigate("/onboarding", { replace: true });
    } catch (e: any) {
      setIsRedirecting(false);
      // Handle specific Firebase errors
      if (e?.code === "auth/popup-closed-by-user") {
        // User closed popup, no error message needed
        return;
      }
      const msg = e?.message || "Google sign-up failed. Please try again.";
      setFormError(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 text-gray-900 overflow-hidden">
      <PublicNavbar
        textPrimaryClassName={publicLightNavTheme.textPrimaryClassName}
        cardBorderClassName={publicLightNavTheme.cardBorderClassName}
        accentColor={publicLightNavTheme.accentColor}
        buttonPrimaryColor={publicLightNavTheme.buttonPrimaryColor}
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-blue-200/30 blur-2xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute top-1/3 -left-20 h-48 w-48 rounded-full bg-slate-200/40 blur-xl" />
        <div className="absolute top-20 right-24 h-56 w-56 rounded-full border-4 border-blue-300/50 opacity-60" />
        <div
          className="absolute bottom-10 left-10 h-56 w-56 rounded-full blur-2xl opacity-80"
          style={{
            background:
              "radial-gradient(circle, rgba(56,189,248,0.45), rgba(59,130,246,0.25), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-40 mix-blend-soft-light"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.35) 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>

      {/* theme toggle */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      {/* HIGHLIGHT: redirect overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-sm font-medium text-slate-800">
              Creating your workspace…
            </p>
          </div>
        </div>
      )}

      {/* CARD WRAPPER */}
      <div className="relative z-30 flex w-full justify-center sm:px-2 py-12 sm:py-16 lg:py-20">
        <div className="w-full max-w-md p-5 md:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-blue-700">
              Fleet <span className="text-sky-500">Manager</span>
            </h1>
            <p className="mt-2 text-sm text-gray-600">Create your account.</p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white/70 backdrop-blur-xl shadow-xl p-5 md:p-7">
            {showError ? (
              <div className="mb-4 text-sm rounded-lg border border-red-300 bg-red-50 text-red-700 px-3 py-2">
                {String(showError)}
              </div>
            ) : null}

            <label htmlFor="fullName" className="block text-sm mb-1 text-gray-700">
              Full name
            </label>
            <Input
              id="fullName"
              type="text"
              required
              placeholder="Blessed Masuku"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mb-3 rounded-xl bg-gray-50 border border-gray-300"
            />

            <label htmlFor="email" className="block text-sm mb-1 text-gray-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3 rounded-xl bg-gray-50 border border-gray-300"
            />

            <label htmlFor="password" className="block text-sm mb-1 text-gray-700">
              Password
            </label>
            <div className="relative mb-3">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-28 rounded-xl bg-gray-50 border border-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto text-blue-700 hover:text-blue-900"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <label
              htmlFor="passwordConfirm"
              className="block text-sm mb-1 text-gray-700"
            >
              Confirm password
            </label>
            <div className="relative">
              <Input
                id="passwordConfirm"
                type={showPasswordConfirm ? "text" : "password"}
                required
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="pr-28 rounded-xl bg-gray-50 border border-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto text-blue-700 hover:text-blue-900"
              >
                {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || isRedirecting || isGoogleLoading}
              className="mt-6 w-full py-3 rounded-xl font-semibold text-white shadow-lg bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 hover:shadow-xl"
            >
              {(isLoading || isRedirecting) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLoading || isRedirecting ? "Creating account…" : "Sign Up"}
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

            {/* Google Sign-Up Button */}
            <Button
              type="button"
              onClick={handleGoogleSignUp}
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
              {isGoogleLoading ? "Creating account..." : "Sign up with Google"}
            </Button>

            <div className="mt-5 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}