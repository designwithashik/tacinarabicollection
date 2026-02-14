export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 mt-16 py-6 text-[12px] text-neutral-600">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-3">
        <p>© {new Date().getFullYear()} Tacin Arabi Collection</p>
        <div className="flex gap-3">
          <a href="/" className="transition-all duration-200 ease-out hover:text-[var(--brand-accent)]">Home</a>
        </div>
      </div>
    </footer>
  );
}
