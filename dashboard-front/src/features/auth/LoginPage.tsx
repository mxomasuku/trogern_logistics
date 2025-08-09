import { useState, useRef, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "@/features/auth/authSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();

  // Read `from` once to avoid rerenders messing it up
  const storedFromRef = useRef<string | null>(null);
  useEffect(() => {
    try {
      storedFromRef.current = sessionStorage.getItem("postLoginRedirect");
    } catch {
      // ignore
    }
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ email, password }).unwrap();

    let to = storedFromRef.current || "/drivers";
    if (!to.startsWith("/")) to = "/drivers"; // sanitize

    try {
      sessionStorage.removeItem("postLoginRedirect");
    } catch {}

    navigate(to, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          Login
        </h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="text-red-500 text-sm">
              {(error as any)?.data?.error || "Login failed"}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}