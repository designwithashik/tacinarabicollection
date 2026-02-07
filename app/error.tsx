"use client";

export default function Error({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-2xl font-semibold text-ink">
        Something went wrong
      </h1>
      <p className="text-sm text-muted">
        Please try again. If the issue persists, refresh the page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </main>
  );
}
