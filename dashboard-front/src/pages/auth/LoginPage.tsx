import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLoginMutation } from "@/pages/auth/authSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "@/pages/auth/ThemeToggle";
import { useAuth } from "@/state/AuthContext";
import { firebaseAuth } from "@/lib/firebase";
import { signInWithEmailAndPassword, getIdTokenResult } from "firebase/auth"; // EDITED

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [login, { isLoading, error }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string>("");
  const { refreshClaimsFromFirebase } = useAuth();

  const handleSubmit = async () => {
    setFormError("");

    try {
      const trimmedEmail = email.trim();

      if (!trimmedEmail || !password) {
        setFormError("Email and password are required.");
        return;
      }

      // hit backend first, so we only keep Firebase session if API auth works
      const apiRes = await login({ email: trimmedEmail, password }).unwrap();

      if (!apiRes?.isSuccessful) {
        // LoginResponse: { message, isSuccessful, user? }
        throw new Error(apiRes?.message ?? "Login failed");
      }

      // sign into Firebase client (same credentials)
      await signInWithEmailAndPassword(firebaseAuth, trimmedEmail, password);

      // refresh claims so AuthContext gets { companyId, role }
      await refreshClaimsFromFirebase();

      // ================== EDITED BLOCK: routing logic ==================
      // read fresh claims directly from Firebase to decide onboarding vs app
      let hasCompany = false;
      const currentUser = firebaseAuth.currentUser;

      if (currentUser) {
        const tokenResult = await getIdTokenResult(currentUser, true);
        const claims = tokenResult.claims as any;
        hasCompany = !!claims.companyId;
      }

      // support redirect from query (?next=/invite/abc or ?next=/app/manage-company)
      const redirectParam = searchParams.get("next");
      if (redirectParam && redirectParam.startsWith("/")) {
        navigate(redirectParam, { replace: true });
        return;
      }

      // if user already has a company → go to app
      if (hasCompany) {
        navigate("/app/home", { replace: true });
      } else {
        // no company yet → go to onboarding entry page
        navigate("/onboarding", { replace: true });
      }
      // ================== EDITED BLOCK ==================
    } catch (e: any) {
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
          <p className="mt-2 text-sm text-gray-600">Sign in to continue.</p>
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
          <label htmlFor="password" className="block text-sm mb-1 text-gray-700">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
            {isLoading ? "Signing in…" : "Sign In"}
          </Button>

          {/* Footer */}
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
  );
}