import SafeImage from "@/components/SafeImage";
import { Tile } from "@/components/ui/tile";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";

function firstParagraph(value) {
  try {
    if (!value) return "";
    if (typeof value === "string") {
      return value.trim();
    }
    if (Array.isArray(value)) {
      const parts = value
        .map((entry) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object" && typeof entry.text === "string") {
            return entry.text;
          }
          return "";
        })
        .filter(Boolean);
      return parts[0] || "";
    }
    if (typeof value === "object") {
      if (value.type === "paragraph") {
        const nodes = Array.isArray(value.content) ? value.content : [];
        return nodes.map((n) => n?.text || "").join("").trim();
      }
      if (value.type === "doc" && Array.isArray(value.content)) {
        for (const node of value.content) {
          if (node?.type === "paragraph") {
            const nodes = Array.isArray(node.content) ? node.content : [];
            const text = nodes.map((n) => n?.text || "").join("").trim();
            if (text) return text;
          }
        }
      }
      if (typeof value.text === "string") return value.text.trim();
      if (typeof value.summary === "string") return value.summary.trim();
    }
  } catch {}
  return "";
}

export default function FoodDrink({ items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <section id="food-drink">
        <div className="pt-2">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl md:text-4xl font-medium">Food &amp; Drink</h2>
          </div>
        </div>
        <div className="mt-8 text-center text-muted-foreground">
          No food &amp; drink items available
        </div>
      </section>
    );
  }

  const sorted = [...items].sort((a, b) =>
    (a.title || a.name || "").localeCompare(b.title || b.name || "")
  );

  return (
    <section id="food-drink">
      <div className="pt-2">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Food &amp; Drink</h2>
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sorted.map((item) => {
          const img = resolveImageUrl(firstImageFromImages(item?.images));
          const displayName = item.title || item.name || "Food & Drink";
          const href = item.slug ? `/food-drink/${item.slug}` : "#";
          const summary = firstParagraph(item.summary ?? item.description);

          return (
            <Tile.Link
              key={item.slug || `fooddrink-${displayName}`}
              href={href}
              className="group"
            >
              <Tile.Image>
                {img ? (
                  <SafeImage
                    src={img}
                    alt={displayName}
                    fill
                    sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : null}
              </Tile.Image>
              <Tile.Content>
                <div className="font-medium">{displayName}</div>
                {summary ? (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {summary}
                  </p>
                ) : null}
              </Tile.Content>
            </Tile.Link>
          );
        })}
      </div>
    </section>
  );
}
