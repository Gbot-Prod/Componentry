import { useState, type DragEvent } from "react";
import { WIDGET_DRAG_TYPE } from "../widgets/registry";

/**
 * Makes an element accept widgets dragged from the sidebar. Spread `dropProps`
 * onto the element; `isOver` is true while a widget is hovering it.
 */
export function useWidgetDrop(onDrop: (type: string, event: DragEvent<HTMLElement>) => void) {
  const [isOver, setIsOver] = useState(false);

  const dropProps = {
    onDragOver: (event: DragEvent<HTMLElement>) => {
      // Ignore other drags (files, text) so they keep their default behaviour.
      if (!event.dataTransfer.types.includes(WIDGET_DRAG_TYPE)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setIsOver(true);
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      // dragleave also fires when moving onto a child element; only reset when truly leaving.
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsOver(false);
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      setIsOver(false);
      const type = event.dataTransfer.getData(WIDGET_DRAG_TYPE);
      if (!type) return;
      event.preventDefault();
      onDrop(type, event);
    },
  };

  return { isOver, dropProps };
}
