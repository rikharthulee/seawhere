"use client";
import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Underline from "@tiptap/extension-underline";

function isEmptyDocJSON(json) {
  try {
    if (!json) return true;
    if (json.type !== "doc") return false;
    const content = Array.isArray(json.content) ? json.content : [];
    if (content.length === 0) return true;
    // Consider empty if only empty paragraphs
    return content.every((n) => n?.type === "paragraph" && (!n.content || n.content.length === 0));
  } catch {
    return false;
  }
}

export default function RichTextEditor({ value, onChange, label = "Details", warnOnUnsaved = false }) {
  const initialJSONRef = useRef(JSON.stringify(value || { type: "doc", content: [] }));
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      BulletList,
      OrderedList,
      ListItem,
      Underline,
    ],
    editorProps: {
      attributes: {},
      transformPastedText(text) {
        // Treat single newlines as paragraph breaks so list toggles apply line-by-line
        return String(text || "").replace(/\r?\n/g, "\n\n");
      },
    },
    content: value || undefined,
    onUpdate({ editor }) {
      const json = editor.getJSON();
      const text = editor.getText().trim();
      onChange?.(text === "" || isEmptyDocJSON(json) ? null : json);
    },
  });

  // Keep editor in sync with external value without clobbering selection.
  useEffect(() => {
    if (!editor) return;
    const next = value || { type: "doc", content: [] };
    let current;
    try {
      current = editor.getJSON();
    } catch {
      current = null;
    }
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      editor.commands.setContent(next);
    }
  }, [editor, value]);

  // Update the baseline when external value changes (e.g. record load)
  useEffect(() => {
    initialJSONRef.current = JSON.stringify(value || { type: "doc", content: [] });
  }, [value]);

  // Optional unsaved-changes warning on refresh/close
  useEffect(() => {
    if (!warnOnUnsaved || !editor) return;
    const handler = (e) => {
      try {
        const cur = JSON.stringify(editor.getJSON());
        if (cur !== initialJSONRef.current) {
          e.preventDefault();
          e.returnValue = "";
        }
      } catch {}
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [warnOnUnsaved, editor]);

  const can = {
    bold: !!editor?.can().chain().focus().toggleBold().run(),
    italic: !!editor?.can().chain().focus().toggleItalic().run(),
    underline: !!editor?.can().chain().focus().toggleUnderline().run(),
    h2: !!editor?.can().chain().focus().toggleHeading({ level: 2 }).run(),
    h3: !!editor?.can().chain().focus().toggleHeading({ level: 3 }).run(),
    bullet: !!editor?.can().chain().focus().toggleBulletList().run(),
    ordered: !!editor?.can().chain().focus().toggleOrderedList().run(),
    clear: !!editor,
  };

  return (
    <div>
      <label>{label}</label>
      <div className="rte-wrap">
        {/* Toolbar */}
        <div className="rte-toolbar">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }}
            disabled={!can.bold}
            className={editor?.isActive('bold') ? 'on' : ''}
            title="Bold"
          >B</button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }}
            disabled={!can.italic}
            className={editor?.isActive('italic') ? 'on' : ''}
            title="Italic"
          ><i>I</i></button>
          <span className="sep" />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleUnderline().run(); }}
            disabled={!can.underline}
            className={editor?.isActive('underline') ? 'on' : ''}
            title="Underline"
          ><u>U</u></button>
          <span className="sep" />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 2 }).run(); }}
            disabled={!can.h2}
            className={editor?.isActive('heading', { level: 2 }) ? 'on' : ''}
            title="Heading 2"
          >H2</button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 3 }).run(); }}
            disabled={!can.h3}
            className={editor?.isActive('heading', { level: 3 }) ? 'on' : ''}
            title="Heading 3"
          >H3</button>
          <span className="sep" />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }}
            disabled={!can.bullet}
            className={editor?.isActive('bulletList') ? 'on' : ''}
            title="Bulleted list"
          >• List</button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run(); }}
            disabled={!can.ordered}
            className={editor?.isActive('orderedList') ? 'on' : ''}
            title="Numbered list"
          >1. List</button>
          <span className="sep" />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().clearNodes().unsetAllMarks().run(); }}
            disabled={!can.clear}
            title="Clear formatting"
          >Clear</button>
        </div>
        {/* Editor */}
        <div className="rte-editor">
          <EditorContent editor={editor} />
        </div>
      </div>
      <style jsx>{`
        label { display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.25rem; }
        .rte-wrap { border: 1px solid #e5e7eb; border-radius: 8px; }
        .rte-toolbar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; }
        .rte-toolbar button { padding: 4px 8px; border: 1px solid #e5e7eb; border-radius: 6px; background: white; cursor: pointer; }
        .rte-toolbar button.on { background: #111827; color: white; }
        .rte-toolbar button:disabled { opacity: 0.5; cursor: not-allowed; }
        .rte-toolbar .sep { width: 1px; height: 20px; background: #e5e7eb; margin: 0 4px; }
        .rte-editor { padding: 10px; }
        /* ProseMirror content styling */
        .rte-editor :global(.ProseMirror) { outline: none; min-height: 10rem; line-height: 1.65; width: 100%; max-width: 100%; }
        .rte-editor :global(h2) { font-size: 1.375rem; font-weight: 600; margin: 1rem 0 0.5rem 0; }
        .rte-editor :global(h3) { font-size: 1.125rem; font-weight: 600; margin: 0.75rem 0 0.25rem 0; }
        .rte-editor :global(ul), .rte-editor :global(ol) { padding-left: 1.25rem; margin: 0.5rem 0; list-style-position: outside; }
        .rte-editor :global(ul) { list-style-type: disc !important; }
        .rte-editor :global(ol) { list-style-type: decimal !important; }
        .rte-editor :global(li) { margin: 0.25rem 0; display: list-item; }
        .rte-editor :global(p) { margin: 0.5rem 0; }
      `}</style>
    </div>
  );
}
