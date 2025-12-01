// src/state/AuthContext.tsx
import {
  onAuthStateChanged,
  getIdToken,
  getIdTokenResult,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { firebaseAuth } from "@/lib/firebase";

// HIGHLIGHT: extend role model to support manager explicitly
type UserRole = "owner" | "manager" | "employee";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  idToken: string | null;
  companyId: string | null;
  role: UserRole | null;

  // HIGHLIGHT: derived helpers for permission checks
  isOwner: boolean;
  isManager: boolean;
  isOwnerOrManager: boolean;

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

    // HIGHLIGHT: DEBUG LOG (keep or remove when done)
    console.log("AuthContext claims →", claims);

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

  // HIGHLIGHT: derive role booleans once, reuse everywhere
  const isOwner = role === "owner";
  const isManager = role === "manager";
  const isOwnerOrManager = isOwner || isManager;

  const value: AuthContextValue = {
    user,
    loading,
    idToken,
    companyId,
    role,

    // HIGHLIGHT: expose derived flags for permission checks
    isOwner,
    isManager,
    isOwnerOrManager,

    refreshClaimsFromFirebase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}