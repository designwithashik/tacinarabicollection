"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import AdminToast from "@/components/admin/AdminToast";
import type {
  AnnouncementContent,
  CarouselItem,
  FilterPanelItem,
} from "@/lib/siteContent";

const defaultAnnouncement: AnnouncementContent = {
  text: "",
  active: true,
};

const defaultFilters: FilterPanelItem[] = [
  {
    id: "all",
    label: "All",
    value: "All",
    active: true,
    highlight: true,
    showOnLanding: true,
    order: 1,
  },
  {
    id: "clothing",
    label: "Clothing",
    value: "Clothing",
    active: true,
    highlight: false,
    showOnLanding: true,
    order: 2,
  },
  {
    id: "ceramic",
    label: "Ceramic",
    value: "Ceramic",
    active: true,
    highlight: false,
    showOnLanding: true,
    order: 3,
  },
];

const normalizeFilters = (payload: unknown): FilterPanelItem[] => {
  if (!Array.isArray(payload)) return defaultFilters;

  const normalized = payload
    .filter((item): item is FilterPanelItem =>
      Boolean(item && typeof item === "object"),
    )
    .map((item, index) => ({
      id:
        typeof item.id === "string" && item.id ? item.id : crypto.randomUUID(),
      label: typeof item.label === "string" ? item.label : "",
      value: typeof item.value === "string" ? item.value : "",
      active: item.active !== false,
      highlight: item.highlight === true,
      showOnLanding: item.showOnLanding !== false,
      order: Number.isFinite(item.order) ? Number(item.order) : index + 1,
    }))
    .filter((item) => item.label.trim() && item.value.trim())
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }));

  return normalized.length ? normalized : defaultFilters;
};

const createBlankSlide = (order: number): CarouselItem => ({
  id: crypto.randomUUID(),
  imageUrl: "",
  title: "",
  subtitle: "",
  buttonText: "Shop Now",
  buttonLink: "/",
  active: true,
  order,
});

export default function ContentClient() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [announcement, setAnnouncement] =
    useState<AnnouncementContent>(defaultAnnouncement);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(
    null,
  );
  const [filters, setFilters] = useState<FilterPanelItem[]>(defaultFilters);
  const [savingFilters, setSavingFilters] = useState(false);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    tone: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const deleteCandidate = useMemo(
    () => items.find((item) => item.id === deleteCandidateId) ?? null,
    [items, deleteCandidateId],
  );

  const hasImageKitConfig = useMemo(
    () =>
      Boolean(
        process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT &&
          process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      ),
    [],
  );

  const notifySiteContentUpdated = () => {
    if (typeof window === "undefined") return;
    const stamp = String(Date.now());
    window.localStorage.setItem("site-content-updated", stamp);
    window.dispatchEvent(new Event("site-content-updated"));
  };

  const loadItems = async () => {
    setError(null);
    try {
      const [carouselRes, announcementRes, filtersRes] = await Promise.all([
        fetch("/api/admin/content/carousel", { cache: "no-store" }),
        fetch("/api/admin/content/announcement", { cache: "no-store" }),
        fetch("/api/content/filters", { cache: "no-store" }),
      ]);

      if (!carouselRes.ok) throw new Error("Unable to load carousel content.");

      const carouselData = (await carouselRes.json()) as CarouselItem[];
      const announcementData = (await announcementRes
        .json()
        .catch(() => null)) as AnnouncementContent | null;

      setItems(
        Array.isArray(carouselData)
          ? carouselData.sort((a, b) => a.order - b.order)
          : [],
      );
      if (announcementData && typeof announcementData === "object") {
        setAnnouncement({
          text:
            typeof announcementData.text === "string"
              ? announcementData.text
              : "",
          active: announcementData.active !== false,
        });
      }

      if (filtersRes.ok) {
        const filtersData = (await filtersRes.json()) as unknown;
        setFilters(normalizeFilters(filtersData));
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load content.",
      );
      setItems([]);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const normalized = items
        .map((item, index) => ({ ...item, order: index + 1 }))
        .filter((item) => item.imageUrl.trim().length > 0);

      const res = await fetch("/api/admin/content/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: normalized }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(json?.error ?? "Unable to save carousel content.");
      }

      setNotice("Carousel content saved.");
      setToast({ tone: "success", message: "Carousel content saved." });
      setItems(normalized);
      notifySiteContentUpdated();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save content.",
      );
      setToast({ tone: "error", message: "Unable to save carousel content." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    setSavingAnnouncement(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/admin/content/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcement),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(json?.error ?? "Unable to save announcement.");
      }

      setNotice("Announcement saved.");
      setToast({ tone: "success", message: "Announcement saved." });
      notifySiteContentUpdated();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save announcement.",
      );
      setToast({ tone: "error", message: "Unable to save announcement." });
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const uploadSlideImage = async (slideId: string, file: File) => {
    if (!hasImageKitConfig) {
      setError(
        "ImageKit env is missing. Set NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT and NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY.",
      );
      setToast({ tone: "error", message: "Image upload is not configured." });
      return;
    }

    setUploadingSlideId(slideId);
    setError(null);

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
        throw new Error("Unable to authorize image upload.");
      }

      const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
      if (!publicKey) throw new Error("ImageKit public key missing.");

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

      if (!uploadRes.ok) throw new Error("Upload failed.");

      const result = (await uploadRes.json()) as { url?: string };
      if (!result.url) throw new Error("Upload URL missing.");

      updateSlide(slideId, { imageUrl: result.url });
      setToast({ tone: "success", message: "Slide image uploaded." });
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload slide image.";
      setError(message);
      setToast({ tone: "error", message: "Unable to upload slide image." });
    } finally {
      setUploadingSlideId(null);
    }
  };

  const updateSlide = (id: string, patch: Partial<CarouselItem>) => {
    setItems((prev) =>
      prev.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)),
    );
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    setItems((prev) => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const confirmDelete = () => {
    if (!deleteCandidateId) return;
    setItems((prev) => prev.filter((slide) => slide.id !== deleteCandidateId));
    setDeleteCandidateId(null);
  };

  const moveFilter = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= filters.length) return;

    setFilters((prev) => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next.map((item, orderIndex) => ({
        ...item,
        order: orderIndex + 1,
      }));
    });
  };

  const updateFilter = (id: string, patch: Partial<FilterPanelItem>) => {
    setFilters((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const saveFilters = async () => {
    setSavingFilters(true);
    setError(null);
    setNotice(null);

    try {
      const payload = filters.map((item, index) => ({
        ...item,
        order: index + 1,
      }));
      const response = await fetch("/api/content/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to save filters.");
      }

      setNotice("Filter panel saved.");
      setToast({ tone: "success", message: "Filter panel saved." });
      const stamp = Date.now().toString();
      localStorage.setItem("site-content-updated", stamp);
      window.dispatchEvent(new Event("site-content-updated"));
    } catch {
      setError("Unable to save filters.");
      setToast({ tone: "error", message: "Unable to save filters." });
    } finally {
      setSavingFilters(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-ink">
          Homepage Carousel Content
        </h2>
        <p className="mt-1 text-sm text-muted">
          Manage slides visually with preview, safe delete, and ordered save.
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

      <section className="rounded-2xl bg-white p-6 shadow-md space-y-6 border border-gray-200">
        <div>
          <h3 className="border-b pb-3 text-xl font-semibold text-ink">
            Text Bar Under Carousel
          </h3>
          <p className="text-sm text-muted">
            Control the animated announcement shown below the hero.
          </p>
        </div>

        <textarea
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
          rows={3}
          placeholder="Enter announcement text"
          value={announcement.text}
          onChange={(e) =>
            setAnnouncement((prev) => ({ ...prev, text: e.target.value }))
          }
        />

        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={announcement.active}
              onClick={() =>
                setAnnouncement((prev) => ({ ...prev, active: !prev.active }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                announcement.active ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  announcement.active ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-ink">Active</span>
          </div>

          <button
            type="button"
            onClick={handleSaveAnnouncement}
            disabled={savingAnnouncement}
            className="bg-black text-white px-5 py-2.5 rounded-full font-medium transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-60"
          >
            {savingAnnouncement ? "Saving..." : "Save Text Bar"}
          </button>
        </div>

        <div className="mt-4 rounded-lg border p-4 overflow-hidden relative bg-gray-50">
          <p className="text-xs font-semibold text-muted mb-2">Live Preview</p>
          <div className="rounded-md bg-black py-2 px-3 text-white overflow-hidden">
            {announcement.active ? (
              <div className="whitespace-nowrap animate-[announcementScroll_20s_linear_infinite] text-sm">
                {(announcement.text.trim() ||
                  "Your announcement will appear here") + "   •   "}
                {(announcement.text.trim() ||
                  "Your announcement will appear here") + "   •   "}
                {announcement.text.trim() ||
                  "Your announcement will appear here"}
              </div>
            ) : (
              <p className="text-sm text-white/70">
                Announcement is currently inactive.
              </p>
            )}
          </div>
        </div>
      </section>

      <form className="space-y-6" onSubmit={handleSave}>
        <div className="grid gap-6">
          {items.map((item, index) => (
            <article
              key={item.id}
              className="grid gap-6 rounded-xl border border-[#e6d8ce] p-6 shadow-md lg:grid-cols-[220px_1fr]"
            >
              <div className="space-y-3">
                <div className="relative h-36 w-full overflow-hidden rounded-lg border border-[#e6d8ce] bg-[#f6f1ed]">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title || `Slide ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">
                      No preview
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="border border-black rounded-full px-3 py-1 text-xs transition-all duration-200 hover:scale-105 active:scale-95"
                    disabled={index === 0}
                    onClick={() => moveSlide(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="border border-black rounded-full px-3 py-1 text-xs transition-all duration-200 hover:scale-105 active:scale-95"
                    disabled={index === items.length - 1}
                    onClick={() => moveSlide(index, 1)}
                  >
                    ↓
                  </button>
                  <span className="text-xs text-muted">Order {index + 1}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">
                    Slide {index + 1}
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.active}
                      onClick={() =>
                        updateSlide(item.id, { active: !item.active })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        item.active ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          item.active ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      className="bg-red-600 text-white rounded-full px-3 py-1 text-xs transition-all duration-200 hover:scale-105 active:scale-95"
                      onClick={() => setDeleteCandidateId(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm md:col-span-2"
                    placeholder="Image URL"
                    value={item.imageUrl}
                    onChange={(e) =>
                      updateSlide(item.id, { imageUrl: e.target.value })
                    }
                  />
                  <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center rounded-full border border-black px-4 py-2 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95">
                      Upload image
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          void uploadSlideImage(item.id, file);
                          event.currentTarget.value = "";
                        }}
                        disabled={uploadingSlideId === item.id}
                      />
                    </label>
                    <span className="text-xs text-muted">
                      {uploadingSlideId === item.id
                        ? "Uploading image..."
                        : hasImageKitConfig
                          ? "Upload directly to ImageKit"
                          : "ImageKit not configured"}
                    </span>
                  </div>
                  <input
                    className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm"
                    placeholder="Title"
                    value={item.title}
                    onChange={(e) =>
                      updateSlide(item.id, { title: e.target.value })
                    }
                  />
                  <input
                    className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm"
                    placeholder="Button text"
                    value={item.buttonText}
                    onChange={(e) =>
                      updateSlide(item.id, { buttonText: e.target.value })
                    }
                  />
                  <input
                    className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm md:col-span-2"
                    placeholder="Subtitle"
                    value={item.subtitle}
                    onChange={(e) =>
                      updateSlide(item.id, { subtitle: e.target.value })
                    }
                  />
                  <input
                    className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm md:col-span-2"
                    placeholder="Button link"
                    value={item.buttonLink}
                    onChange={(e) =>
                      updateSlide(item.id, { buttonLink: e.target.value })
                    }
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="border border-black rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            onClick={() =>
              setItems((prev) => [...prev, createBlankSlide(prev.length + 1)])
            }
          >
            Add New Slide
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-black text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving...
              </>
            ) : (
              "Save Carousel"
            )}
          </button>
        </div>
      </form>

      <section className="rounded-2xl bg-white p-6 shadow-md space-y-6 border border-gray-200">
        <div>
          <h3 className="border-b pb-3 text-xl font-semibold text-ink">
            Filter Panel Manager
          </h3>
          <p className="mt-2 text-sm text-muted">
            Manage homepage category filter labels, values, order, and emphasis.
          </p>
        </div>

        <div className="space-y-3">
          {filters.map((filter, index) => (
            <article
              key={filter.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  Filter {index + 1}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="border border-black rounded-full px-3 py-1 text-xs transition-all duration-200 hover:scale-105 active:scale-95"
                    onClick={() => moveFilter(index, -1)}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="border border-black rounded-full px-3 py-1 text-xs transition-all duration-200 hover:scale-105 active:scale-95"
                    onClick={() => moveFilter(index, 1)}
                    disabled={index === filters.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="bg-red-600 text-white rounded-full px-3 py-1 text-xs transition-all duration-200 hover:scale-105 active:scale-95"
                    onClick={() =>
                      setFilters((prev) =>
                        prev.filter((item) => item.id !== filter.id),
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold text-muted">
                  Label
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={filter.label}
                    onChange={(event) =>
                      updateFilter(filter.id, { label: event.target.value })
                    }
                  />
                </label>
                <label className="text-xs font-semibold text-muted">
                  Value (category key)
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={filter.value}
                    onChange={(event) =>
                      updateFilter(filter.id, { value: event.target.value })
                    }
                  />
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={filter.active}
                    onChange={(event) =>
                      updateFilter(filter.id, { active: event.target.checked })
                    }
                  />
                  Active
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={filter.highlight}
                    onChange={(event) =>
                      updateFilter(filter.id, {
                        highlight: event.target.checked,
                      })
                    }
                  />
                  Highlight
                </label>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
                  <span>Show on Landing</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={filter.showOnLanding !== false}
                    onClick={() =>
                      updateFilter(filter.id, {
                        showOnLanding: filter.showOnLanding === false,
                      })
                    }
                    className={`relative h-6 w-12 rounded-full transition ${
                      filter.showOnLanding !== false
                        ? "bg-black"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        filter.showOnLanding !== false
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="border border-black rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            onClick={() =>
              setFilters((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  label: "",
                  value: "",
                  active: true,
                  highlight: false,
                  showOnLanding: true,
                  order: prev.length + 1,
                },
              ])
            }
          >
            Add Filter
          </button>
          <button
            type="button"
            onClick={() => void saveFilters()}
            disabled={savingFilters}
            className="bg-black text-white rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60"
          >
            {savingFilters ? "Saving..." : "Save Filters"}
          </button>
        </div>
      </section>

      {deleteCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="admin-modal-enter w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h4 className="text-base font-semibold text-ink">
              Delete this slide?
            </h4>
            <p className="mt-2 text-sm text-muted">
              This removes the slide from the current draft list.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="border border-black rounded-full px-4 py-2 text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => setDeleteCandidateId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-600 text-white rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <AdminToast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      ) : null}

      <style jsx global>{`
        @keyframes announcementScroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
