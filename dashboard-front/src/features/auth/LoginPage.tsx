import { type FormEvent, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useLoginMutation, useMeQuery } from "./authSlice";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const { data: me, isLoading: meLoading } = useMeQuery();
  const [login, { isLoading, isError, error }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as any)?.from?.pathname || "/drivers";

  // If already authenticated, bounce to where the user was going
  if (!meLoading && me?.user) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ email, password }).unwrap();
    // cookie is set by backend; me will refetch on next view
    navigate(from, { replace: true });
  };

  // Optional: extract RTK error message safely
  const errMsg =
    (error as any)?.data?.error ||
    (error as any)?.data?.message ||
    (error as any)?.error ||
    (isError ? "Login failed. Check your credentials." : null);

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>Access your Trogern dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          {errMsg && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              By continuing you agree to our terms & privacy policy.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}