"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!mounted) {
          return;
        }

        if (response.ok) {
          router.push("/admin/dashboard");
          return;
        }

        if (response.status === 401) {
          setCheckingAuth(false);
          return;
        }

        setError("Unable to validate admin session.");
        setCheckingAuth(false);
      } catch {
        if (!mounted) {
          return;
        }
        setError("Server error. Try again.");
        setCheckingAuth(false);
      }
    };

    verifySession();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

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

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base px-4 text-ink">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e6d8ce] border-t-accent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4 py-8 text-ink">
      <div className="w-full max-w-md rounded-2xl border border-[#e6d8ce] bg-white p-6 shadow-soft sm:p-8">
        <h1 className="font-heading text-2xl font-semibold">Admin Login</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-xl border border-[#d8c8bc] px-4 py-2.5 text-sm outline-none transition focus:border-accent"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="w-full rounded-xl border border-[#d8c8bc] px-4 py-2.5 text-sm outline-none transition focus:border-accent"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button
            className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
