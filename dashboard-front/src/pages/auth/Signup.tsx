// src/pages/auth/Signup.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "@/pages/auth/ThemeToggle";
import { useRegisterMutation } from "@/pages/auth/authSlice";
import { useAuth } from "@/state/AuthContext";              // HIGHLIGHT
import { firebaseAuth } from "@/lib/firebase";              // HIGHLIGHT
import { signInWithEmailAndPassword } from "firebase/auth"; // HIGHLIGHT

export default function SignUpPage() {
  const navigate = useNavigate();
  const [registerUser, { isLoading, error }] = useRegisterMutation();
  const { refreshClaimsFromFirebase } = useAuth();          // HIGHLIGHT

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [formError, setFormError] = useState<string>("");

  const handleSubmit = async () => {
    setFormError("");

    if (!fullName.trim()) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setFormError("Please enter your email address.");
      return;
    }
    if (!password) {
      setFormError("Please enter a password.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== passwordConfirm) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      const trimmedName = fullName.trim();
      const trimmedEmail = email.trim();

      const res = await registerUser({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      console.log("on sign up", (res as any).data);

      if ("data" in res && (res.data as any)?.isSuccessful) {
        // HIGHLIGHT: sign into Firebase client so AuthContext can see the user
        await signInWithEmailAndPassword(
          firebaseAuth,
          trimmedEmail,
          password
        );                                                 // HIGHLIGHT

        // HIGHLIGHT: now refresh claims into AuthContext (even though role is null for now)
        await refreshClaimsFromFirebase();                 // HIGHLIGHT

        // HIGHLIGHT: then go into the owner/employee choice screen
        navigate("/onboarding", { replace: true });        // HIGHLIGHT
      } else {
        const apiErr = (res as any).error || {};
        const msg =
          apiErr?.data?.error ||
          apiErr?.error ||
          apiErr?.message ||
          "Unable to create account. Please try again.";
        setFormError(msg);
      }
    } catch (e: any) {
      setFormError(
        e?.message || "Unable to create account. Please try again."
      );
    }
  };

  const serverError =
    (error as any)?.data?.error ||
    (error as any)?.message ||
    (error as any)?.error ||
    "";

  const showError = formError || serverError;

  return (
    <div className="relative flex min-h-screen items-center justify-center text-gray-900">
      {/* theme toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
      </div>

      {/* card */}
      <div className="relative w-full max-w-md p-6 md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-700">
            Fleet <span className="text-sky-500">Manager</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">Create your account.</p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white/90 backdrop-blur-xl shadow-2xl p-6 md:p-7">
          {/* Error banner */}
          {showError ? (
            <div
              className="mb-4 text-sm rounded-lg border border-red-300 bg-red-50 text-red-700 px-3 py-2"
              role="alert"
            >
              {String(showError)}
            </div>
          ) : null}

          {/* Full name */}
          <label htmlFor="fullName" className="block text-sm mb-1 text-gray-700">
            Full name
          </label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            required
            placeholder="Blessed Masuku"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mb-3 rounded-xl bg-gray-50 border border-gray-300 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-sky-500"
          />

          {/* Email */}
          <label htmlFor="email" className="block text-sm mb-1 text-gray-700">
            Email
          </label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-3 rounded-xl bg-gray-50 border border-gray-300 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-sky-500"
          />

          {/* Password */}
          <label
            htmlFor="password"
            className="block text-sm mb-1 text-gray-700"
          >
            Password
          </label>
          <div className="relative mb-3">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-28 rounded-xl bg-gray-50 border border-gray-300 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-sky-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-2 my-auto flex items-center justify-center 
                         rounded-lg text-blue-700 hover:text-blue-900 transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Confirm password */}
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
              autoComplete="new-password"
              required
              placeholder="••••••••"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="pr-28 rounded-xl bg-gray-50 border border-gray-300 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-sky-500"
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm((s) => !s)}
              className="absolute inset-y-0 right-2 my-auto flex items-center justify-center 
                         rounded-lg text-blue-700 hover:text-blue-900 transition"
              aria-label={
                showPasswordConfirm ? "Hide password" : "Show password"
              }
            >
              {showPasswordConfirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Submit */}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-6 w-full py-3 rounded-xl font-semibold text-white shadow-lg
                       bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500
                       hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600
                       active:opacity-90 disabled:opacity-60 transition-all"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Creating account…" : "Sign Up"}
          </Button>

          {/* Footer */}
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
  );
}