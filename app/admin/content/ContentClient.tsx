"use client";

import { useEffect, useState } from "react";
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
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save announcement.");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-[#e6d8ce] bg-white p-4 md:p-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink">Homepage Carousel Content</h2>
        <p className="mt-1 text-sm text-muted">Manage slide image, text, button, active state, and order.</p>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}

      <section className="space-y-3 rounded-xl border border-[#e6d8ce] p-3">
        <h3 className="text-sm font-semibold text-ink">Animated Announcement Bar</h3>
        <input
          className="w-full rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm"
          placeholder="Announcement text"
          value={announcement.text}
          onChange={(e) => setAnnouncement((prev) => ({ ...prev, text: e.target.value }))}
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={announcement.active}
            onChange={(e) => setAnnouncement((prev) => ({ ...prev, active: e.target.checked }))}
          />
          Active
        </label>
        <button
          type="button"
          onClick={handleSaveAnnouncement}
          disabled={savingAnnouncement}
          className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {savingAnnouncement ? "Saving..." : "Save Announcement"}
        </button>
      </section>

      <form className="space-y-4" onSubmit={handleSave}>
        <div className="space-y-3">
          {items.map((item, index) => (
            <article key={item.id} className="space-y-3 rounded-xl border border-[#e6d8ce] p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Slide {index + 1}</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#e6d8ce] px-3 py-1 text-xs"
                    disabled={index === 0}
                    onClick={() => {
                      if (index === 0) return;
                      const next = [...items];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      setItems(next);
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[#e6d8ce] px-3 py-1 text-xs"
                    disabled={index === items.length - 1}
                    onClick={() => {
                      if (index === items.length - 1) return;
                      const next = [...items];
                      [next[index], next[index + 1]] = [next[index + 1], next[index]];
                      setItems(next);
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600"
                    onClick={() => setItems((prev) => prev.filter((slide) => slide.id !== item.id))}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm"
                  placeholder="Image URL"
                  value={item.imageUrl}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((slide) =>
                        slide.id === item.id ? { ...slide, imageUrl: e.target.value } : slide
                      )
                    )
                  }
                />
                <input
                  className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm"
                  placeholder="Title"
                  value={item.title}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((slide) =>
                        slide.id === item.id ? { ...slide, title: e.target.value } : slide
                      )
                    )
                  }
                />
                <input
                  className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm md:col-span-2"
                  placeholder="Subtitle"
                  value={item.subtitle}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((slide) =>
                        slide.id === item.id ? { ...slide, subtitle: e.target.value } : slide
                      )
                    )
                  }
                />
                <input
                  className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm"
                  placeholder="Button text"
                  value={item.buttonText}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((slide) =>
                        slide.id === item.id ? { ...slide, buttonText: e.target.value } : slide
                      )
                    )
                  }
                />
                <input
                  className="rounded-lg border border-[#e6d8ce] px-3 py-2 text-sm"
                  placeholder="Button link"
                  value={item.buttonLink}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((slide) =>
                        slide.id === item.id ? { ...slide, buttonLink: e.target.value } : slide
                      )
                    )
                  }
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((slide) =>
                        slide.id === item.id ? { ...slide, active: e.target.checked } : slide
                      )
                    )
                  }
                />
                Active
              </label>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full border border-[#e6d8ce] px-4 py-2 text-sm font-semibold"
            onClick={() => setItems((prev) => [...prev, createBlankSlide(prev.length + 1)])}
          >
            Add Slide
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Carousel"}
          </button>
        </div>
      </form>
    </section>
  );
}
