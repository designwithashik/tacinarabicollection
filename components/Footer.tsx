export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 mt-16 py-8 text-sm text-neutral-600">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-4">
        <p>© {new Date().getFullYear()} Tacin Arabi Collection</p>
        <div className="flex gap-4">
          <a href="/">Home</a>
        </div>
      </div>
    </footer>
  );
}
