import Link from "next/link";
import { cn } from "@/lib/utils";

const CALLOUT_STYLES = {
  tip: "border-emerald-300 bg-emerald-50 text-emerald-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  note: "border-slate-300 bg-slate-50 text-slate-900",
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function CountryGuideBlockRenderer({ block }) {
  if (!block || typeof block !== "object") return null;

  switch (block.type) {
    case "bullets": {
      const title = typeof block.content?.title === "string" ? block.content.title : "";
      const items = safeArray(block.content?.items).filter(Boolean);
      if (!title && items.length === 0) return null;
      return (
        <div className="space-y-3">
          {title ? (
            <div className="text-sm font-semibold text-foreground">{title}</div>
          ) : null}
          {items.length ? (
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-foreground">
              {items.map((item, index) => (
                <li key={`${block.id || "bullets"}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }
    case "text": {
      const text = typeof block.content?.text === "string" ? block.content.text : "";
      if (!text) return null;
      return <p className="text-sm leading-6 text-muted-foreground">{text}</p>;
    }
    case "callout": {
      const title =
        typeof block.content?.title === "string" ? block.content.title : "";
      const text = typeof block.content?.text === "string" ? block.content.text : "";
      const variant = typeof block.content?.variant === "string" ? block.content.variant : "note";
      if (!title && !text) return null;
      return (
        <div
          className={cn(
            "rounded-xl border-l-4 px-4 py-3 text-sm",
            CALLOUT_STYLES[variant] || CALLOUT_STYLES.note
          )}
        >
          {title ? <div className="font-semibold">{title}</div> : null}
          {text ? <div className="mt-1 leading-6">{text}</div> : null}
        </div>
      );
    }
    case "links": {
      const items = safeArray(block.content?.items).filter(
        (item) => item && typeof item.label === "string" && typeof item.url === "string"
      );
      if (items.length === 0) return null;
      return (
        <div className="divide-y rounded-xl border bg-muted/20">
          {items.map((item, index) => (
            <Link
              key={`${block.id || "links"}-${index}`}
              href={item.url}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/40"
              target="_blank"
              rel="noreferrer"
            >
              <span>{item.label}</span>
              <span className="text-xs text-muted-foreground">↗</span>
            </Link>
          ))}
        </div>
      );
    }
    case "facts": {
      const items = safeArray(block.content?.items).filter(
        (item) => item && typeof item.key === "string" && typeof item.value === "string"
      );
      if (items.length === 0) return null;
      return (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {items.map((item, index) => (
            <div
              key={`${block.id || "facts"}-${index}`}
              className="rounded-lg border bg-muted/40 px-3 py-2"
            >
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {item.key}
              </dt>
              <dd className="mt-1 font-medium text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
      );
    }
    default:
      return null;
  }
}
