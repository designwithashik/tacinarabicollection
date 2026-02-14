export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-4xl font-semibold mb-4">
        Page Not Found
      </h1>
      <p className="text-neutral-600 mb-6">
        The page you are looking for does not exist.
      </p>
      <a
        href="/"
        className="btn-primary px-6 py-3 rounded-lg"
      >
        Return Home
      </a>
    </div>
  );
}
