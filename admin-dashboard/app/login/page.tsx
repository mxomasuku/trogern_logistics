"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Get auth instance (only on client side)
            const auth = getFirebaseAuth();

            // 1. Sign in with Firebase Client SDK
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // 2. Get the ID token
            const idToken = await userCredential.user.getIdToken();

            // 3. Send to our API to create session cookie
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            // 4. Redirect to dashboard
            router.push("/admin");
            router.refresh();
        } catch (err: any) {
            console.error("Login error:", err);

            // Handle Firebase auth errors
            if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                setError("Invalid email or password");
            } else if (err.code === "auth/invalid-credential") {
                setError("Invalid email or password");
            } else if (err.code === "auth/too-many-requests") {
                setError("Too many attempts. Please try again later.");
            } else if (err.code === "auth/network-request-failed") {
                setError("Network error. Check your connection.");
            } else {
                setError(err.message || "Login failed");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
                {/* Logo / Header */}
                <div>
                    <div className="flex justify-center">
                        <div className="w-12 h-12 bg-trogern-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">T</span>
                        </div>
                    </div>
                    <h2 className="mt-4 text-center text-3xl font-bold text-gray-900">
                        Trogern Admin
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to access the founder dashboard
                    </p>
                </div>

                {/* Login Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-trogern-500 focus:border-trogern-500 sm:text-sm"
                                placeholder="admin@trogern.com"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-trogern-500 focus:border-trogern-500 sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-trogern-600 hover:bg-trogern-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-trogern-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            "Sign in"
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500">
                    Trogern Logistics Admin Dashboard
                </p>
            </div>
        </div>
    );
}