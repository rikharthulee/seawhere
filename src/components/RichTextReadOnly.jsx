"use client";
import { useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Underline from "@tiptap/extension-underline";

function flattenNode(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  const out = [];
  const walk = (n) => {
    if (!n) return;
    if (typeof n === "string") { out.push(n); return; }
    if (n.text) out.push(n.text);
    if (Array.isArray(n.content)) n.content.forEach(walk);
  };
  walk(node);
  return out.join("").trim();
}

function toDoc(val) {
  try {
    if (!val) return { type: "doc", content: [] };
    if (typeof val === "string") {
      const parts = val.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
      return {
        type: "doc",
        content: parts.map((t) => ({ type: "paragraph", content: t ? [{ type: "text", text: t }] : [] })),
      };
    }
    if (Array.isArray(val)) {
      const parts = val.map((v) => (typeof v === "string" ? v : flattenNode(v))).filter(Boolean);
      return {
        type: "doc",
        content: parts.map((t) => ({ type: "paragraph", content: t ? [{ type: "text", text: t }] : [] })),
      };
    }
    if (typeof val === "object") {
      if (val.type === "doc") return val;
      if (val.type === "paragraph") {
        return { type: "doc", content: [val] };
      }
    }
  } catch {}
  return { type: "doc", content: [] };
}

export default function RichTextReadOnly({ value, className = "" }) {
  const normalized = useMemo(() => toDoc(value), [value]);
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: true }),
      BulletList,
      OrderedList,
      ListItem,
      Underline,
    ],
    editorProps: {
      attributes: { class: "outline-none" },
    },
    content: normalized,
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(normalized);
  }, [editor, normalized]);

  // Always render; normalized empty doc will show nothing but keeps layout stable

  return (
    <div className={className}>
      <div className="tiptap-ro">
        <EditorContent editor={editor} />
      </div>
      <style jsx>{`
        .tiptap-ro { display: block; width: 100%; }
        .tiptap-ro :global(.ProseMirror) { line-height: 1.75; width: 100%; max-width: 100%; }
        .tiptap-ro :global(h2) {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }
        .tiptap-ro :global(h3) {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.75rem 0 0.25rem 0;
        }
        .tiptap-ro :global(ul),
        .tiptap-ro :global(ol) {
          padding-left: 1.25rem;
          margin: 0.5rem 0;
          list-style-position: outside;
        }
        .tiptap-ro :global(ul) {
          list-style-type: disc !important;
        }
        .tiptap-ro :global(ol) {
          list-style-type: decimal !important;
        }
        .tiptap-ro :global(li) { margin: 0.25rem 0; display: list-item; }
        .tiptap-ro :global(p) {
          margin: 0.75rem 0;
        }
      `}</style>
    </div>
  );
}
