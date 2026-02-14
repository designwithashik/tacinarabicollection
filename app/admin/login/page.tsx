"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../lib/firebase";

const SUPER_ADMIN_EMAIL = "ashikuzzaman099@gmail.com";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, loading, loginWithGoogle, logout } = useAuth();
  const [status, setStatus] = useState<string>("");
  const [checkingAccess, setCheckingAccess] = useState(false);

  useEffect(() => {
    if (loading || !user || checkingAccess) return;

    const checkAccess = async () => {
      setCheckingAccess(true);

      try {
        if (!db) {
          setStatus("Auth service is not configured.");
          await logout();
          return;
        }

        const email = user.email?.toLowerCase();

        if (!email) {
          setStatus("Access Denied");
          await logout();
          return;
        }

        if (email === SUPER_ADMIN_EMAIL) {
          const superAdminRef = doc(db, "users", user.uid);
          const existing = await getDoc(superAdminRef);

          if (!existing.exists()) {
            await setDoc(superAdminRef, {
              email,
              role: "super_admin",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(superAdminRef, {
              updatedAt: serverTimestamp(),
            });
          }

          router.replace("/admin/dashboard");
          return;
        }

        const userQuery = query(collection(db, "users"), where("email", "==", email), limit(1));
        const snapshot = await getDocs(userQuery);

        if (snapshot.empty) {
          setStatus("Access Denied");
          await logout();
          return;
        }

        router.replace("/admin/dashboard");
      } catch {
        setStatus("Could not complete sign-in. Please try again.");
      } finally {
        setCheckingAccess(false);
      }
    };

    void checkAccess();
  }, [checkingAccess, loading, logout, router, user]);

  const handleLogin = async () => {
    setStatus("");

    try {
      await loginWithGoogle();
    } catch {
      setStatus("Could not start Google Sign-In.");
    }
  };

  return (
    <section className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-8">
      <div className="w-full rounded-3xl border border-[#e6d8ce] bg-white p-6 shadow-soft">
        <h1 className="font-heading text-2xl font-semibold">Admin Login</h1>
        <p className="mt-2 text-sm text-muted">Sign in with Google to access the admin dashboard.</p>

        <button
          type="button"
          onClick={() => void handleLogin()}
          className="mt-6 min-h-[44px] w-full rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white"
          disabled={loading || checkingAccess}
        >
          {checkingAccess ? "Checking access..." : "Continue with Google"}
        </button>

        {status ? <p className="mt-4 text-sm font-medium text-red-600">{status}</p> : null}
      </div>
    </section>
  );
}
