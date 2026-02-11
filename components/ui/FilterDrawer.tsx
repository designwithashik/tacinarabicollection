"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, SlidersHorizontal, X } from "lucide-react";
import clsx from "clsx";
import type { MouseEvent } from "react";

export type DrawerTab = "size" | "color" | "price" | "sort";

export type DrawerFilters = {
  size: string[];
  colors: string[];
  price: string | null;
  sort: string | null;
};

type Option = { id: string; label: string };

type FilterDrawerProps = {
  open: boolean;
  activeTab: DrawerTab;
  draftFilters: DrawerFilters;
  priceRanges: Option[];
  sortOptions: Option[];
  onClose: () => void;
  onTabChange: (tab: DrawerTab) => void;
  onDraftChange: (next: DrawerFilters) => void;
  onApply: () => void;
  onClear: () => void;
  applyLabel: string;
  clearLabel: string;
};

const sizes = ["M", "L", "XL"];
const colors = ["Beige", "Olive", "Maroon", "Black", "Ivory", "Sand", "Terracotta"];

const spring = { type: "spring", stiffness: 380, damping: 34, mass: 0.9 };

export default function FilterDrawer({
  open,
  activeTab,
  draftFilters,
  priceRanges,
  sortOptions,
  onClose,
  onTabChange,
  onDraftChange,
  onApply,
  onClear,
  applyLabel,
  clearLabel,
}: FilterDrawerProps) {
  const title =
    activeTab === "size"
      ? "Filter by Size"
      : activeTab === "color"
      ? "Filter by Color"
      : activeTab === "price"
      ? "Filter by Price"
      : "Sort Products";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-40 flex items-end bg-black/45 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full rounded-t-3xl border border-[#f0e5d7] bg-white p-6 shadow-soft"
            initial={{ y: 420 }}
            animate={{ y: 0 }}
            exit={{ y: 420 }}
            transition={spring}
            onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <SlidersHorizontal className="h-5 w-5 text-accent" />
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="interactive-feedback rounded-full border border-[#eadfce] p-2 text-muted"
                aria-label="Close filter drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {(["size", "color", "price", "sort"] as DrawerTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onTabChange(tab)}
                  className={clsx(
                    "interactive-feedback min-h-[40px] whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide",
                    activeTab === tab
                      ? "border-accent bg-accent text-white"
                      : "border-[#e6d8ce] bg-white text-ink"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "size" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const active = draftFilters.size.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        onDraftChange({
                          ...draftFilters,
                          size: active
                            ? draftFilters.size.filter((item) => item !== size)
                            : [...draftFilters.size, size],
                        })
                      }
                      className={clsx(
                        "interactive-feedback flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
                        active
                          ? "border-accent bg-accent text-white"
                          : "border-[#e6d8ce] bg-white text-ink"
                      )}
                    >
                      {active ? <Check className="h-3.5 w-3.5" /> : null}
                      {size}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {activeTab === "color" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((color) => {
                  const active = draftFilters.colors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        onDraftChange({
                          ...draftFilters,
                          colors: active
                            ? draftFilters.colors.filter((item) => item !== color)
                            : [...draftFilters.colors, color],
                        })
                      }
                      className={clsx(
                        "interactive-feedback flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
                        active
                          ? "border-accent bg-accent text-white"
                          : "border-[#e6d8ce] bg-white text-ink"
                      )}
                    >
                      {active ? <Check className="h-3.5 w-3.5" /> : null}
                      {color}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {activeTab === "price" ? (
              <div className="mt-3 flex flex-col gap-2">
                {priceRanges.map((range) => {
                  const active = draftFilters.price === range.id;
                  return (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() =>
                        onDraftChange({
                          ...draftFilters,
                          price: active ? null : range.id,
                        })
                      }
                      className={clsx(
                        "interactive-feedback flex min-h-[44px] items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold",
                        active
                          ? "border-accent bg-accent text-white"
                          : "border-[#e6d8ce] bg-white text-ink"
                      )}
                    >
                      {range.label}
                      {active ? <Check className="h-4 w-4" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {activeTab === "sort" ? (
              <div className="mt-3 flex flex-col gap-2">
                {sortOptions.map((option) => {
                  const active = draftFilters.sort === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        onDraftChange({
                          ...draftFilters,
                          sort: option.id,
                        })
                      }
                      className={clsx(
                        "interactive-feedback flex min-h-[44px] items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold",
                        active
                          ? "border-accent bg-accent text-white"
                          : "border-[#e6d8ce] bg-white text-ink"
                      )}
                    >
                      {option.label}
                      {active ? <Check className="h-4 w-4" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClear}
                className="interactive-feedback min-h-[44px] rounded-full border border-[#e6d8ce] px-4 py-2 text-sm font-semibold text-ink"
              >
                {clearLabel}
              </button>
              <button
                type="button"
                onClick={onApply}
                className="interactive-feedback min-h-[44px] rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
              >
                {applyLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
