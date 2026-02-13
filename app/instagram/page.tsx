export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Metadata } from "next";
import { loadInventoryArray, toStorefrontProduct } from "@/lib/server/inventoryStore";

export const metadata: Metadata = {
  title: "Instagram Exclusive Drop | Tacin Arabi Collection",
  description:
    "Curated Instagram drop featuring fast-selling modest fashion pieces and quick WhatsApp checkout.",
  alternates: {
    canonical: "/instagram",
  },
};

export default async function InstagramLandingPage() {
  let shortlist = [] as ReturnType<typeof toStorefrontProduct>[];

  try {
    const products = await loadInventoryArray();
    shortlist = products.map(toStorefrontProduct).filter((item) => item.active !== false).slice(0, 6);
  } catch {
    shortlist = [];
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <section className="mx-auto max-w-4xl rounded-3xl bg-card p-8 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Instagram Special</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-primary-heading">
          Welcome Instagram Family 👋
        </h1>
        <p className="mt-3 text-sm text-muted">
          You unlocked our campaign shortlist: modest fashion picks with fast WhatsApp-first ordering and nationwide Bangladesh delivery.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary min-h-[44px] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
            Shop full collection
          </Link>
          <a
            href="https://wa.me/8801522119189"
            className="btn-secondary min-h-[44px] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
          >
            WhatsApp concierge
          </a>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shortlist.map((product) => (
          <article key={product.id} className="rounded-2xl border border-[#efe1d8] bg-card p-4 shadow-soft">
            <p className="text-xs uppercase tracking-[0.15em] text-muted">{product.category}</p>
            <h2 className="mt-2 text-lg font-semibold text-primary-heading">{product.name}</h2>
            <p className="mt-1 text-sm font-semibold text-accent">৳ {product.price.toLocaleString("en-BD")}</p>
          </article>
        ))}
        {shortlist.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-sm text-muted shadow-soft">No campaign products available right now.</p>
        ) : null}
      </section>
    </main>
  );
}
