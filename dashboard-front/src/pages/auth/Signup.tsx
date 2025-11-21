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
import { signInWithEmailAndPassword } from "firebase/auth";
import { PublicNavbar } from "../LandingPage/PublicNavbar";

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

        await signInWithEmailAndPassword(firebaseAuth, trimmedEmail, password);
        await refreshClaimsFromFirebase();
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
              disabled={isLoading || isRedirecting} // HIGHLIGHT
              className="mt-6 w-full py-3 rounded-xl font-semibold text-white shadow-lg bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 hover:shadow-xl"
            >
              {(isLoading || isRedirecting) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLoading || isRedirecting ? "Creating account…" : "Sign Up"}
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