"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { AnnouncementContent, CarouselItem } from "@/lib/siteContent";

const defaultAnnouncement: AnnouncementContent = {
  text: "",
  active: true,
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
  const [announcement, setAnnouncement] = useState<AnnouncementContent>(defaultAnnouncement);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const deleteCandidate = useMemo(
    () => items.find((item) => item.id === deleteCandidateId) ?? null,
    [items, deleteCandidateId]
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
      const [carouselRes, announcementRes] = await Promise.all([
        fetch("/api/admin/content/carousel", { cache: "no-store" }),
        fetch("/api/admin/content/announcement", { cache: "no-store" }),
      ]);

      if (!carouselRes.ok) throw new Error("Unable to load carousel content.");

      const carouselData = (await carouselRes.json()) as CarouselItem[];
      const announcementData = (await announcementRes.json().catch(() => null)) as AnnouncementContent | null;

      setItems(Array.isArray(carouselData) ? carouselData.sort((a, b) => a.order - b.order) : []);
      if (announcementData && typeof announcementData === "object") {
        setAnnouncement({
          text: typeof announcementData.text === "string" ? announcementData.text : "",
          active: announcementData.active !== false,
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load content.");
      setItems([]);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

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
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Unable to save carousel content.");
      }

      setNotice("Carousel content saved.");
      setItems(normalized);
      notifySiteContentUpdated();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save content.");
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
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Unable to save announcement.");
      }

      setNotice("Announcement saved.");
      notifySiteContentUpdated();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save announcement.");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const updateSlide = (id: string, patch: Partial<CarouselItem>) => {
    setItems((prev) => prev.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)));
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

  return (
    <section className="rounded-xl bg-white shadow-md p-6 space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink">Homepage Carousel Content</h2>
        <p className="mt-1 text-sm text-muted">Manage slides visually with preview, safe delete, and ordered save.</p>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}

      <section className="rounded-xl bg-white shadow-md p-6 space-y-6 border border-[#e6d8ce]">
        <div>
          <h3 className="text-xl font-semibold mb-2 text-ink">Text Bar Under Carousel</h3>
          <p className="text-sm text-muted">Control the animated announcement shown below the hero.</p>
        </div>

        <textarea
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
          rows={3}
          placeholder="Enter announcement text"
          value={announcement.text}
          onChange={(e) => setAnnouncement((prev) => ({ ...prev, text: e.target.value }))}
        />

        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={announcement.active}
              onClick={() => setAnnouncement((prev) => ({ ...prev, active: !prev.active }))}
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
                {(announcement.text.trim() || "Your announcement will appear here") + "   •   "}
                {(announcement.text.trim() || "Your announcement will appear here") + "   •   "}
                {announcement.text.trim() || "Your announcement will appear here"}
              </div>
            ) : (
              <p className="text-sm text-white/70">Announcement is currently inactive.</p>
            )}
          </div>
        </div>
      </section>

      <form className="space-y-6" onSubmit={handleSave}>
        <div className="grid gap-6">
          {items.map((item, index) => (
            <article key={item.id} className="grid gap-6 rounded-xl border border-[#e6d8ce] p-6 shadow-md lg:grid-cols-[220px_1fr]">
              <div className="space-y-3">
                <div className="relative h-36 w-full overflow-hidden rounded-lg border border-[#e6d8ce] bg-[#f6f1ed]">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title || `Slide ${index + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">No preview</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#e6d8ce] px-3 py-1 text-xs"
                    disabled={index === 0}
                    onClick={() => moveSlide(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[#e6d8ce] px-3 py-1 text-xs"
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
                  <h3 className="text-sm font-semibold text-ink">Slide {index + 1}</h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.active}
                      onClick={() => updateSlide(item.id, { active: !item.active })}
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
                      className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600"
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
                    onChange={(e) => updateSlide(item.id, { imageUrl: e.target.value })}
                  />
                  <input
                    className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm"
                    placeholder="Title"
                    value={item.title}
                    onChange={(e) => updateSlide(item.id, { title: e.target.value })}
                  />
                  <input
                    className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm"
                    placeholder="Button text"
                    value={item.buttonText}
                    onChange={(e) => updateSlide(item.id, { buttonText: e.target.value })}
                  />
                  <input
                    className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm md:col-span-2"
                    placeholder="Subtitle"
                    value={item.subtitle}
                    onChange={(e) => updateSlide(item.id, { subtitle: e.target.value })}
                  />
                  <input
                    className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm md:col-span-2"
                    placeholder="Button link"
                    value={item.buttonLink}
                    onChange={(e) => updateSlide(item.id, { buttonLink: e.target.value })}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full border border-[#e6d8ce] px-4 py-2 text-sm font-semibold"
            onClick={() => setItems((prev) => [...prev, createBlankSlide(prev.length + 1)])}
          >
            Add New Slide
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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

      {deleteCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md">
            <h4 className="text-base font-semibold text-ink">Delete this slide?</h4>
            <p className="mt-2 text-sm text-muted">This removes the slide from the current draft list.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[#e6d8ce] px-4 py-2 text-sm"
                onClick={() => setDeleteCandidateId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        @keyframes announcementScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
