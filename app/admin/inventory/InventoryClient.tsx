"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AdminToast from "@/components/admin/AdminToast";
import type { AdminProduct } from "../../../lib/inventory";
import { validateImageUrl } from "../../../lib/images";

const INVENTORY_UPDATED_STORAGE_KEY = "tacin:inventory-updated-at";
const INVENTORY_UPDATED_EVENTS = [
  "tacin:inventory-updated",
  "product-added",
  "product-deleted",
] as const;

const defaultDraft: AdminProduct = {
  id: "",
  name: "",
  price: 0,
  image: "",
  category: "Clothing",
  colors: ["Beige"],
  sizes: ["M", "L", "XL"],
  active: true,
  heroFeatured: false,
  updatedAt: new Date().toISOString(),
};

type ToastState = {
  tone: "success" | "error" | "info";
  message: string;
};

export default function AdminInventory() {
  const router = useRouter();
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [draft, setDraft] = useState<AdminProduct>(defaultDraft);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const isEditing = Boolean(draft.id);

  const hasImageKitConfig = useMemo(
    () =>
      Boolean(
        process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT &&
        process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      ),
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadProducts = async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        cache: "no-store",
        next: { revalidate: 0 },
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as unknown;
      const shaped = Array.isArray(data) ? data.flat() : data ? [data] : [];
      setItems(shaped as AdminProduct[]);
    } catch {
      setError("Failed to load inventory from KV.");
      setItems([]);
      setToast({ tone: "error", message: "Failed to load inventory." });
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const uploadToImageKit = async (file: File) => {
    try {
      const authRes = await fetch("/api/auth/imagekit");
      const authData = (await authRes.json()) as {
        signature?: string;
        expire?: number;
        token?: string;
      };
      if (
        !authRes.ok ||
        !authData.signature ||
        !authData.expire ||
        !authData.token
      ) {
        throw new Error("Auth failed");
      }

      const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
      if (!publicKey) throw new Error("ImageKit public key missing");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("publicKey", publicKey);
      formData.append("signature", authData.signature);
      formData.append("expire", String(authData.expire));
      formData.append("token", authData.token);

      const uploadRes = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!uploadRes.ok) throw new Error("Upload failed");
      const result = (await uploadRes.json()) as { url?: string };
      if (!result.url) throw new Error("Upload missing URL");
      return result.url;
    } catch (uploadError) {
      console.error("Upload failed:", uploadError);
      alert("Media upload failed. Check console.");
      return null;
    }
  };

  const uploadImageIfNeeded = async () => {
    if (!selectedFile) return draft.image;

    if (!hasImageKitConfig) {
      throw new Error(
        "ImageKit env is missing. Set NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT and NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY.",
      );
    }

    setUploading(true);
    try {
      return await uploadToImageKit(selectedFile);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name || draft.price <= 0) {
      setError("Please fill out all required fields.");
      setToast({
        tone: "info",
        message: "Please complete required product fields.",
      });
      return;
    }

    setSaving(true);
    setNotice(null);
    setError(null);

    try {
      let imageUrl = draft.image;
      if (selectedFile) {
        const uploadedUrl = await uploadImageIfNeeded();
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      if (!validateImageUrl(imageUrl)) {
        setError("Please provide a valid image URL.");
        setToast({
          tone: "error",
          message: "Please provide a valid image URL.",
        });
        return;
      }

      const payload: Partial<AdminProduct> & { imageUrl?: string } = {
        name: draft.name,
        price: Number(draft.price),
        image: imageUrl,
        imageUrl,
        category: draft.category,
        colors: draft.colors,
        sizes: draft.sizes,
        active: draft.active,
        heroFeatured: draft.heroFeatured === true,
      };

      const endpoint = isEditing
        ? `/api/admin/products/${encodeURIComponent(draft.id)}`
        : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(json?.error ?? "Failed to save product.");
      }

      setNotice(isEditing ? "Product updated." : "Product created.");
      setToast({
        tone: "success",
        message: isEditing ? "Product updated." : "Product created.",
      });
      setDraft(defaultDraft);
      setSelectedFile(null);
      await loadProducts();
      if (typeof window !== "undefined") {
        const stamp = String(Date.now());
        window.localStorage.setItem(INVENTORY_UPDATED_STORAGE_KEY, stamp);
        INVENTORY_UPDATED_EVENTS.forEach((eventName) => {
          window.dispatchEvent(new Event(eventName));
        });
      }
      router.refresh();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Unable to save product.";
      setError(message);
      setToast({ tone: "error", message });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(id)}/delete`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      setNotice("Product deleted.");
      setToast({ tone: "success", message: "Product deleted." });
      if (draft.id === id) {
        setDraft(defaultDraft);
        setSelectedFile(null);
      }
      await loadProducts();
      if (typeof window !== "undefined") {
        const stamp = String(Date.now());
        window.localStorage.setItem(INVENTORY_UPDATED_STORAGE_KEY, stamp);
        INVENTORY_UPDATED_EVENTS.forEach((eventName) => {
          window.dispatchEvent(new Event(eventName));
        });
      }
      router.refresh();
    } catch {
      setError("Failed to delete product.");
      setToast({ tone: "error", message: "Failed to delete product." });
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-md space-y-6">
        <div>
          <h2 className="border-b pb-3 text-xl font-semibold">Inventory</h2>
          <p className="mt-2 text-sm text-muted">
            Manage products, pricing, and visibility (KV persistence).
          </p>
          <p className="mt-1 text-xs text-muted">
            ImageKit upload requires URL endpoint + public key + server auth
            route.
          </p>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}

        <form className="space-y-6" onSubmit={handleSave}>
          <h3 className="text-xl font-semibold">
            {isEditing ? "Update Product" : "Create Product"}
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold">
              Name
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
              Category
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={draft.category}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    category: event.target.value as AdminProduct["category"],
                  }))
                }
              >
                <option value="Clothing">Clothing</option>
                <option value="Ceramic">Ceramic</option>
              </select>
            </label>
            <label className="text-xs font-semibold">
              Active
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={draft.active ? "true" : "false"}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    active: event.target.value === "true",
                  }))
                }
              >
                <option value="true">Active</option>
                <option value="false">Hidden</option>
              </select>
            </label>
            <label className="text-xs font-semibold">
              Hero Featured
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={draft.heroFeatured ? "true" : "false"}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    heroFeatured: event.target.value === "true",
                  }))
                }
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold">
              Image URL (manual fallback)
            </label>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={draft.image}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, image: event.target.value }))
              }
            />
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
              />
              {uploading ? (
                <span className="text-xs text-muted">Uploading...</span>
              ) : null}
            </div>
          </div>

          {draft.image ? (
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <Image
                src={draft.image}
                alt={draft.name || "Preview"}
                width={600}
                height={400}
                className="h-40 w-full object-cover"
              />
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || uploading}
              className="bg-black text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              {uploading
                ? "Uploading..."
                : saving
                  ? "Saving..."
                  : isEditing
                    ? "Update Product"
                    : "Save Product"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(defaultDraft);
                setSelectedFile(null);
                setError(null);
              }}
              className="border border-black rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md space-y-6">
        <h3 className="border-b pb-3 text-xl font-semibold">Inventory List</h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted">No products yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="max-h-[460px] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{item.name}</p>
                        <p className="text-xs text-muted">{item.id}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold">৳{item.price}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-muted">
                        {item.active ? "Active" : "Hidden"}{" "}
                        {item.heroFeatured ? "• Hero" : ""}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDraft(item);
                              setSelectedFile(null);
                            }}
                            className="border border-black rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item.id)}
                            className="bg-red-600 text-white rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {toast ? (
        <AdminToast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      ) : null}
    </section>
  );
}
