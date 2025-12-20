import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import ThemeToggle from "@/pages/auth/ThemeToggle";
import { PublicNavbar } from "../LandingPage/PublicNavbar";
import { firebaseAuth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setError("Please enter your email address.");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setIsLoading(true);

            // Use Firebase client SDK to send password reset email
            await sendPasswordResetEmail(firebaseAuth, trimmedEmail);

            setIsSuccess(true);
        } catch (err: any) {
            // Handle specific Firebase Auth errors
            const errorCode = err?.code;

            switch (errorCode) {
                case "auth/user-not-found":
                    // For security, still show success message even if user doesn't exist
                    setIsSuccess(true);
                    break;
                case "auth/invalid-email":
                    setError("Please enter a valid email address.");
                    break;
                case "auth/too-many-requests":
                    setError("Too many attempts. Please try again later.");
                    break;
                default:
                    // For security, show success even on other errors
                    setIsSuccess(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
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

            {/* centered content */}
            <div className="relative z-20 flex w-full justify-center px-6 py-20">
                <div className="w-full max-w-md p-6 md:p-8">
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-sky-500 text-transparent bg-clip-text">
                            Reset <span className="text-blue-700">Password</span>
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter your email and we'll send you a reset link.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.05)] p-6 md:p-7">
                        {isSuccess ? (
                            <div className="text-center space-y-4">
                                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
                                    <p className="mt-2 text-sm text-gray-600">
                                        We've sent a password reset link to <strong>{email}</strong>.
                                        Please check your inbox and follow the instructions.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Sign In
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <div className="mb-4 text-sm rounded-lg border border-red-300 bg-red-50 text-red-700 px-3 py-2">
                                        {error}
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label htmlFor="email" className="block text-sm mb-1 text-gray-700">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            inputMode="email"
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 rounded-xl bg-white border border-gray-300 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-400"
                                        />
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 rounded-xl font-semibold text-white shadow-lg
                             bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500
                             hover:shadow-xl hover:brightness-110 transition-all active:scale-[0.99]"
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isLoading ? "Sending..." : "Send Reset Link"}
                                </Button>

                                <div className="mt-5 text-center">
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Sign In
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
