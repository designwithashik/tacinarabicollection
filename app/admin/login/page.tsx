"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";

const SUPER_ADMIN_EMAIL = "ashikuzzaman099@gmail.com";

export default function AdminLoginPage() {
  const { user, loading, loginWithGoogle, logout } = useAuth();
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const normalizedEmail = useMemo(() => user?.email?.toLowerCase() ?? "", [user?.email]);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!user?.email) {
        return;
      }

      setCheckingAccess(true);
      setError(null);

      const userRef = doc(db, "users", user.email.toLowerCase());
      const userDoc = await getDoc(userRef);

      if (normalizedEmail === SUPER_ADMIN_EMAIL) {
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            email: user.email,
            role: "super_admin",
            createdAt: serverTimestamp(),
          });
        }

        router.replace("/admin/dashboard");
        return;
      }

      if (userDoc.exists()) {
        router.replace("/admin/dashboard");
        return;
      }

      setError("Access Denied");
      await logout();
      setCheckingAccess(false);
    };

    if (!loading) {
      verifyAccess().catch((verifyError) => {
        console.error(verifyError);
        setError("Unable to verify access. Please try again.");
        setCheckingAccess(false);
      });
    }
  }, [loading, normalizedEmail, router, user]);

  const handleSignIn = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (loginError) {
      console.error(loginError);
      setError("Google sign-in failed. Please try again.");
    }
  };

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-[#e6d8ce] bg-white p-6 shadow-sm">
        <h2 className="font-heading text-2xl font-semibold text-ink">Admin Login</h2>
        <p className="mt-2 text-sm text-ink/70">Sign in with your authorized Google account.</p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading || checkingAccess}
          className="mt-6 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading || checkingAccess ? "Please wait..." : "Continue with Google"}
        </button>

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      </div>
    </section>
  );
}
