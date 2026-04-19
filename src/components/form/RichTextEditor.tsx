import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";

interface Props {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  placeholder?: string;
}

const BTN = "p-1.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-30 text-gray-600";
const ACTIVE_BTN = "p-1.5 rounded bg-gray-200 text-gray-900";

function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={active ? ACTIVE_BTN : BTN}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, minHeight = 220, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "outline-none",
        style: `min-height:${minHeight}px; padding: 12px 14px; font-size: 14px; line-height: 1.7; color: #1f2937;`,
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value changes (e.g. when product loads from API)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value && value !== undefined) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Enter URL:", prev);
    if (url === null) return;
    if (!url) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#2382AA] focus-within:border-transparent">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">

        {/* Paragraph / Headings */}
        <select
          className="text-xs border border-gray-200 rounded px-1.5 py-1 mr-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#2382AA] text-gray-700"
          value={
            editor.isActive("heading", { level: 1 }) ? "h1"
              : editor.isActive("heading", { level: 2 }) ? "h2"
              : editor.isActive("heading", { level: 3 }) ? "h3"
              : "p"
          }
          onChange={e => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().setHeading({ level: Number(v.slice(1)) as 1|2|3 }).run();
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Bold / Italic / Underline / Strike */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 010 8H6V4zm0 8h9a4 4 0 010 8H6v-8z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4h4l-4 16H6l4-16zm4 0h4v2h-1.5l-4 12H14v2h-4l4-16z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h2v9a4 4 0 008 0V3h2v9a6 6 0 01-12 0V3zM4 20h16v2H4v-2z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 4c2.21 0 4 1.79 4 4h-2c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2s.9 2 2 2h6c2.21 0 4 1.79 4 4s-1.79 4-4 4h-4c-2.21 0-4-1.79-4-4h2c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2s-.9-2-2-2H9C6.79 12 5 10.21 5 8s1.79-4 4-4h4zM3 11h18v2H3v-2z"/></svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Align */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm3 4h12v2H6V7zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/></svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Link */}
        <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Insert link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Undo / Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Clear formatting */}
        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 14-1.4 1.4-3-3L12 20h-2l2.8-4.2-7.4-7.4L4 10V8l2-4zm2.1.4L20 16.3V4H8.1z"/></svg>
        </ToolbarButton>
      </div>

      {/* ── Editor area ── */}
      <div
        className="relative bg-white overflow-y-auto"
        style={{ maxHeight: 500 }}
        onClick={() => editor.commands.focus()}
      >
        {!editor.getText() && placeholder && (
          <p className="absolute top-3 left-3.5 text-sm text-gray-400 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* Internal styles for editor content */}
      <style>{`
        .ProseMirror p            { margin-bottom: 0.6em; }
        .ProseMirror p:last-child  { margin-bottom: 0; }
        .ProseMirror h1           { font-size: 1.4rem; font-weight: 700; margin: 0.8em 0 0.3em; color:#111; }
        .ProseMirror h2           { font-size: 1.2rem; font-weight: 700; margin: 0.8em 0 0.3em; color:#111; }
        .ProseMirror h3           { font-size: 1rem;   font-weight: 700; margin: 0.8em 0 0.3em; color:#111; }
        .ProseMirror ul           { list-style: disc;    padding-left: 1.4em; margin-bottom: 0.6em; }
        .ProseMirror ol           { list-style: decimal; padding-left: 1.4em; margin-bottom: 0.6em; }
        .ProseMirror li           { margin-bottom: 0.2em; }
        .ProseMirror blockquote   { border-left: 3px solid #2382AA; padding-left: 1em; color:#6b7280; margin: 0.6em 0; }
        .ProseMirror code         { background:#f3f4f6; padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.85em; font-family: monospace; }
        .ProseMirror a            { color: #2382AA; text-decoration: underline; }
        .ProseMirror strong       { font-weight: 700; }
        .ProseMirror em           { font-style: italic; }
        .ProseMirror s            { text-decoration: line-through; }
        .ProseMirror hr           { border: none; border-top: 1px solid #e5e7eb; margin: 1em 0; }
        .ProseMirror table        { width:100%; border-collapse:collapse; margin-bottom:0.6em; }
        .ProseMirror td, .ProseMirror th { border:1px solid #e5e7eb; padding:0.35em 0.6em; text-align:left; font-size:0.875em; }
        .ProseMirror th           { background:#f9fafb; font-weight:600; }
      `}</style>
    </div>
  );
}
