"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from "lucide-react";
import "./TipTapEditor.css";

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function TipTapEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = "300px",
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "tiptap-link",
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="tiptap-editor" style={{ minHeight }}>
      <div className="tiptap-toolbar" role="toolbar" aria-label="Text formatting">
        <div className="tiptap-toolbar__group" role="group" aria-label="Text formatting">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`tiptap-toolbar__btn ${editor.isActive("bold") ? "is-active" : ""}`} aria-label="Bold" aria-pressed={editor.isActive("bold")}><Bold size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`tiptap-toolbar__btn ${editor.isActive("italic") ? "is-active" : ""}`} aria-label="Italic" aria-pressed={editor.isActive("italic")}><Italic size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`tiptap-toolbar__btn ${editor.isActive("strike") ? "is-active" : ""}`} aria-label="Strikethrough" aria-pressed={editor.isActive("strike")}><Strikethrough size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={`tiptap-toolbar__btn ${editor.isActive("code") ? "is-active" : ""}`} aria-label="Inline code" aria-pressed={editor.isActive("code")}><Code size={16} /></button>
        </div>
        <div className="tiptap-toolbar__group" role="group" aria-label="Headings">
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`tiptap-toolbar__btn ${editor.isActive("heading", { level: 1 }) ? "is-active" : ""}`} aria-label="Heading 1" aria-pressed={editor.isActive("heading", { level: 1 })}><Heading1 size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`tiptap-toolbar__btn ${editor.isActive("heading", { level: 2 }) ? "is-active" : ""}`} aria-label="Heading 2" aria-pressed={editor.isActive("heading", { level: 2 })}><Heading2 size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`tiptap-toolbar__btn ${editor.isActive("heading", { level: 3 }) ? "is-active" : ""}`} aria-label="Heading 3" aria-pressed={editor.isActive("heading", { level: 3 })}><Heading3 size={16} /></button>
        </div>
        <div className="tiptap-toolbar__group" role="group" aria-label="Lists">
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`tiptap-toolbar__btn ${editor.isActive("bulletList") ? "is-active" : ""}`} aria-label="Bullet list" aria-pressed={editor.isActive("bulletList")}><List size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`tiptap-toolbar__btn ${editor.isActive("orderedList") ? "is-active" : ""}`} aria-label="Numbered list" aria-pressed={editor.isActive("orderedList")}><ListOrdered size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`tiptap-toolbar__btn ${editor.isActive("blockquote") ? "is-active" : ""}`} aria-label="Blockquote" aria-pressed={editor.isActive("blockquote")}><Quote size={16} /></button>
        </div>
        <div className="tiptap-toolbar__group" role="group" aria-label="Text alignment">
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`tiptap-toolbar__btn ${editor.isActive({ textAlign: "left" }) ? "is-active" : ""}`} aria-label="Align left" aria-pressed={editor.isActive({ textAlign: "left" })}><AlignLeft size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`tiptap-toolbar__btn ${editor.isActive({ textAlign: "center" }) ? "is-active" : ""}`} aria-label="Align center" aria-pressed={editor.isActive({ textAlign: "center" })}><AlignCenter size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`tiptap-toolbar__btn ${editor.isActive({ textAlign: "right" }) ? "is-active" : ""}`} aria-label="Align right" aria-pressed={editor.isActive({ textAlign: "right" })}><AlignRight size={16} /></button>
        </div>
        <div className="tiptap-toolbar__group" role="group" aria-label="Insert content">
          <button type="button" onClick={setLink} className={`tiptap-toolbar__btn ${editor.isActive("link") ? "is-active" : ""}`} aria-label="Insert link" aria-pressed={editor.isActive("link")}><LinkIcon size={16} /></button>
          <button type="button" onClick={addImage} className="tiptap-toolbar__btn" aria-label="Insert image"><ImageIcon size={16} /></button>
        </div>
        <div className="tiptap-toolbar__group" role="group" aria-label="History">
          <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="tiptap-toolbar__btn" aria-label="Undo"><Undo size={16} /></button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="tiptap-toolbar__btn" aria-label="Redo"><Redo size={16} /></button>
        </div>
      </div>
      <div className="tiptap-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
