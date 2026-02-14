"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";

const SUPER_ADMIN_EMAIL = "ashikuzzaman099@gmail.com";

export default function AdminLoginPage() {
  const { loginWithGoogle, logout, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const signedInUser = await loginWithGoogle();

      if (!signedInUser?.email) {
        setError("Unable to verify account email.");
        return;
      }

      if (signedInUser.email === SUPER_ADMIN_EMAIL) {
        await setDoc(
          doc(db, "users", signedInUser.uid),
          {
            email: signedInUser.email,
            role: "super_admin",
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
        router.replace("/admin/dashboard");
        return;
      }

      const usersRef = collection(db, "users");
      const accessQuery = query(usersRef, where("email", "==", signedInUser.email), limit(1));
      const result = await getDocs(accessQuery);

      if (result.empty) {
        await logout();
        setError("Access Denied");
        return;
      }

      router.replace("/admin/dashboard");
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#e6d8ce] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-2xl font-semibold text-ink">Admin Sign In</h2>
      <p className="mt-2 text-sm text-[#6f4f43]">Use your Google account to continue to the admin panel.</p>
      <form className="mt-6" onSubmit={handleSignIn}>
        <button
          className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy || loading}
          type="submit"
        >
          {busy || loading ? "Signing in..." : "Sign in with Google"}
        </button>
      </form>
      {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
    </section>
  );
}
