"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-6">
      <form
        onSubmit={handleSubmit}
        className="card w-full max-w-md p-8"
      >
        <h1 className="mb-1 text-2xl font-bold text-ink">
          Welcome back
        </h1>
        <p className="mb-6 text-sm text-ink-2">
          Sign in to your Fluxo account.
        </p>

        {error && (
          <div className="mb-4 rounded bg-rose-soft p-3 text-sm text-rose">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-ink-3"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-line bg-surface px-3 py-2 text-ink placeholder:text-ink-3"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary py-2 text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-ink-2">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:text-primary-hover">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}