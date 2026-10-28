import "./JsonFormatter.css"
import { useState } from "react";

function JsonFormatter() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function transform(indent: number | null) {
    try {
      const parsed = JSON.parse(text);
      setText(indent === null ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // Validate as you type, but only show the result; don't rewrite the text.
  function onChange(value: string) {
    setText(value);
    if (!value.trim()) return setError(null);
    try {
      JSON.parse(value);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="jsonFormatter">
      <textarea
        className={error ? "invalid" : ""}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder='{"paste": "json here"}'
        spellCheck={false}
        aria-label="JSON"
      />
      <div className={`jfStatus${error ? " error" : text.trim() ? " ok" : ""}`}>
        {error ?? (text.trim() ? "Valid JSON" : "Waiting for input")}
      </div>
      <div className="jfButtons">
        <button onClick={() => transform(2)} disabled={!text}>Pretty</button>
        <button onClick={() => transform(null)} disabled={!text}>Minify</button>
        <button onClick={() => navigator.clipboard.writeText(text).catch(() => {})} disabled={!text}>Copy</button>
        <button onClick={() => onChange("")} disabled={!text}>Clear</button>
      </div>
    </div>
  );
}

export default JsonFormatter;
