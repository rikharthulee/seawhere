"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const BLOCK_TYPES = ["bullets", "text", "callout", "links", "facts"];
const CALLOUT_VARIANTS = ["tip", "warning", "note"];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function emptyGuide() {
  return {
    intro: "",
    facts: [],
    sections: [],
  };
}

function emptySection(position) {
  return {
    title: "",
    slug: "",
    summary: "",
    position,
    blocks: [],
  };
}

function emptyBlock(position) {
  return {
    type: "bullets",
    position,
    content: { items: [] },
  };
}

function updateArray(arr, index, updater) {
  return arr.map((item, idx) => (idx === index ? updater(item) : item));
}

function reorderArray(arr, index, direction) {
  const next = [...arr];
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= next.length) return next;
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

function withPositions(arr) {
  return arr.map((item, index) => ({ ...item, position: index + 1 }));
}

function parseLineItems(value) {
  return String(value || "").split("\n");
}

function toLineItems(items) {
  return Array.isArray(items) ? items.join("\n") : "";
}

export default function CountryGuideManager() {
  const [countries, setCountries] = useState([]);
  const [countrySlug, setCountrySlug] = useState("");
  const [guide, setGuide] = useState(emptyGuide());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const countryOptions = useMemo(
    () => countries.map((country) => ({ value: country.slug, label: country.name })),
    [countries]
  );

  async function loadCountries() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/country-guides", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      const list = Array.isArray(json.countries) ? json.countries : [];
      setCountries(list);
      if (!countrySlug && list.length) {
        const laos = list.find((c) => c.slug === "laos");
        setCountrySlug(laos?.slug || list[0].slug);
      }
    } catch (err) {
      setError(err?.message || "Failed to load countries");
    } finally {
      setLoading(false);
    }
  }

  async function loadGuide(slug) {
    if (!slug) {
      setGuide(emptyGuide());
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/country-guides?country=${slug}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setGuide(json.guide || emptyGuide());
    } catch (err) {
      setError(err?.message || "Failed to load guide");
      setGuide(emptyGuide());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (countrySlug) {
      loadGuide(countrySlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countrySlug]);

  function updateGuide(changes) {
    setGuide((prev) => ({ ...prev, ...changes }));
  }

  function updateSection(index, updater) {
    setGuide((prev) => ({
      ...prev,
      sections: updateArray(prev.sections || [], index, updater),
    }));
  }

  function updateBlock(sectionIndex, blockIndex, updater) {
    updateSection(sectionIndex, (section) => ({
      ...section,
      blocks: updateArray(section.blocks || [], blockIndex, updater),
    }));
  }

  function addSection() {
    setGuide((prev) => ({
      ...prev,
      sections: withPositions([...(prev.sections || []), emptySection((prev.sections || []).length + 1)]),
    }));
  }

  function removeSection(index) {
    setGuide((prev) => ({
      ...prev,
      sections: withPositions(prev.sections.filter((_, idx) => idx !== index)),
    }));
  }

  function moveSection(index, direction) {
    setGuide((prev) => ({
      ...prev,
      sections: withPositions(reorderArray(prev.sections || [], index, direction)),
    }));
  }

  function addBlock(sectionIndex) {
    updateSection(sectionIndex, (section) => ({
      ...section,
      blocks: withPositions([...(section.blocks || []), emptyBlock((section.blocks || []).length + 1)]),
    }));
  }

  function removeBlock(sectionIndex, blockIndex) {
    updateSection(sectionIndex, (section) => ({
      ...section,
      blocks: withPositions(section.blocks.filter((_, idx) => idx !== blockIndex)),
    }));
  }

  function moveBlock(sectionIndex, blockIndex, direction) {
    updateSection(sectionIndex, (section) => ({
      ...section,
      blocks: withPositions(reorderArray(section.blocks || [], blockIndex, direction)),
    }));
  }

  async function saveGuide() {
    if (!countrySlug) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/country-guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_slug: countrySlug,
          intro: guide.intro || "",
          facts: guide.facts || [],
          sections: guide.sections || [],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setMessage("Saved guide.");
      await loadGuide(countrySlug);
    } catch (err) {
      setError(err?.message || "Failed to save guide");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Country guide editor</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update travel basics content shown on country pages.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Country</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={countrySlug}
              onChange={(event) => setCountrySlug(event.target.value)}
              disabled={loading}
            >
              <option value="">Select a country</option>
              {countryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          {message ? <div className="text-sm text-emerald-600">{message}</div> : null}
        </CardContent>
      </Card>

      {!countrySlug ? null : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Guide intro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <label className="text-sm font-medium">Short intro</label>
              <Textarea
                value={guide.intro || ""}
                onChange={(event) => updateGuide({ intro: event.target.value })}
                rows={3}
                placeholder="Short 1–2 paragraph intro."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Facts bar</CardTitle>
              <Button variant="outline" size="sm" onClick={() => updateGuide({ facts: [...(guide.facts || []), { key: "", value: "" }] })}>
                + Add fact
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {(guide.facts || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No facts yet.</p>
              ) : null}
              {(guide.facts || []).map((fact, index) => (
                <div key={`fact-${index}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                  <Input
                    placeholder="Label"
                    value={fact?.key || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      updateGuide({
                        facts: updateArray(guide.facts || [], index, (entry) => ({
                          ...entry,
                          key: value,
                        })),
                      });
                    }}
                  />
                  <Input
                    placeholder="Value"
                    value={fact?.value || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      updateGuide({
                        facts: updateArray(guide.facts || [], index, (entry) => ({
                          ...entry,
                          value,
                        })),
                      });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateGuide({
                        facts: (guide.facts || []).filter((_, idx) => idx !== index),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Guide sections</CardTitle>
              <Button onClick={addSection} size="sm">
                + Add section
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {(guide.sections || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No sections yet.</p>
              ) : null}

              {(guide.sections || []).map((section, sectionIndex) => (
                <div key={`section-${sectionIndex}`} className="space-y-4 rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold">Section {sectionIndex + 1}</div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(sectionIndex, "up")}
                        disabled={sectionIndex === 0}
                      >
                        Move up
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(sectionIndex, "down")}
                        disabled={sectionIndex === guide.sections.length - 1}
                      >
                        Move down
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => removeSection(sectionIndex)}
                    >
                      Remove section
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={section.title || ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          updateSection(sectionIndex, (prevSection) => ({
                            ...prevSection,
                            title: value,
                            slug: prevSection.slug || slugify(value),
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slug</label>
                      <Input
                        value={section.slug || ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          updateSection(sectionIndex, (prevSection) => ({
                            ...prevSection,
                            slug: slugify(value),
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Summary</label>
                      <Input
                        value={section.summary || ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          updateSection(sectionIndex, (prevSection) => ({
                            ...prevSection,
                            summary: value,
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Blocks</div>
                    <Button size="sm" variant="outline" onClick={() => addBlock(sectionIndex)}>
                      + Add block
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(section.blocks || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No blocks yet.</p>
                    ) : null}

                    {(section.blocks || []).map((block, blockIndex) => (
                      <div key={`block-${sectionIndex}-${blockIndex}`} className="space-y-3 rounded-lg border border-dashed p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Block {blockIndex + 1}
                          </div>
                          <select
                            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                            value={block.type}
                              onChange={(event) => {
                                const value = event.target.value;
                                updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                  ...prevBlock,
                                  type: value,
                                  content:
                                    value === "text"
                                      ? { text: "" }
                                      : value === "bullets"
                                        ? { title: "", items: [] }
                                        : { items: [] },
                                }));
                              }}
                            >
                            {BLOCK_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <div className="ml-auto flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveBlock(sectionIndex, blockIndex, "up")}
                              disabled={blockIndex === 0}
                            >
                              Move up
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveBlock(sectionIndex, blockIndex, "down")}
                              disabled={blockIndex === section.blocks.length - 1}
                            >
                              Move down
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => removeBlock(sectionIndex, blockIndex)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>

                        {block.type === "bullets" ? (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                              value={block.content?.title || ""}
                              onChange={(event) => {
                                const title = event.target.value;
                                updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                  ...prevBlock,
                                  content: {
                                    ...prevBlock.content,
                                    title,
                                  },
                                }));
                              }}
                              placeholder="Optional block title"
                            />
                            <label className="text-sm font-medium">Bullet items</label>
                            <Textarea
                              value={toLineItems(block.content?.items)}
                              onChange={(event) => {
                                const items = parseLineItems(event.target.value);
                                updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                  ...prevBlock,
                                  content: { ...prevBlock.content, items },
                                }));
                              }}
                              rows={4}
                              placeholder="One bullet per line"
                            />
                          </div>
                        ) : null}

                        {block.type === "text" ? (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Text</label>
                            <Textarea
                              value={block.content?.text || ""}
                              onChange={(event) => {
                                const text = event.target.value;
                                updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                  ...prevBlock,
                                  content: { text },
                                }));
                              }}
                              rows={3}
                            />
                          </div>
                        ) : null}

                        {block.type === "callout" ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Variant</label>
                              <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={block.content?.variant || "note"}
                                onChange={(event) => {
                                  const variant = event.target.value;
                                  updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                    ...prevBlock,
                                    content: {
                                      ...prevBlock.content,
                                      variant,
                                    },
                                  }));
                                }}
                              >
                                {CALLOUT_VARIANTS.map((variant) => (
                                  <option key={variant} value={variant}>
                                    {variant}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-sm font-medium">Title</label>
                              <Input
                                value={block.content?.title || ""}
                                onChange={(event) => {
                                  const title = event.target.value;
                                  updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                    ...prevBlock,
                                    content: {
                                      ...prevBlock.content,
                                      title,
                                    },
                                  }));
                                }}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-sm font-medium">Text</label>
                              <Textarea
                                value={block.content?.text || ""}
                                onChange={(event) => {
                                  const text = event.target.value;
                                  updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                    ...prevBlock,
                                    content: {
                                      ...prevBlock.content,
                                      text,
                                    },
                                  }));
                                }}
                                rows={3}
                              />
                            </div>
                          </div>
                        ) : null}

                        {block.type === "links" ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Links</label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const items = Array.isArray(block.content?.items)
                                    ? block.content.items
                                    : [];
                                  updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                    ...prevBlock,
                                    content: {
                                      items: [...items, { label: "", url: "" }],
                                    },
                                  }));
                                }}
                              >
                                + Add link
                              </Button>
                            </div>
                            {(block.content?.items || []).length === 0 ? (
                              <p className="text-sm text-muted-foreground">No links yet.</p>
                            ) : null}
                            {(block.content?.items || []).map((item, itemIndex) => (
                              <div
                                key={`link-${sectionIndex}-${blockIndex}-${itemIndex}`}
                                className="grid gap-2 md:grid-cols-[1fr_1fr_auto]"
                              >
                                <Input
                                  placeholder="Label"
                                  value={item?.label || ""}
                                  onChange={(event) => {
                                    const label = event.target.value;
                                    updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                      ...prevBlock,
                                      content: {
                                        items: updateArray(prevBlock.content?.items || [], itemIndex, (entry) => ({
                                          ...entry,
                                          label,
                                        })),
                                      },
                                    }));
                                  }}
                                />
                                <Input
                                  placeholder="URL"
                                  value={item?.url || ""}
                                  onChange={(event) => {
                                    const url = event.target.value;
                                    updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                      ...prevBlock,
                                      content: {
                                        items: updateArray(prevBlock.content?.items || [], itemIndex, (entry) => ({
                                          ...entry,
                                          url,
                                        })),
                                      },
                                    }));
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                      ...prevBlock,
                                      content: {
                                        items: (prevBlock.content?.items || []).filter((_, idx) => idx !== itemIndex),
                                      },
                                    }));
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        {block.type === "facts" ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Facts</label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const items = Array.isArray(block.content?.items)
                                    ? block.content.items
                                    : [];
                                  updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                    ...prevBlock,
                                    content: {
                                      items: [...items, { key: "", value: "" }],
                                    },
                                  }));
                                }}
                              >
                                + Add fact
                              </Button>
                            </div>
                            {(block.content?.items || []).length === 0 ? (
                              <p className="text-sm text-muted-foreground">No facts yet.</p>
                            ) : null}
                            {(block.content?.items || []).map((item, itemIndex) => (
                              <div
                                key={`fact-${sectionIndex}-${blockIndex}-${itemIndex}`}
                                className="grid gap-2 md:grid-cols-[1fr_1fr_auto]"
                              >
                                <Input
                                  placeholder="Key"
                                  value={item?.key || ""}
                                  onChange={(event) => {
                                    const key = event.target.value;
                                    updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                      ...prevBlock,
                                      content: {
                                        items: updateArray(prevBlock.content?.items || [], itemIndex, (entry) => ({
                                          ...entry,
                                          key,
                                        })),
                                      },
                                    }));
                                  }}
                                />
                                <Input
                                  placeholder="Value"
                                  value={item?.value || ""}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                      ...prevBlock,
                                      content: {
                                        items: updateArray(prevBlock.content?.items || [], itemIndex, (entry) => ({
                                          ...entry,
                                          value,
                                        })),
                                      },
                                    }));
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    updateBlock(sectionIndex, blockIndex, (prevBlock) => ({
                                      ...prevBlock,
                                      content: {
                                        items: (prevBlock.content?.items || []).filter((_, idx) => idx !== itemIndex),
                                      },
                                    }));
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={saveGuide} disabled={saving || loading}>
              {saving ? "Saving..." : "Save guide"}
            </Button>
            <Button
              variant="outline"
              onClick={() => loadGuide(countrySlug)}
              disabled={saving || loading}
            >
              Reset changes
            </Button>
            <span
              className={cn(
                "text-sm",
                loading ? "text-muted-foreground" : "text-muted-foreground"
              )}
            >
              {loading ? "Loading..." : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
