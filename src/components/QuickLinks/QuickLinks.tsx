import "./QuickLinks.css"
import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { WidgetProps } from "../../widgets/registry";

type Link = { id: string; url: string; label: string };

function normalize(raw: string) {
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function QuickLinks({ instanceId }: WidgetProps) {
  const [links, setLinks] = useLocalStorage<Link[]>(`links:${instanceId}`, []);
  const [draft, setDraft] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  function add(event: FormEvent) {
    event.preventDefault();
    const url = normalize(draft.trim());
    if (!url) return;
    const label = url.hostname.replace(/^www\./, "").split(".")[0];
    setLinks((ls) => [...ls, { id: crypto.randomUUID(), url: url.href, label }]);
    setDraft("");
    setIsAdding(false);
  }

  return (
    <div className="quickLinks">
      <div className="qlGrid">
        {links.map((link) => (
          <div key={link.id} className="qlItem">
            <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.url}>
              {/* Favicons come from the site itself; falls back to a letter if missing. */}
              <span className="qlIcon">
                <img
                  src={`${new URL(link.url).origin}/favicon.ico`}
                  alt=""
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <span>{link.label[0]?.toUpperCase()}</span>
              </span>
              <span className="qlLabel">{link.label}</span>
            </a>
            <button className="qlRemove" onClick={() => setLinks((ls) => ls.filter((l) => l.id !== link.id))} aria-label={`Remove ${link.label}`}>
              <X size={10} />
            </button>
          </div>
        ))}
        {!isAdding && (
          <button className="qlItem qlAdd" onClick={() => setIsAdding(true)} aria-label="Add link">
            <span className="qlIcon"><Plus size={18} /></span>
            <span className="qlLabel">Add</span>
          </button>
        )}
      </div>
      {isAdding && (
        <form className="qlForm" onSubmit={add}>
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="example.com" aria-label="URL" />
          <button type="button" onClick={() => setIsAdding(false)}>Cancel</button>
        </form>
      )}
    </div>
  );
}

export default QuickLinks;
