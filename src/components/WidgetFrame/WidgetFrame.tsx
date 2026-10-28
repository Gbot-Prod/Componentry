import "./WidgetFrame.css"
import type { HTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";

type WidgetFrameProps = {
  title: string;
  onRemove: () => void;
  /** Extra props for the header, e.g. pointer handlers that make it a drag handle. */
  headerProps?: HTMLAttributes<HTMLElement>;
  children: ReactNode;
};

/** The chrome around every widget placed on the canvas. */
function WidgetFrame({ title, onRemove, headerProps, children }: WidgetFrameProps) {
  return (
    <section className="widgetFrame" aria-label={title}>
      <header className="widgetFrameHeader" {...headerProps}>
        <span className="widgetFrameTitle">{title}</span>
        <button className="widgetFrameRemove" onClick={onRemove} aria-label={`Remove ${title}`}>
          <X size={14} />
        </button>
      </header>
      <div className="widgetFrameBody">{children}</div>
    </section>
  );
}

export default WidgetFrame;
