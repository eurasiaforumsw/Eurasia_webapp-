"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Type,
  Palette,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

type FontFamily = "Inter" | "Georgia" | "Courier New" | "Arial" | "Times New Roman";
type FontSize = "12px" | "14px" | "16px" | "18px" | "20px" | "24px" | "32px" | "48px";

const FONT_FAMILIES: FontFamily[] = ["Inter", "Georgia", "Courier New", "Arial", "Times New Roman"];
const FONT_SIZES: FontSize[] = ["12px", "14px", "16px", "18px", "20px", "24px", "32px", "48px"];
const TEXT_COLORS = ["#000000", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#2563eb", "#7c3aed", "#db2777"];
const BG_COLORS = ["transparent", "#fef2f2", "#fff7ed", "#fefce8", "#f0fdf4", "#eff6ff", "#f5f3ff", "#fdf2f8"];

export function RichTextEditor({ value, onChange, placeholder, minHeight = "300px" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFont, setSelectedFont] = useState<FontFamily>("Inter");
  const [selectedSize, setSelectedSize] = useState<FontSize>("16px");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + B for Bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      execCommand('bold');
    }
    // Ctrl/Cmd + I for Italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      execCommand('italic');
    }
    // Ctrl/Cmd + U for Underline
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      execCommand('underline');
    }
    // Ctrl/Cmd + Z for Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      execCommand('undo');
    }
    // Ctrl/Cmd + Shift + Z for Redo
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
      e.preventDefault();
      execCommand('redo');
    }
  }, [execCommand]);

  const insertLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl);
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const insertImage = () => {
    if (imageUrl) {
      execCommand('insertImage', imageUrl);
      setImageUrl("");
      setShowImageInput(false);
    }
  };

  const applyFontFamily = (font: FontFamily) => {
    setSelectedFont(font);
    execCommand('fontName', font);
  };

  const applyFontSize = (size: FontSize) => {
    setSelectedSize(size);
    // Convert px to HTML size (1-7)
    const sizeMap: Record<FontSize, string> = {
      "12px": "1",
      "14px": "2",
      "16px": "3",
      "18px": "4",
      "20px": "5",
      "24px": "6",
      "32px": "7",
      "48px": "7"
    };
    execCommand('fontSize', sizeMap[size]);

    // Apply exact size via style
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.fontSize = size;
        try {
          range.surroundContents(span);
        } catch (e) {
          console.warn('Could not apply font size:', e);
        }
      }
    }
  };

  const applyTextColor = (color: string) => {
    execCommand('foreColor', color);
    setShowColorPicker(false);
  };

  const applyBgColor = (color: string) => {
    execCommand('backColor', color);
    setShowBgColorPicker(false);
  };

  return (
    <div className="rich-text-editor">
      {/* Toolbar */}
      <div className="rich-text-toolbar">
        {/* Text Formatting */}
        <div className="rich-text-toolbar__group">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="rich-text-toolbar__btn"
            title="Bold (Ctrl+B)"
          >
            <Bold size={18} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="rich-text-toolbar__btn"
            title="Italic (Ctrl+I)"
          >
            <Italic size={18} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="rich-text-toolbar__btn"
            title="Underline (Ctrl+U)"
          >
            <Underline size={18} />
          </button>
        </div>

        {/* Font & Size */}
        <div className="rich-text-toolbar__group">
          <select
            value={selectedFont}
            onChange={(e) => applyFontFamily(e.target.value as FontFamily)}
            className="rich-text-toolbar__select"
            title="Font Family"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
          <select
            value={selectedSize}
            onChange={(e) => applyFontSize(e.target.value as FontSize)}
            className="rich-text-toolbar__select"
            title="Font Size"
          >
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Colors */}
        <div className="rich-text-toolbar__group">
          <div className="rich-text-toolbar__color-picker">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="rich-text-toolbar__btn"
              title="Text Color"
            >
              <Type size={18} />
            </button>
            {showColorPicker && (
              <div className="rich-text-color-palette">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => applyTextColor(color)}
                    className="rich-text-color-swatch"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="rich-text-toolbar__color-picker">
            <button
              type="button"
              onClick={() => setShowBgColorPicker(!showBgColorPicker)}
              className="rich-text-toolbar__btn"
              title="Background Color"
            >
              <Palette size={18} />
            </button>
            {showBgColorPicker && (
              <div className="rich-text-color-palette">
                {BG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => applyBgColor(color)}
                    className="rich-text-color-swatch"
                    style={{ backgroundColor: color, border: color === 'transparent' ? '1px solid #ccc' : undefined }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Headings */}
        <div className="rich-text-toolbar__group">
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h1>')}
            className="rich-text-toolbar__btn"
            title="Heading 1"
          >
            <Heading1 size={18} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h2>')}
            className="rich-text-toolbar__btn"
            title="Heading 2"
          >
            <Heading2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h3>')}
            className="rich-text-toolbar__btn"
            title="Heading 3"
          >
            <Heading3 size={18} />
          </button>
        </div>

        {/* Alignment */}
        <div className="rich-text-toolbar__group">
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            className="rich-text-toolbar__btn"
            title="Align Left"
          >
            <AlignLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            className="rich-text-toolbar__btn"
            title="Align Center"
          >
            <AlignCenter size={18} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyRight')}
            className="rich-text-toolbar__btn"
            title="Align Right"
          >
            <AlignRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyFull')}
            className="rich-text-toolbar__btn"
            title="Justify"
          >
            <AlignJustify size={18} />
          </button>
        </div>

        {/* Lists */}
        <div className="rich-text-toolbar__group">
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="rich-text-toolbar__btn"
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className="rich-text-toolbar__btn"
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </button>
        </div>

        {/* Insert */}
        <div className="rich-text-toolbar__group">
          <button
            type="button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="rich-text-toolbar__btn"
            title="Insert Link"
          >
            <Link size={18} />
          </button>
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className="rich-text-toolbar__btn"
            title="Insert Image"
          >
            <Image size={18} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<blockquote>')}
            className="rich-text-toolbar__btn"
            title="Quote"
          >
            <Quote size={18} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<pre>')}
            className="rich-text-toolbar__btn"
            title="Code Block"
          >
            <Code size={18} />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="rich-text-toolbar__group">
          <button
            type="button"
            onClick={() => execCommand('undo')}
            className="rich-text-toolbar__btn"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={18} />
          </button>
          <button
            type="button"
            onClick={() => execCommand('redo')}
            className="rich-text-toolbar__btn"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo size={18} />
          </button>
        </div>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="rich-text-input-row">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="rich-text-input"
            onKeyDown={(e) => e.key === 'Enter' && insertLink()}
          />
          <button type="button" onClick={insertLink} className="rich-text-btn">
            Insert
          </button>
          <button type="button" onClick={() => setShowLinkInput(false)} className="rich-text-btn">
            Cancel
          </button>
        </div>
      )}

      {/* Image Input */}
      {showImageInput && (
        <div className="rich-text-input-row">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="rich-text-input"
            onKeyDown={(e) => e.key === 'Enter' && insertImage()}
          />
          <button type="button" onClick={insertImage} className="rich-text-btn">
            Insert
          </button>
          <button type="button" onClick={() => setShowImageInput(false)} className="rich-text-btn">
            Cancel
          </button>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="rich-text-content"
        style={{ minHeight }}
        suppressContentEditableWarning
        data-placeholder={placeholder}
      />
    </div>
  );
}
