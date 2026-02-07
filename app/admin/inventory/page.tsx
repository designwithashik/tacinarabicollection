"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

type AdminProduct = {
  id: string;
  name: string;
  price: number;
  size?: string;
  image: string;
  active: boolean;
  updatedAt: number;
};

const emptyDraft: AdminProduct = {
  id: "",
  name: "",
  price: 0,
  size: "",
  image: "",
  active: true,
  updatedAt: Date.now(),
};

const validateDraft = (draft: AdminProduct) => {
  if (!draft.id.trim() || !draft.name.trim()) {
    return "ID and name are required.";
  }
  if (!draft.image.trim()) {
    return "Image URL is required.";
  }
  if (Number.isNaN(draft.price) || draft.price <= 0) {
    return "Price must be greater than 0.";
  }
  return null;
};

export default function AdminInventory() {
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [draft, setDraft] = useState<AdminProduct>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  const canUseAdmin = Boolean(adminSecret);

  useEffect(() => {
    if (!canUseAdmin) {
      setError("Admin secret missing. Set NEXT_PUBLIC_ADMIN_SECRET.");
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const response = await fetch("/api/admin/products", {
          headers: { "x-admin-secret": adminSecret },
        });
        if (!response.ok) throw new Error("Unable to load inventory.");
        const data = (await response.json()) as AdminProduct[];
        setItems(data.sort((a, b) => b.updatedAt - a.updatedAt));
      } catch {
        setError("Unable to load inventory.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canUseAdmin]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const markDirty = (id: string) => {
    setDirtyIds((prev) => new Set(prev).add(id));
  };

  const updateItem = (id: string, patch: Partial<AdminProduct>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
    markDirty(id);
  };

  const handleAdd = async () => {
    const validationError = validateDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { ...draft, updatedAt: Date.now() };
      setItems((prev) => [payload, ...prev]);
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Save failed.");
      setNotice("Product added.");
      setDraft(emptyDraft);
    } catch {
      setError("Unable to add product.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (dirtyIds.size === 0) {
      setNotice("No changes to save.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await Promise.all(
        Array.from(dirtyIds).map((id) => {
          const item = items.find((product) => product.id === id);
          if (!item) return Promise.resolve();
          return fetch(`/api/admin/products/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-admin-secret": adminSecret,
            },
            body: JSON.stringify(item),
          }).then((response) => {
            if (!response.ok) throw new Error("Save failed.");
          });
        })
      );
      setDirtyIds(new Set());
      setNotice("Changes saved.");
    } catch {
      setError("Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    setSaving(true);
    setError(null);
    updateItem(id, { active: false });
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { "x-admin-secret": adminSecret },
      });
      if (!response.ok) throw new Error("Delete failed.");
      setNotice("Product archived.");
    } catch {
      setError("Unable to archive product.");
    } finally {
      setSaving(false);
    }
  };

  const dirtyCount = useMemo(() => dirtyIds.size, [dirtyIds]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Inventory</h2>
        <p className="mt-1 text-sm text-muted">
          Live inventory synced with Vercel KV. Changes apply instantly.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Add New Product</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold">
            Product ID
            <input
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.id}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, id: event.target.value }))
              }
            />
          </label>
          <label className="text-xs font-semibold">
            Name
            <input
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.name}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </label>
          <label className="text-xs font-semibold">
            Price (BDT)
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.price}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  price: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="text-xs font-semibold">
            Size (optional)
            <input
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.size}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, size: event.target.value }))
              }
            />
          </label>
        </div>
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold">Image URL</label>
          <input
            className="w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
            value={draft.image}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, image: event.target.value }))
            }
          />
        </div>
        {draft.image ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#f0e4da]">
            <Image
              src={draft.image}
              alt={draft.name || "Preview"}
              width={600}
              height={400}
              className="h-40 w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Inventory List</h3>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading inventory...</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No products yet. Add one to begin.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-[#f0e4da] p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted">{item.id}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.active ? "Active" : "Hidden"}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold">
                    Name
                    <input
                      className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                      value={item.name}
                      onChange={(event) =>
                        updateItem(item.id, { name: event.target.value })
                      }
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Price (BDT)
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                      value={item.price}
                      onChange={(event) =>
                        updateItem(item.id, {
                          price: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Size (optional)
                    <input
                      className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                      value={item.size ?? ""}
                      onChange={(event) =>
                        updateItem(item.id, { size: event.target.value })
                      }
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Image URL
                    <input
                      className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                      value={item.image}
                      onChange={(event) =>
                        updateItem(item.id, { image: event.target.value })
                      }
                    />
                  </label>
                </div>
                {item.image ? (
                  <div className="overflow-hidden rounded-2xl border border-[#f0e4da]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={600}
                      height={400}
                      className="h-36 w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateItem(item.id, { active: !item.active })}
                    className="min-h-[40px] rounded-full border border-[#e6d8ce] px-4 text-xs font-semibold"
                    disabled={saving}
                  >
                    {item.active ? "Hide" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchive(item.id)}
                    className="min-h-[40px] rounded-full border border-[#e6d8ce] px-4 text-xs font-semibold"
                    disabled={saving}
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-4 z-10 rounded-2xl bg-white/95 p-4 shadow-soft backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {dirtyCount > 0
              ? `${dirtyCount} unsaved change${dirtyCount > 1 ? "s" : ""}`
              : "All changes saved."}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveAll}
              className="min-h-[44px] rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
              disabled={saving || !canUseAdmin}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="min-h-[44px] rounded-full border border-[#e6d8ce] px-5 py-2 text-sm font-semibold"
              disabled={saving || !canUseAdmin}
            >
              Add Product
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
