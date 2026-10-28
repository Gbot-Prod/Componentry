import "./Notepad.css"
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Bold, Check, Copy, Download, Heading, Italic, List, ListChecks, Plus, X } from "lucide-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useNow } from "../../hooks/useNow";
import type { WidgetProps } from "../../widgets/registry";

type Page = { id: string; title: string; text: string; updatedAt: number };

const ACCENTS = ["#5865f2", "#23a55a", "#f0b232", "#eb459e", "#00a8fc"];

const newPage = (title: string, text = ""): Page => ({ id: crypto.randomUUID(), title, text, updatedAt: Date.now() });

/** Notes saved before pages existed were a single string under `notepad:<id>`. */
function initialPages(instanceId: string): Page[] {
  let legacy = "";
  try {
    const saved = localStorage.getItem(`notepad:${instanceId}`);
    if (saved) legacy = JSON.parse(saved);
  } catch {
    // Unreadable — start fresh.
  }
  return [newPage("Untitled", typeof legacy === "string" ? legacy : "")];
}

function timeAgo(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Notepad({ instanceId }: WidgetProps) {
  const [pages, setPages] = useLocalStorage<Page[]>(`notepad-pages:${instanceId}`, () => initialPages(instanceId));
  const [activeId, setActiveId] = useLocalStorage(`notepad-active:${instanceId}`, pages[0].id);
  const [accent, setAccent] = useLocalStorage(`notepad-accent:${instanceId}`, ACCENTS[0]);
  const [copied, setCopied] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const now = useNow(10_000);

  // Fall back to the first page if the remembered one was deleted.
  const page = pages.find((p) => p.id === activeId) ?? pages[0];
  const words = page.text.trim() ? page.text.trim().split(/\s+/).length : 0;

  function updatePage(changes: Partial<Page>) {
    setPages((ps) => ps.map((p) => (p.id === page.id ? { ...p, ...changes, updatedAt: Date.now() } : p)));
  }

  function addPage() {
    const fresh = newPage(`Page ${pages.length + 1}`);
    setPages((ps) => [...ps, fresh]);
    setActiveId(fresh.id);
    requestAnimationFrame(() => textRef.current?.focus());
  }

  function deletePage(id: string) {
    const target = pages.find((p) => p.id === id);
    if (target?.text && !confirm(`Delete "${target.title}"?`)) return;
    setPages((ps) => ps.filter((p) => p.id !== id));
  }

  /** Wrap the selection (bold/italic) or prefix the selected lines (headings/lists). */
  function format(kind: "bold" | "italic" | "heading" | "list" | "todo") {
    const el = textRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    let next: string;
    let cursorStart = start;
    let cursorEnd = end;

    if (kind === "bold" || kind === "italic") {
      const mark = kind === "bold" ? "**" : "_";
      next = value.slice(0, start) + mark + value.slice(start, end) + mark + value.slice(end);
      cursorStart += mark.length;
      cursorEnd += mark.length;
    } else {
      const prefix = { heading: "# ", list: "- ", todo: "- [ ] " }[kind];
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const lines = value.slice(lineStart, end).split("\n");
      // Toggle: strip the prefix if every selected line already has it.
      const allHave = lines.every((l) => l.startsWith(prefix));
      const changed = lines.map((l) => (allHave ? l.slice(prefix.length) : prefix + l)).join("\n");
      next = value.slice(0, lineStart) + changed + value.slice(end);
      const delta = changed.length - (end - lineStart);
      cursorStart = Math.max(lineStart, start + (allHave ? -prefix.length : prefix.length));
      cursorEnd = end + delta;
    }

    updatePage({ text: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === "b") { event.preventDefault(); format("bold"); }
      if (event.key === "i") { event.preventDefault(); format("italic"); }
      return;
    }
    // Enter on a list line continues the list; Enter on an empty bullet ends it.
    if (event.key !== "Enter") return;
    const el = event.currentTarget;
    const { selectionStart: pos, value } = el;
    const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
    const line = value.slice(lineStart, pos);
    const match = line.match(/^(- \[[ x]\] |- )/);
    if (!match) return;
    event.preventDefault();
    if (line === match[1]) {
      updatePage({ text: value.slice(0, lineStart) + value.slice(pos) });
      requestAnimationFrame(() => el.setSelectionRange(lineStart, lineStart));
      return;
    }
    const bullet = match[1].replace("[x]", "[ ]");
    updatePage({ text: value.slice(0, pos) + "\n" + bullet + value.slice(pos) });
    const cursor = pos + 1 + bullet.length;
    requestAnimationFrame(() => el.setSelectionRange(cursor, cursor));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(page.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard blocked.
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([page.text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${page.title.trim() || "note"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tools = [
    { kind: "bold", icon: <Bold size={14} />, label: "Bold (Ctrl+B)" },
    { kind: "italic", icon: <Italic size={14} />, label: "Italic (Ctrl+I)" },
    { kind: "heading", icon: <Heading size={14} />, label: "Heading" },
    { kind: "list", icon: <List size={14} />, label: "Bullet list" },
    { kind: "todo", icon: <ListChecks size={14} />, label: "Checklist" },
  ] as const;

  return (
    <div className="notepad" style={{ "--np-accent": accent } as CSSProperties}>
      <div className="npTabs" role="tablist">
        {pages.map((p) => (
          <div key={p.id} className={`npTab${p.id === page.id ? " active" : ""}`}>
            <button role="tab" aria-selected={p.id === page.id} onClick={() => setActiveId(p.id)}>
              {p.title || "Untitled"}
            </button>
            {pages.length > 1 && (
              <button className="npTabClose" onClick={() => deletePage(p.id)} aria-label={`Delete ${p.title}`}>
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        <button className="npTabAdd" onClick={addPage} aria-label="New page" title="New page">
          <Plus size={14} />
        </button>
      </div>

      <div className="npSheet">
        <input
          className="npTitle"
          value={page.title}
          onChange={(e) => updatePage({ title: e.target.value })}
          placeholder="Untitled"
          aria-label="Page title"
        />

        <div className="npToolbar">
          {tools.map(({ kind, icon, label }) => (
            <button key={kind} onClick={() => format(kind)} aria-label={label} title={label}>{icon}</button>
          ))}
          <span className="npDivider" />
          <button onClick={copy} disabled={!page.text} aria-label="Copy page" title="Copy">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button onClick={download} disabled={!page.text} aria-label="Download as .txt" title="Download .txt">
            <Download size={14} />
          </button>
          <div className="npAccents">
            {ACCENTS.map((c) => (
              <button
                key={c}
                className={c === accent ? "active" : ""}
                style={{ backgroundColor: c }}
                onClick={() => setAccent(c)}
                aria-label={`Accent ${c}`}
              />
            ))}
          </div>
        </div>

        <textarea
          ref={textRef}
          className="npText"
          value={page.text}
          onChange={(e) => updatePage({ text: e.target.value })}
          onKeyDown={onKeyDown}
          placeholder="Start writing… (- for lists, - [ ] for checklists)"
          aria-label="Note"
          spellCheck
        />

        <div className="npFooter">
          <span>{words} words · {page.text.length} chars</span>
          <span>Edited {timeAgo(now - page.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

export default Notepad;
