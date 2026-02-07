"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  compressImage,
  uploadToCloudinary,
  validateImageUrl,
} from "../../../lib/images";

const defaultAdminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

type AdminProduct = {
  id: string;
  name: string;
  price: number;
  size?: string;
  image: string;
  active: boolean;
  updatedAt: number;
  tags?: string[];
  stockStatus?: "in" | "low" | "out";
};

const emptyDraft: AdminProduct = {
  id: "",
  name: "",
  price: 0,
  size: "",
  image: "",
  active: true,
  updatedAt: Date.now(),
  tags: [],
  stockStatus: "in",
};

const validateDraft = (draft: AdminProduct) => {
  if (!draft.id.trim() || !draft.name.trim()) {
    return "ID and name are required.";
  }
  if (!draft.image.trim()) {
    return "Image URL is required.";
  }
  if (!validateImageUrl(draft.image)) {
    return "Image URL must be valid.";
  }
  if (Number.isNaN(draft.price) || draft.price <= 0) {
    return "Price must be greater than 0.";
  }
  return null;
};

const validateNewDraft = (draft: AdminProduct) => {
  if (!draft.name.trim()) {
    return "Name is required.";
  }
  if (!draft.image.trim()) {
    return "Image URL is required.";
  }
  if (!validateImageUrl(draft.image)) {
    return "Image URL must be valid.";
  }
  if (Number.isNaN(draft.price) || draft.price <= 0) {
    return "Price must be greater than 0.";
  }
  return null;
};

export default function AdminInventory() {
  const [adminSecret, setAdminSecret] = useState(defaultAdminSecret);
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [draft, setDraft] = useState<AdminProduct>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastArchivedId, setLastArchivedId] = useState<string | null>(null);
  const [cloudName, setCloudName] = useState("");
  const [uploadPreset, setUploadPreset] = useState("");
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">(
    "all"
  );

  const canUseAdmin = Boolean(adminSecret);

  useEffect(() => {
    const storedCloudName = localStorage.getItem("tacin-cloudinary-name");
    const storedPreset = localStorage.getItem("tacin-cloudinary-preset");
    const storedAdminSecret = localStorage.getItem("tacin-admin-secret");
    if (storedCloudName) setCloudName(storedCloudName);
    if (storedPreset) setUploadPreset(storedPreset);
    if (storedAdminSecret && !defaultAdminSecret) {
      setAdminSecret(storedAdminSecret);
    }
  }, []);

  useEffect(() => {
    if (!adminSecret) {
      setError("Admin secret missing. Add it below to unlock saving.");
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
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
  }, [adminSecret]);

  useEffect(() => {
    localStorage.setItem("tacin-cloudinary-name", cloudName);
  }, [cloudName]);

  useEffect(() => {
    localStorage.setItem("tacin-cloudinary-preset", uploadPreset);
  }, [uploadPreset]);

  useEffect(() => {
    if (!adminSecret || defaultAdminSecret) return;
    localStorage.setItem("tacin-admin-secret", adminSecret);
  }, [adminSecret]);

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

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAdd = async () => {
    const validationError = validateNewDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify({
          name: draft.name,
          price: draft.price,
          size: draft.size ?? "",
          image: draft.image,
          active: true,
        }),
      });
      if (!response.ok) throw new Error("Save failed.");
      const data = (await response.json()) as { product?: AdminProduct };
      if (data.product) {
        setItems((prev) => [
          {
            ...data.product,
            tags: data.product.tags ?? [],
            stockStatus: data.product.stockStatus ?? "in",
          },
          ...prev,
        ]);
      }
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
    const invalid = Array.from(dirtyIds).find((id) => {
      const item = items.find((product) => product.id === id);
      return item ? validateDraft(item) : false;
    });
    if (invalid) {
      setError("Please fix validation errors before saving.");
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
      setLastArchivedId(id);
    } catch {
      setError("Unable to archive product.");
    } finally {
      setSaving(false);
    }
  };

  const handleUndoArchive = async () => {
    if (!lastArchivedId) return;
    setSaving(true);
    setError(null);
    updateItem(lastArchivedId, { active: true });
    try {
      const response = await fetch(`/api/admin/products/${lastArchivedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify({ active: true }),
      });
      if (!response.ok) throw new Error("Undo failed.");
      setNotice("Archive undone.");
      setLastArchivedId(null);
    } catch {
      setError("Unable to undo archive.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkToggle = (active: boolean) => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => updateItem(id, { active }));
    setNotice(active ? "Products activated." : "Products hidden.");
  };

  const handleBulkPrice = (percent: number) => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => {
      const item = items.find((product) => product.id === id);
      if (!item) return;
      const nextPrice = Math.max(1, Math.round(item.price * (1 + percent / 100)));
      updateItem(id, { price: nextPrice });
    });
    setNotice("Bulk price update applied.");
  };

  const handleDuplicate = (item: AdminProduct) => {
    const duplicated = {
      ...item,
      id: `${item.id}-copy`,
      updatedAt: Date.now(),
    };
    setItems((prev) => [duplicated, ...prev]);
    markDirty(duplicated.id);
    setNotice("Product duplicated.");
  };

  const handleUpload = async (file: File) => {
    if (!cloudName || !uploadPreset) {
      setError("Add Cloudinary name and upload preset first.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImage(file);
      const url = await uploadToCloudinary({
        file: compressed,
        cloudName,
        uploadPreset,
      });
      setDraft((prev) => ({ ...prev, image: url }));
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const dirtyCount = useMemo(() => dirtyIds.size, [dirtyIds]);
  const isDraftReady =
    !uploading &&
    Boolean(draft.name.trim()) &&
    Boolean(draft.image.trim()) &&
    validateImageUrl(draft.image) &&
    !Number.isNaN(draft.price) &&
    draft.price > 0;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.active) ||
        (statusFilter === "hidden" && !item.active);
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

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
      {lastArchivedId ? (
        <button
          type="button"
          onClick={handleUndoArchive}
          className="w-fit rounded-full border border-[#e6d8ce] px-4 py-2 text-xs font-semibold"
          disabled={saving}
        >
          Undo archive
        </button>
      ) : null}

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Setup</h3>
        <p className="mt-1 text-xs text-muted">
          Add your admin secret and Cloudinary upload settings.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold">
            Admin Secret
            <input
              type="password"
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={adminSecret}
              onChange={(event) => setAdminSecret(event.target.value)}
              placeholder="Paste admin secret"
            />
          </label>
          <label className="text-xs font-semibold">
            Cloud Name
            <input
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={cloudName}
              onChange={(event) => setCloudName(event.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Upload Preset
            <input
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={uploadPreset}
              onChange={(event) => setUploadPreset(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold">Add New Product</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
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
          <label className="text-xs font-semibold">
            Stock Status
            <select
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.stockStatus ?? "in"}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  stockStatus: event.target.value as AdminProduct["stockStatus"],
                }))
              }
            >
              <option value="in">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </label>
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold">
            Tags (comma separated)
            <input
              className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              value={draft.tags?.join(", ") ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  tags: event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                }))
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
          <div
            className="rounded-2xl border border-dashed border-[#e6d8ce] px-4 py-3 text-xs text-muted"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const file = event.dataTransfer.files?.[0];
              if (file) handleUpload(file);
            }}
          >
            Drag & drop an image here to upload
            <div className="mt-2 flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
              {uploading ? (
                <span className="text-xs text-muted">Uploading...</span>
              ) : null}
            </div>
          </div>
          {!uploading && !draft.image ? (
            <p className="text-xs text-muted">
              Upload must finish before adding the product.
            </p>
          ) : null}
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
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <input
              className="w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
              placeholder="Search by name or ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className="rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as typeof statusFilter)
            }
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading inventory...</p>
        ) : filteredItems.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No products yet. Add one to begin.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-[#f0e4da] p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelected(item.id)}
                    />
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted">{item.id}</p>
                    </div>
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
                    Stock Status
                    <select
                      className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                      value={item.stockStatus ?? "in"}
                      onChange={(event) =>
                        updateItem(item.id, {
                          stockStatus:
                            event.target.value as AdminProduct["stockStatus"],
                        })
                      }
                    >
                      <option value="in">In stock</option>
                      <option value="low">Low stock</option>
                      <option value="out">Out of stock</option>
                    </select>
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
                  <label className="text-xs font-semibold">
                    Tags (comma separated)
                    <input
                      className="mt-1 w-full rounded-2xl border border-[#e6d8ce] px-3 py-2 text-sm"
                      value={item.tags?.join(", ") ?? ""}
                      onChange={(event) =>
                        updateItem(item.id, {
                          tags: event.target.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        })
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
                    onClick={() => handleDuplicate(item)}
                    className="min-h-[40px] rounded-full border border-[#e6d8ce] px-4 text-xs font-semibold"
                    disabled={saving}
                  >
                    Duplicate
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
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-base px-3 py-1 text-xs font-semibold text-ink">
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={() => handleBulkToggle(true)}
              className="min-h-[40px] rounded-full border border-[#e6d8ce] px-4 text-xs font-semibold"
              disabled={saving || selectedIds.size === 0}
            >
              Bulk Activate
            </button>
            <button
              type="button"
              onClick={() => handleBulkToggle(false)}
              className="min-h-[40px] rounded-full border border-[#e6d8ce] px-4 text-xs font-semibold"
              disabled={saving || selectedIds.size === 0}
            >
              Bulk Hide
            </button>
            <button
              type="button"
              onClick={() => handleBulkPrice(10)}
              className="min-h-[40px] rounded-full border border-[#e6d8ce] px-4 text-xs font-semibold"
              disabled={saving || selectedIds.size === 0}
            >
              +10% Price
            </button>
            <button
              type="button"
              onClick={() => handleBulkPrice(-10)}
              className="min-h-[40px] rounded-full border border-[#e6d8ce] px-4 text-xs font-semibold"
              disabled={saving || selectedIds.size === 0}
            >
              -10% Price
            </button>
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
              disabled={saving || !canUseAdmin || !isDraftReady}
            >
              Add Product
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
