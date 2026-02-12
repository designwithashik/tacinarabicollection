"use client";
// Client component required for interactive product card buttons.

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "../lib/products";

type Props = {
  product: Product;
  onOpenDetails: () => void;
  showBadge?: string;
  priceLabel: string;
  statusLabel: string;
  stockLabel: string;
};

export default function ProductCard({
  product,
  onOpenDetails,
  showBadge,
  priceLabel,
  statusLabel,
  stockLabel,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [product.id, product.image]);

  const imageSrc = useMemo(() => {
    if (!product.image || !product.image.trim()) return null;
    return product.image;
  }, [product.image]);

  return (
    <article className="group relative flex min-h-[460px] h-full flex-col rounded-[22px] border border-[#efe1d8] bg-card p-3 shadow-soft md:p-3.5">
      <button
        type="button"
        className="interactive-feedback relative w-full overflow-hidden rounded-xl bg-base"
        onClick={onOpenDetails}
        aria-label={`Open details for ${product.name}`}
      >
        {imageSrc && !imageFailed ? (
          <Image
            src={imageSrc}
            alt={product.name}
            width={520}
            height={650}
            className="aspect-[4/5] w-full object-cover transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] motion-reduce:transform-none motion-reduce:transition-none group-hover:scale-[1.03]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-[#f6efe3] via-[#f2e6d3] to-[#e8dcc6]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.65),transparent_45%),radial-gradient(circle_at_70%_75%,rgba(200,169,107,0.3),transparent_42%)]" />
            <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/40 bg-white/45 p-3 text-left backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/70">Tacin Arabi</p>
              <p className="mt-1 font-heading text-sm font-semibold text-charcoal/85">Luxury Placeholder</p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-2.5 bottom-2.5 rounded-xl border border-white/30 bg-white/35 p-2.5 text-left backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-charcoal/80">{product.category}</p>
          <p className="mt-1 font-heading text-sm font-semibold text-charcoal transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] motion-reduce:transform-none motion-reduce:transition-none group-hover:translate-y-[-1px]">
            {product.name}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-charcoal/80">
            {stockLabel}
          </p>
        </div>

        {showBadge ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-accent/85 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white">
            {showBadge}
          </span>
        ) : null}
        <span className="absolute right-2.5 top-2.5 rounded-full border border-white/60 bg-white/85 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-ink/85">
          {statusLabel}
        </span>
      </button>

      <div className="mt-3 flex items-start justify-between gap-2.5">
        <div>
          <h3 className="font-heading text-base font-semibold text-ink">{product.name}</h3>
          <p className="mt-0.5 text-xs font-medium text-accent">{stockLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{priceLabel}</p>
          <p className="text-lg font-bold text-ink">৳{product.price}</p>
        </div>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={onOpenDetails}
          className="interactive-feedback min-h-[40px] w-full rounded-full border border-accent/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent transition-colors duration-300 hover:border-accent hover:bg-accent/5 motion-reduce:transition-none"
        >
          Quick View
        </button>
      </div>
    </article>
  );
}
