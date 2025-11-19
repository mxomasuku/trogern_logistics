// src/state/AuthContext.tsx
import {
  onAuthStateChanged,
  getIdToken,
  getIdTokenResult,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { firebaseAuth } from "@/lib/firebase";

type UserRole = "owner" | "employee";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  idToken: string | null;
  companyId: string | null;
  role: UserRole | null;
  refreshClaimsFromFirebase: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const extractClaims = async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setIdToken(null);
      setCompanyId(null);
      setRole(null);
      return;
    }

    const token = await getIdToken(firebaseUser, true);
    const tokenResult = await getIdTokenResult(firebaseUser);

    setIdToken(token);

    const claims = tokenResult.claims as any;

    // HIGHLIGHT: DEBUG LOG ADDED
    console.log("AuthContext claims →", claims); // HIGHLIGHT

    setCompanyId((claims.companyId as string) ?? null);
    setRole((claims.role as UserRole) ?? null);
  };

  const refreshClaimsFromFirebase = async () => {
    if (!firebaseAuth.currentUser) return;
    await extractClaims(firebaseAuth.currentUser);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await extractClaims(currentUser);
      } else {
        setIdToken(null);
        setCompanyId(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    idToken,
    companyId,
    role,
    refreshClaimsFromFirebase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}