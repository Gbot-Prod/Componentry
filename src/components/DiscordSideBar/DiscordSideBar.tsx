import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type {
  DragEvent as ReactDragEvent,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
  ReactNode,
} from 'react'
import { ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { WIDGET_DRAG_TYPE } from '../../widgets/registry'

type SideBarItem = {
  id: string
  name: string
  icon: ReactElement
  /** A live, non-interactive render of the item, shown instead of the icon in preview mode. */
  preview?: ReactNode
  /** Consecutive items with the same group are shown together, with a divider between groups. */
  group?: string
}

export type SideBarDisplay = 'icons' | 'previews'

/** Height isn't stored: the sidebar grows to fit its icons, up to the bottom of the screen. */
export type SideBarRect = {
  x: number
  y: number
  width: number
  /** Folded down to just its header. */
  collapsed?: boolean
  /** Small icons, or a scaled-down live preview of each component. */
  display?: SideBarDisplay
}

type DiscordSideBarProps = {
  items: SideBarItem[]
  onSelect: (id: string) => void
  rect: SideBarRect
  onChange: (rect: SideBarRect) => void
  /** Extra controls pinned to the bottom of the sidebar (e.g. the layout toggle). */
  footer?: ReactNode
}

type Tooltip = {
  text: string
  /** Horizontal centre of the icon it labels. */
  centerX: number
  /** The icon's top edge when `side` is 'top', its bottom edge when 'bottom'. */
  edgeY: number
  side: 'top' | 'bottom'
}

/** Narrowest it can get: one icon column, with room for the footer controls. */
const MIN_WIDTH = 80
// Must match the `.sidebarGrid` / `.sidebarGridPreviews` column sizes and gap and the menu's `px-2` padding.
const CELL_SIZE: Record<SideBarDisplay, number> = { icons: 40, previews: 170 }
const ICON_GAP = 8
const MENU_PADDING = 16
/** How much of the sidebar must stay on screen so it can always be grabbed again. */
const VISIBLE_EDGE = 48
/** Breathing room kept between the sidebar and the bottom/right of the window. */
const VIEWPORT_MARGIN = 8
/** Room a tooltip needs above an icon before it flips below it. */
const TOOLTIP_ROOM = 32
const MOVE_STEP = 16
const MOVE_STEP_LARGE = 64

/**
 * Snaps a width to a whole number of icon columns so the sidebar hugs its icons
 * instead of leaving a ragged gap — never fewer than one column, never more
 * columns than the biggest group has icons, and never wider than `maxWidth`.
 */
function snapWidth(width: number, maxColumns: number, maxWidth: number, cellSize: number) {
  const fitColumns = Math.floor((maxWidth - MENU_PADDING + ICON_GAP) / (cellSize + ICON_GAP))
  const clamped = Math.max(1, Math.min(columnsIn(width, cellSize), maxColumns, fitColumns))
  return widthFor(clamped, cellSize)
}

function columnsIn(width: number, cellSize: number) {
  return Math.round((width - MENU_PADDING + ICON_GAP) / (cellSize + ICON_GAP))
}

function widthFor(columns: number, cellSize: number) {
  return Math.max(MIN_WIDTH, columns * cellSize + (columns - 1) * ICON_GAP + MENU_PADDING)
}

function groupItems(items: SideBarItem[]) {
  const groups: { name?: string; items: SideBarItem[] }[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && last.name === item.group) {
      last.items.push(item)
    } else {
      groups.push({ name: item.group, items: [item] })
    }
  }
  return groups
}

/** Re-renders on window resize so the sidebar can stay clamped on screen. */
function useViewportSize() {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return size
}

function DiscordSideBar({ items, onSelect, rect, onChange, footer }: DiscordSideBarProps) {
  const viewport = useViewportSize()
  const groups = groupItems(items)
  const maxColumns = Math.max(1, ...groups.map((group) => group.items.length))
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const resizeState = useRef<{
    startX: number
    startWidth: number
  } | null>(null)
  const dragState = useRef<{
    pointerX: number
    pointerY: number
    originX: number
    originY: number
  } | null>(null)

  // Keep it reachable even if the window shrank since the position was saved.
  const clampPosition = (x: number, y: number) => ({
    x: Math.min(viewport.width - VISIBLE_EDGE, Math.max(0, x)),
    y: Math.min(viewport.height - VISIBLE_EDGE, Math.max(0, y)),
  })
  const position = clampPosition(rect.x, rect.y)
  const display = rect.display ?? 'icons'
  const cellSize = CELL_SIZE[display]
  const columnStep = cellSize + ICON_GAP
  const fitWidth = (nextWidth: number, size = cellSize) =>
    snapWidth(nextWidth, maxColumns, viewport.width - position.x - VIEWPORT_MARGIN, size)
  const width = fitWidth(rect.width)
  const collapsed = rect.collapsed ?? false

  const update = (patch: Partial<SideBarRect>) => onChange({ ...rect, ...position, width, ...patch })

  const startResizing = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeState.current = {
      startX: event.clientX,
      startWidth: width,
    }
  }

  const resize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!resizeState.current) {
      return
    }

    const { startX, startWidth } = resizeState.current
    update({ width: fitWidth(startWidth + event.clientX - startX) })
  }

  const stopResizing = () => {
    resizeState.current = null
  }

  const resizeWithKeyboard = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, Home: -maxColumns, End: maxColumns }
    if (!(event.key in steps)) {
      return
    }

    event.preventDefault()
    update({ width: fitWidth(width + steps[event.key] * columnStep) })
  }

  const startDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setTooltip(null)
    dragState.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      originX: position.x,
      originY: position.y,
    }
  }

  const drag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current) {
      return
    }

    const { pointerX, pointerY, originX, originY } = dragState.current
    update(clampPosition(originX + event.clientX - pointerX, originY + event.clientY - pointerY))
  }

  const stopDragging = () => {
    dragState.current = null
  }

  const moveWithKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    // Let the collapse button inside the header handle its own keys.
    if (event.target !== event.currentTarget) {
      return
    }

    const step = event.shiftKey ? MOVE_STEP_LARGE : MOVE_STEP
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const move = moves[event.key]
    if (!move) {
      return
    }

    event.preventDefault()
    update(clampPosition(position.x + move[0], position.y + move[1]))
  }

  const toggleCollapsed = () => {
    setTooltip(null)
    update({ collapsed: !collapsed })
  }

  // Keep the same number of columns across modes rather than the same pixel width.
  const toggleDisplay = () => {
    setTooltip(null)
    const next: SideBarDisplay = display === 'icons' ? 'previews' : 'icons'
    const nextCellSize = CELL_SIZE[next]
    update({ display: next, width: fitWidth(widthFor(columnsIn(width, cellSize), nextCellSize), nextCellSize) })
  }

  const startItemDrag = (event: ReactDragEvent<HTMLElement>, item: SideBarItem, dragImage?: Element | null) => {
    hideTooltip()
    event.dataTransfer.setData(WIDGET_DRAG_TYPE, item.id)
    event.dataTransfer.effectAllowed = 'copy'
    if (dragImage) {
      event.dataTransfer.setDragImage(dragImage, event.nativeEvent.offsetX, event.nativeEvent.offsetY)
    }
  }

  // The menu scrolls, which would clip a tooltip nested inside it, so a single
  // fixed-position tooltip is placed next to whichever icon is hovered or focused.
  const showTooltip = (text: string, target: HTMLElement) => {
    const bounds = target.getBoundingClientRect()
    const side = bounds.top < TOOLTIP_ROOM ? 'bottom' : 'top'
    setTooltip({
      text,
      centerX: bounds.left + bounds.width / 2,
      edgeY: side === 'top' ? bounds.top - ICON_GAP : bounds.bottom + ICON_GAP,
      side,
    })
  }

  // Centred over the icon, but nudged sideways so long names stay on screen.
  // Its width is only known once it has rendered, so it's placed before paint.
  const tooltipRef = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const element = tooltipRef.current
    if (!tooltip || !element) {
      return
    }

    const halfWidth = element.offsetWidth / 2
    const left = Math.min(
      viewport.width - VIEWPORT_MARGIN - halfWidth,
      Math.max(VIEWPORT_MARGIN + halfWidth, tooltip.centerX),
    )
    element.style.left = `${left}px`
  }, [tooltip, viewport.width])

  const hideTooltip = () => setTooltip(null)

  return (
    <div
      className="discordSidebar fixed z-50 flex flex-col overflow-visible rounded-lg bg-gray-800 text-white shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        width,
        maxHeight: Math.max(VISIBLE_EDGE, viewport.height - position.y - VIEWPORT_MARGIN),
      }}
    >
      <div
        className={`discordSidebarHeader flex shrink-0 cursor-grab touch-none select-none items-center gap-0.5 py-2 pr-1 pl-2 text-white/70 focus-visible:outline-2 focus-visible:outline-[#5865f2] active:cursor-grabbing ${collapsed ? 'rounded-lg' : 'rounded-t-lg border-b border-white/10'}`}
        onPointerDown={startDragging}
        onPointerMove={drag}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onDoubleClick={toggleCollapsed}
        onKeyDown={moveWithKeyboard}
        tabIndex={0}
        role="group"
        aria-label="Componentry. Drag or use the arrow keys to move it."
        title="Drag to move · double-click to fold"
      >
        <h2 className="min-w-0 flex-1 truncate text-center text-[9px] font-semibold uppercase leading-none tracking-[0.06em]">
          Componentry
        </h2>
        <button
          type="button"
          className="grid h-5 w-5 shrink-0 cursor-pointer place-items-center rounded text-white/60 hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:text-white focus-visible:outline-none"
          onPointerDown={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!collapsed && (
        <>
          <nav
            className="discordSidebarMenu sidebarScroll min-h-0 overflow-y-auto px-2 py-4"
            aria-label="Widgets"
            onScroll={hideTooltip}
          >
            {groups.map((group, index) => (
              <Fragment key={group.name ?? index}>
                {index > 0 && <hr className="sidebarDivider" />}
                <ul
                  className={display === 'previews' ? 'sidebarGrid sidebarGridPreviews' : 'sidebarGrid'}
                  aria-label={group.name}
                >
                  {group.items.map((item) =>
                    display === 'previews' ? (
                      <li key={item.id} className="sidebarPreview">
                        {/* The widget is only for looks; the overlay button below takes every click and drag. */}
                        <div className="sidebarPreviewStage" inert aria-hidden="true">
                          {item.preview ?? <div className="sidebarPreviewIcon">{item.icon}</div>}
                        </div>
                        <span className="sidebarPreviewName">{item.name}</span>
                        <button
                          type="button"
                          className="sidebarPreviewButton"
                          onClick={() => onSelect(item.id)}
                          draggable
                          onDragStart={(event) => startItemDrag(event, item, event.currentTarget.parentElement)}
                          aria-label={`Add ${item.name}`}
                        />
                      </li>
                    ) : (
                    <li key={item.id} className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => onSelect(item.id)}
                        draggable
                        onDragStart={(event) => startItemDrag(event, item)}
                        onPointerEnter={(event) => showTooltip(item.name, event.currentTarget)}
                        onPointerLeave={hideTooltip}
                        onFocus={(event: ReactFocusEvent<HTMLButtonElement>) => {
                          // Only keyboard focus; a click already shows the hover tooltip.
                          if (event.currentTarget.matches(':focus-visible')) {
                            showTooltip(item.name, event.currentTarget)
                          }
                        }}
                        onBlur={hideTooltip}
                        className="sidebarIcon"
                        aria-label={`Add ${item.name}`}
                      >
                        {item.icon}
                      </button>
                    </li>
                    ),
                  )}
                </ul>
              </Fragment>
            ))}
          </nav>
          <div className="sidebarFooter shrink-0 border-t border-white/10 px-2 py-2">
            {footer}
            <button
              type="button"
              className="sidebarFooterButton"
              aria-pressed={display === 'previews'}
              aria-label="Show component previews"
              title={display === 'previews' ? 'Show icons' : 'Show previews'}
              onClick={toggleDisplay}
            >
              <Eye size={16} />
            </button>
          </div>
          <button
            type="button"
            aria-label="Resize sidebar. Use the left and right arrow keys to change the number of columns."
            title="Drag to resize · double-click to reset"
            onPointerDown={startResizing}
            onPointerMove={resize}
            onPointerUp={stopResizing}
            onPointerCancel={stopResizing}
            onKeyDown={resizeWithKeyboard}
            onDoubleClick={() => update({ width: MIN_WIDTH })}
            className="sidebarResizeHandle"
          />
        </>
      )}

      {tooltip && (
        <span
          key={tooltip.text}
          ref={tooltipRef}
          className={`sidebarTooltip ${tooltip.side === 'top' ? 'sidebarTooltipTop' : 'sidebarTooltipBottom'}`}
          style={{ left: tooltip.centerX, top: tooltip.edgeY }}
          aria-hidden="true"
        >
          {tooltip.text}
        </span>
      )}
    </div>
  )
}

export default DiscordSideBar
