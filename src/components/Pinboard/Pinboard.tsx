import "./Pinboard.css"
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import WidgetFrame from "../WidgetFrame/WidgetFrame";
import { useWidgetDrop } from "../../hooks/useWidgetDrop";
import { getWidget, type PlacedWidget } from "../../widgets/registry";

type Position = { x: number; y: number };

const PIN_WIDTH = 340;
const SLOT_GAP = 24;
const SLOT_HEIGHT = 340;
const SLOTS_PER_ROW = 3;
/** Room left below the lowest pin so there's always space to drop more. */
const BOARD_PADDING_BOTTOM = 480;
/** Top-left of the default slots, clear of where the sidebar starts out. */
const SLOT_ORIGIN: Position = { x: 120, y: 24 };

/**
 * Where a widget with no saved position sits (e.g. one added in grid mode or by
 * clicking the sidebar) — a loose grid so new pins don't land on top of each other.
 */
function defaultPosition(index: number): Position {
  return {
    x: SLOT_ORIGIN.x + (index % SLOTS_PER_ROW) * (PIN_WIDTH + SLOT_GAP),
    y: SLOT_ORIGIN.y + Math.floor(index / SLOTS_PER_ROW) * SLOT_HEIGHT,
  };
}

type DragState = {
  id: string;
  pointerX: number;
  pointerY: number;
  originX: number;
  originY: number;
} & Position;

type PinboardProps = {
  widgets: PlacedWidget[];
  onAdd: (type: string, position: Position) => void;
  onMove: (id: string, position: Position) => void;
  onRaise: (id: string) => void;
  onRemove: (id: string) => void;
};

/** Free-form layout: widgets are pinned wherever they're dropped and can be dragged around. */
function Pinboard({ widgets, onAdd, onMove, onRaise, onRemove }: PinboardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  // Keep pins inside the board horizontally and below its top edge.
  const clamp = ({ x, y }: Position): Position => {
    const maxX = Math.max(0, (boardRef.current?.clientWidth ?? Infinity) - PIN_WIDTH);
    return { x: Math.round(Math.min(maxX, Math.max(0, x))), y: Math.round(Math.max(0, y)) };
  };

  const { isOver, dropProps } = useWidgetDrop((type, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // Put the cursor roughly on the new widget's header, where it was "held".
    onAdd(type, clamp({ x: event.clientX - rect.left - PIN_WIDTH / 2, y: event.clientY - rect.top - 16 }));
  });

  const positions = widgets.map((widget, index) =>
    drag?.id === widget.id
      ? { x: drag.x, y: drag.y }
      : widget.x !== undefined && widget.y !== undefined
        ? { x: widget.x, y: widget.y }
        : defaultPosition(index),
  );
  const boardHeight = Math.max(0, ...positions.map(({ y }) => y + BOARD_PADDING_BOTTOM));

  const startDrag = (id: string, position: Position) => (event: ReactPointerEvent<HTMLElement>) => {
    // Let the header's buttons (e.g. remove) handle their own clicks.
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onRaise(id);
    setDrag({
      id,
      pointerX: event.clientX,
      pointerY: event.clientY,
      originX: position.x,
      originY: position.y,
      ...position,
    });
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag) return;
    setDrag({
      ...drag,
      ...clamp({
        x: drag.originX + event.clientX - drag.pointerX,
        y: drag.originY + event.clientY - drag.pointerY,
      }),
    });
  };

  // Only save on release so we aren't writing to localStorage on every pointer move.
  const endDrag = () => {
    if (!drag) return;
    onMove(drag.id, { x: drag.x, y: drag.y });
    setDrag(null);
  };

  return (
    <div
      ref={boardRef}
      className={`pinboard${isOver ? " pinboardDropTarget" : ""}`}
      style={{ minHeight: `max(100vh, ${boardHeight}px)` }}
      {...dropProps}
    >
      {widgets.length === 0 && (
        <div className="pinboardEmpty">
          <p className="pinboardEmptyTitle">An empty corkboard.</p>
          <p>Drag a component from the sidebar and pin it anywhere.</p>
        </div>
      )}

      {widgets.map(({ id, type, z }, index) => {
        const widget = getWidget(type);
        // A saved layout may reference a widget that has since been removed.
        if (!widget) return null;
        const Widget = widget.component;
        const position = positions[index];
        const isDragging = drag?.id === id;
        return (
          <div
            key={id}
            className={`pin${isDragging ? " pinDragging" : ""}`}
            style={{ left: position.x, top: position.y, width: PIN_WIDTH, zIndex: z ?? 0 }}
          >
            <WidgetFrame
              title={widget.name}
              onRemove={() => onRemove(id)}
              headerProps={{
                onPointerDown: startDrag(id, position),
                onPointerMove: moveDrag,
                onPointerUp: endDrag,
                onPointerCancel: endDrag,
              }}
            >
              <Widget instanceId={id} />
            </WidgetFrame>
          </div>
        );
      })}
    </div>
  );
}

export default Pinboard;
