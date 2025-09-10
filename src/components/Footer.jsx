export default function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="mx-auto max-w-6xl px-4 grid gap-8 md:grid-cols-4">
        <div>
          <div className="font-semibold">Travel Co.</div>
          <p className="mt-2 text-sm text-neutral-600">
            Bespoke travel, crafted with care.
          </p>
        </div>
        <div>
        <div className="font-medium">Destinations</div>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700">
            <li>
              <a href="#">Tokyo</a>
            </li>
            <li>
              <a href="#">Kyoto</a>
            </li>
            <li>
              <a href="#">Hokkaido</a>
            </li>
            <li>
              <a href="#">Hiroshima</a>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-medium">Company</div>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700">
            <li>
              <a href="#">About</a>
            </li>
            <li>
              <a href="#">Journal</a>
            </li>
            <li>
              <a href="#">Contact</a>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-medium">Get in touch</div>
          <p className="mt-3 text-sm text-neutral-700">hello@japanman.co.uk</p>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 mt-8 text-xs text-neutral-500">
        © {new Date().getFullYear()} Travel Co.
      </div>
    </footer>
  );
}
