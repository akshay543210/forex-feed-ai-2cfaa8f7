import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Code2,
  Heading1, Heading2, Heading3, Heading4, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Minus, Loader2, Unlink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  value: string;
  onChange: (html: string) => void;
  userId: string;
  placeholder?: string;
};

export function RichEditor({ value, onChange, userId, placeholder }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: "rounded-md bg-muted p-3 text-sm font-mono overflow-x-auto" } },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", class: "text-primary underline" } }),
      Image.configure({ inline: false, allowBase64: false, HTMLAttributes: { class: "rounded-xl my-4 max-w-full h-auto" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "Start writing your article…" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-lg max-w-none min-h-[600px] focus:outline-none px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value (e.g. when loading existing blog)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      const caption = window.prompt("Image caption (optional)") || "";
      const alt = window.prompt("Alt text (for SEO/accessibility)", caption) || caption;
      if (caption) {
        editor.chain().focus().insertContent(
          `<figure><img src="${data.publicUrl}" alt="${escapeHtml(alt)}" loading="lazy" /><figcaption>${escapeHtml(caption)}</figcaption></figure><p></p>`
        ).run();
      } else {
        editor.chain().focus().setImage({ src: data.publicUrl, alt }).run();
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const resizeImage = () => {
    const w = window.prompt("Image width (e.g. 50%, 400px, or 'auto')", "75%");
    if (!w) return;
    // Find selected image and set width attribute via DOM
    const { state, view } = editor;
    const { from } = state.selection;
    const node = state.doc.nodeAt(from);
    if (node?.type.name === "image") {
      editor.chain().focus().updateAttributes("image", { style: `width:${w};height:auto;` } as never).run();
    } else {
      // try selected node
      const dom = view.dom.querySelector("img.ProseMirror-selectednode") as HTMLImageElement | null;
      if (dom) {
        dom.style.width = w;
        dom.style.height = "auto";
        onChange(view.dom.innerHTML);
      } else {
        alert("Click an image first to resize it.");
      }
    }
  };

  const addLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (include https://)", prev || "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="rounded-md border border-border bg-background">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-background/95 backdrop-blur p-1.5 rounded-t-md">
        <Group>
          <Btn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 className="h-4 w-4" /></Btn>
          <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 className="h-4 w-4" /></Btn>
          <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 className="h-4 w-4" /></Btn>
          <Btn active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} title="Heading 4"><Heading4 className="h-4 w-4" /></Btn>
        </Group>
        <Sep />
        <Group>
          <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)"><Bold className="h-4 w-4" /></Btn>
          <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)"><Italic className="h-4 w-4" /></Btn>
          <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)"><UnderlineIcon className="h-4 w-4" /></Btn>
        </Group>
        <Sep />
        <Group>
          <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list"><List className="h-4 w-4" /></Btn>
          <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered className="h-4 w-4" /></Btn>
          <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote className="h-4 w-4" /></Btn>
          <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block"><Code2 className="h-4 w-4" /></Btn>
        </Group>
        <Sep />
        <Group>
          <Btn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left"><AlignLeft className="h-4 w-4" /></Btn>
          <Btn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center"><AlignCenter className="h-4 w-4" /></Btn>
          <Btn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right"><AlignRight className="h-4 w-4" /></Btn>
        </Group>
        <Sep />
        <Group>
          <Btn active={editor.isActive("link")} onClick={addLink} title="Insert / edit link"><LinkIcon className="h-4 w-4" /></Btn>
          {editor.isActive("link") && (
            <Btn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link"><Unlink className="h-4 w-4" /></Btn>
          )}
          <Btn onClick={() => fileRef.current?.click()} title="Upload image" disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          </Btn>
          <Btn onClick={resizeImage} title="Resize selected image" disabled={!editor.isActive("image")}>
            <span className="text-[10px] font-mono px-0.5">↔</span>
          </Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus className="h-4 w-4" /></Btn>
        </Group>
        <Sep />
        <Group>
          <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)" disabled={!editor.can().undo()}><Undo2 className="h-4 w-4" /></Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)" disabled={!editor.can().redo()}><Redo2 className="h-4 w-4" /></Btn>
        </Group>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
      </div>
      <EditorContent
        editor={editor}
        className="
          [&_.ProseMirror]:min-h-[600px] [&_.ProseMirror]:outline-none
          [&_.ProseMirror_h1]:font-display [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:text-4xl [&_.ProseMirror_h1]:mt-6 [&_.ProseMirror_h1]:mb-3
          [&_.ProseMirror_h2]:font-display [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-3xl [&_.ProseMirror_h2]:mt-8 [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:border-b [&_.ProseMirror_h2]:border-border [&_.ProseMirror_h2]:pb-1
          [&_.ProseMirror_h3]:font-display [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:mt-6 [&_.ProseMirror_h3]:mb-2
          [&_.ProseMirror_h4]:font-display [&_.ProseMirror_h4]:font-semibold [&_.ProseMirror_h4]:text-lg [&_.ProseMirror_h4]:mt-5 [&_.ProseMirror_h4]:mb-2
          [&_.ProseMirror_p]:my-3 [&_.ProseMirror_p]:leading-relaxed
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6
          [&_.ProseMirror_li]:my-1 [&_.ProseMirror_li_p]:my-0
          [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-primary [&_.ProseMirror_blockquote]:bg-muted/40 [&_.ProseMirror_blockquote]:px-4 [&_.ProseMirror_blockquote]:py-2 [&_.ProseMirror_blockquote]:rounded-r-md [&_.ProseMirror_blockquote]:my-4
          [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline
          [&_.ProseMirror_img]:rounded-xl [&_.ProseMirror_img]:my-3 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto
          [&_.ProseMirror_figure]:my-4 [&_.ProseMirror_figcaption]:text-center [&_.ProseMirror_figcaption]:text-sm [&_.ProseMirror_figcaption]:text-muted-foreground [&_.ProseMirror_figcaption]:mt-2
          [&_.ProseMirror_hr]:border-border [&_.ProseMirror_hr]:my-6
          [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-primary
          [&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:overflow-x-auto
          [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:text-foreground [&_.ProseMirror_pre_code]:p-0
          [&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child]:before:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left [&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0
        "
      />
    </div>
  );
}

function Btn({ children, onClick, active, title, disabled }: { children: React.ReactNode; onClick: () => void; active?: boolean; title: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`h-8 min-w-8 px-1.5 inline-flex items-center justify-center rounded text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
    >
      {children}
    </button>
  );
}
function Group({ children }: { children: React.ReactNode }) { return <div className="inline-flex items-center gap-0.5">{children}</div>; }
function Sep() { return <div className="w-px h-5 bg-border mx-1" />; }
function escapeHtml(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

// Keep unused import warning silent
export type { Editor };
