"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  updatePassword,
  updateProfile as fbUpdateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Address, UserProfile, UserRole } from "@/lib/types";

type AuthUser = { uid: string; email: string; name: string; photoURL: string | null; emailVerified: boolean; providers: string[] };

type AuthContextValue = {
  user: AuthUser | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isStaff: boolean;
  loading: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<Pick<UserProfile, "name" | "phone">>) => Promise<void>;
  saveAddresses: (addresses: Address[]) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  /** Force-refresh the ID token so a newly granted admin/staff role is picked up. */
  refreshClaims: () => Promise<UserRole>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_KEY = "ah-demo-user";

function toAuthUser(u: User): AuthUser {
  return {
    uid: u.uid,
    email: u.email ?? "",
    name: u.displayName ?? u.email?.split("@")[0] ?? "Customer",
    photoURL: u.photoURL,
    emailVerified: u.emailVerified,
    providers: u.providerData.map((p) => p.providerId),
  };
}

function newProfile(u: AuthUser, phone?: string): Omit<UserProfile, "createdAt"> {
  return { uid: u.uid, name: u.name, email: u.email, phone: phone ?? "", photoURL: u.photoURL, role: "customer", blocked: false, addresses: [], wishlist: [], ordersCount: 0, totalSpent: 0 };
}

/** Friendly messages for Firebase auth error codes. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/user-not-found": "No account found with this email.",
    "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
    "auth/weak-password": "Please choose a stronger password (at least 8 characters).",
    "auth/too-many-requests": "Too many attempts. Please wait a minute and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/network-request-failed": "Network error. Please check your internet connection.",
    "auth/requires-recent-login": "For security, please log in again and retry.",
    "auth/user-disabled": "This account has been disabled. Please contact support.",
    "auth/operation-not-allowed": "This sign-in method is not enabled yet. Please contact the store.",
    "auth/unauthorized-domain": "This website domain is not authorised for Google sign-in yet.",
  };
  return map[code] ?? (err instanceof Error ? err.message : "Something went wrong. Please try again.");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>("customer");
  const [loading, setLoading] = useState(true);
  const demoMode = !isFirebaseConfigured;

  // ---- Session restore (persistent login) ----
  useEffect(() => {
    if (demoMode) {
      // restore the demo session asynchronously, mirroring Firebase onAuthStateChanged
      let active = true;
      Promise.resolve().then(() => {
        if (!active) return;
        try {
          const raw = localStorage.getItem(DEMO_KEY);
          if (raw) {
            const p = JSON.parse(raw) as UserProfile;
            setUser({ uid: p.uid, email: p.email, name: p.name, photoURL: null, emailVerified: true, providers: ["password"] });
            setProfile(p);
            setRole(p.role);
          }
        } catch {}
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }
    const fb = getFirebase()!;
    let unsubProfile: (() => void) | undefined;
    const unsub = onAuthStateChanged(fb.auth, async (u) => {
      unsubProfile?.();
      if (!u) {
        setUser(null);
        setProfile(null);
        setRole("customer");
        setLoading(false);
        return;
      }
      const au = toAuthUser(u);
      setUser(au);
      const token = await u.getIdTokenResult();
      setRole(((token.claims.role as UserRole) ?? "customer") || "customer");
      const ref = doc(fb.db, "users", u.uid);
      const snap = await getDoc(ref).catch(() => null);
      if (snap && !snap.exists()) {
        await setDoc(ref, { ...newProfile(au), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }).catch(() => {});
      }
      unsubProfile = onSnapshot(
        ref,
        (s) => {
          if (s.exists()) {
            const d = s.data();
            setProfile({ ...(d as UserProfile), createdAt: d.createdAt?.toMillis?.() ?? Date.now() });
          }
          setLoading(false);
        },
        () => setLoading(false),
      );
    });
    return () => {
      unsub();
      unsubProfile?.();
    };
  }, [demoMode]);

  const demoLogin = useCallback((name: string, email: string, phone?: string) => {
    const existing = (() => {
      try {
        return JSON.parse(localStorage.getItem(DEMO_KEY) || "null") as UserProfile | null;
      } catch {
        return null;
      }
    })();
    const p: UserProfile =
      existing && existing.email === email
        ? existing
        : { ...newProfile({ uid: `demo-${email}`, email, name, photoURL: null, emailVerified: true, providers: ["password"] }, phone), createdAt: Date.now() };
    localStorage.setItem(DEMO_KEY, JSON.stringify(p));
    setUser({ uid: p.uid, email: p.email, name: p.name, photoURL: null, emailVerified: true, providers: ["password"] });
    setProfile(p);
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async (email, password, remember = true) => {
      if (demoMode) return demoLogin(email.split("@")[0], email);
      const { auth } = getFirebase()!;
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    },
    [demoMode, demoLogin],
  );

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async (name, email, password, phone) => {
      if (demoMode) return demoLogin(name, email, phone);
      const { auth, db } = getFirebase()!;
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await fbUpdateProfile(cred.user, { displayName: name });
      const au = { ...toAuthUser(cred.user), name };
      await setDoc(doc(db, "users", cred.user.uid), { ...newProfile(au, phone), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setUser(au);
    },
    [demoMode, demoLogin],
  );

  const signInWithGoogle = useCallback(async () => {
    if (demoMode) return demoLogin("Google User", "google.user@gmail.com");
    const { auth } = getFirebase()!;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, provider);
      } else throw e;
    }
  }, [demoMode, demoLogin]);

  const signOut = useCallback(async () => {
    if (demoMode) {
      localStorage.removeItem(DEMO_KEY);
      setUser(null);
      setProfile(null);
      return;
    }
    await fbSignOut(getFirebase()!.auth);
  }, [demoMode]);

  const resetPassword = useCallback(
    async (email: string) => {
      if (demoMode) return;
      await sendPasswordResetEmail(getFirebase()!.auth, email, { url: `${window.location.origin}/login` });
    },
    [demoMode],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (demoMode) return;
      const { auth } = getFirebase()!;
      const u = auth.currentUser;
      if (!u || !u.email) throw new Error("Please log in again.");
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, currentPassword));
      await updatePassword(u, newPassword);
    },
    [demoMode],
  );

  const persistDemo = useCallback((next: UserProfile) => {
    localStorage.setItem(DEMO_KEY, JSON.stringify(next));
    setProfile(next);
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    async (data) => {
      if (demoMode) {
        if (profile) persistDemo({ ...profile, ...data });
        if (data.name) setUser((u) => (u ? { ...u, name: data.name! } : u));
        return;
      }
      const { auth, db } = getFirebase()!;
      if (!auth.currentUser) return;
      if (data.name) await fbUpdateProfile(auth.currentUser, { displayName: data.name });
      await updateDoc(doc(db, "users", auth.currentUser.uid), { ...data, updatedAt: serverTimestamp() });
      if (data.name) setUser((u) => (u ? { ...u, name: data.name! } : u));
    },
    [demoMode, profile, persistDemo],
  );

  const saveAddresses = useCallback(
    async (addresses: Address[]) => {
      if (demoMode) {
        if (profile) persistDemo({ ...profile, addresses });
        return;
      }
      const { auth, db } = getFirebase()!;
      if (!auth.currentUser) return;
      await updateDoc(doc(db, "users", auth.currentUser.uid), { addresses, updatedAt: serverTimestamp() });
    },
    [demoMode, profile, persistDemo],
  );

  const getIdToken = useCallback(async () => {
    if (demoMode) return null;
    return (await getFirebase()!.auth.currentUser?.getIdToken()) ?? null;
  }, [demoMode]);

  const refreshClaims = useCallback(async (): Promise<UserRole> => {
    if (demoMode) return role;
    const u = getFirebase()!.auth.currentUser;
    if (!u) return "customer";
    const t = await u.getIdTokenResult(true);
    const r = ((t.claims.role as UserRole) ?? "customer") || "customer";
    setRole(r);
    return r;
  }, [demoMode, role]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role,
      isAdmin: role === "admin",
      isStaff: role === "admin" || role === "staff",
      loading,
      demoMode,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      resetPassword,
      changePassword,
      updateProfile,
      saveAddresses,
      getIdToken,
      refreshClaims,
    }),
    [user, profile, role, loading, demoMode, signIn, signUp, signInWithGoogle, signOut, resetPassword, changePassword, updateProfile, saveAddresses, getIdToken, refreshClaims],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
