export default function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="mx-auto max-w-6xl px-4 grid gap-8 md:grid-cols-4">
        <div>
          <div className="font-semibold">Seawhere</div>
          <p className="mt-2 text-sm text-neutral-600">
            Bespoke itineraries across Southeast Asia&apos;s most extraordinary places.
          </p>
        </div>
        <div>
          <div className="font-medium">Get in touch</div>
          <p className="mt-3 text-sm text-neutral-700">hello@seawhere.com</p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 mt-8 text-xs text-neutral-500">
        © {new Date().getFullYear()} Seawhere
      </div>
    </footer>
  );
}
