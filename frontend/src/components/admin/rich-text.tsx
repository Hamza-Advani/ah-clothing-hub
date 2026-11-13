"use client";
import { useEffect, useRef } from "react";
import { Bold, Heading3, Italic, Link2, List, ListOrdered, RemoveFormatting, Underline } from "lucide-react";
import { cn } from "@/lib/utils";

/** Strips scripts, event handlers and unsafe URLs from editor HTML. */
export function sanitizeHtml(html: string) {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const allowed = new Set(["P", "BR", "B", "STRONG", "I", "EM", "U", "UL", "OL", "LI", "H3", "H4", "A", "DIV", "SPAN"]);
  const walk = (el: Element) => {
    for (const child of [...el.children]) {
      if (!allowed.has(child.tagName)) {
        if (["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes(child.tagName)) child.remove();
        else child.replaceWith(...child.childNodes);
        continue;
      }
      for (const a of [...child.attributes]) {
        const keep = child.tagName === "A" && a.name === "href" && /^(https?:|mailto:|\/)/i.test(a.value);
        if (!keep) child.removeAttribute(a.name);
      }
      walk(child);
    }
  };
  const root = doc.body.firstElementChild!;
  walk(root);
  return root.innerHTML.replace(/<div>/g, "<p>").replace(/<\/div>/g, "</p>").trim();
}

const TOOLS = [
  { cmd: "bold", icon: Bold, label: "Bold" },
  { cmd: "italic", icon: Italic, label: "Italic" },
  { cmd: "underline", icon: Underline, label: "Underline" },
  { cmd: "formatBlock", arg: "h3", icon: Heading3, label: "Heading" },
  { cmd: "insertUnorderedList", icon: List, label: "Bullet list" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
  { cmd: "createLink", icon: Link2, label: "Link" },
  { cmd: "removeFormat", icon: RemoveFormatting, label: "Clear formatting" },
] as const;

export function RichText({ value, onChange, placeholder = "Write a description…", className, minHeight = 180 }: { value: string; onChange: (html: string) => void; placeholder?: string; className?: string; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<string>("");

  // sync external value → editor (only when it differs from what we last emitted)
  useEffect(() => {
    if (ref.current && value !== last.current) {
      ref.current.innerHTML = value || "";
      last.current = value;
    }
  }, [value]);

  const emit = () => {
    if (!ref.current) return;
    const html = sanitizeHtml(ref.current.innerHTML);
    last.current = html;
    onChange(html === "<br>" ? "" : html);
  };

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    if (cmd === "createLink") {
      const url = window.prompt("Link URL (https://…)");
      if (!url) return;
      document.execCommand(cmd, false, url);
    } else if (cmd === "formatBlock") {
      document.execCommand(cmd, false, arg);
    } else document.execCommand(cmd);
    emit();
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25", className)}>
      <div className="flex flex-wrap gap-0.5 border-b border-border bg-muted/50 p-1">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            aria-label={t.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(t.cmd, "arg" in t ? t.arg : undefined)}
            className="grid size-8 place-items-center rounded-md text-foreground/75 transition hover:bg-surface hover:text-foreground"
          >
            <t.icon className="size-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        aria-label={placeholder}
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        style={{ minHeight }}
        className="max-h-[480px] overflow-y-auto px-3.5 py-3 text-sm leading-relaxed outline-none empty:before:text-muted-foreground/70 empty:before:content-[attr(data-placeholder)] [&_a]:text-accent [&_a]:underline [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}
