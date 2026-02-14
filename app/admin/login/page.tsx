"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const checkAdminSession = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!mounted) return;

        if (response.status === 200) {
          router.push("/admin/dashboard");
          return;
        }

        if (response.status === 401) {
          setCheckingAuth(false);
          return;
        }

        setError("Unable to verify session. Try again.");
        setCheckingAuth(false);
      } catch {
        if (!mounted) return;
        setError("Server error. Try again.");
        setCheckingAuth(false);
      }
    };

    checkAdminSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 401) {
        setError("Invalid credentials");
        setLoading(false);
        return;
      }

      if (response.ok) {
        router.push("/admin/dashboard");
        return;
      }

      setError("Server error. Try again.");
      setLoading(false);
    } catch {
      setError("Server error. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base px-4 py-8 text-ink sm:py-12">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-2xl border border-[#e6d8ce] bg-white p-6 shadow-soft sm:p-8">
          <h1 className="font-heading text-2xl font-semibold text-ink">Admin Login</h1>
          <p className="mt-2 text-sm text-ink/70">Sign in to continue to the admin dashboard.</p>

          {checkingAuth ? (
            <div className="mt-6 rounded-xl border border-[#e6d8ce] bg-[#fff8f2] p-3 text-sm text-ink/80">
              Checking session...
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink" htmlFor="email">
                  Email
                </label>
                <input
                  autoComplete="email"
                  className="w-full rounded-xl border border-[#e6d8ce] px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-ink" htmlFor="password">
                  Password
                </label>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-[#e6d8ce] px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
