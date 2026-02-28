import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-5 px-6 text-center">
      <Image
        src="/images/tacin-logo.svg"
        alt="Tacin Arabi Collection"
        width={120}
        height={120}
        className="h-auto w-24 sm:w-28"
        priority
      />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50">
        404 Error
      </p>
      <h1 className="font-heading text-3xl font-semibold text-black sm:text-4xl">
        Page not found
      </h1>
      <p className="max-w-md text-sm text-black/70 sm:text-base">
        The page you are looking for may have moved or no longer exists.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black/85"
      >
        Back to home
      </Link>
    </main>
  );
}
