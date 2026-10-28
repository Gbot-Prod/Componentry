import './App.css'

import { useEffect, useState } from 'react'
import { LayoutGrid, Pin, Trash2 } from 'lucide-react'
import DiscordSideBar, { type SideBarRect } from './components/DiscordSideBar/DiscordSideBar'
import Pinboard from './components/Pinboard/Pinboard'
import WidgetFrame from './components/WidgetFrame/WidgetFrame'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useWidgetDrop } from './hooks/useWidgetDrop'
import { WIDGETS, getWidget, type PlacedWidget } from './widgets/registry'

type LayoutMode = 'grid' | 'pinboard'

const LAYOUT_MODES = [
  { mode: 'grid', label: 'Grid', icon: <LayoutGrid size={16} /> },
  { mode: 'pinboard', label: 'Pinboard', icon: <Pin size={16} /> },
] as const

const DEFAULT_SIDEBAR: SideBarRect = { x: 16, y: 16, width: 80 }

/** How long "close all" waits for its confirming second click. */
const CLOSE_ALL_CONFIRM_MS = 3000

/** Per-instance storage keys end in `:<instance id>`. Previews share one fixed id. */
const PREVIEW_INSTANCE_ID = 'sidebar-preview'

const SIDEBAR_ITEMS = WIDGETS.map(({ type, name, icon, category, component: Widget }) => ({
  id: type,
  name,
  icon,
  group: category,
  preview: <Widget instanceId={PREVIEW_INSTANCE_ID} />,
}))

/** Drop any per-instance data (e.g. notepad text) so storage doesn't pile up. */
function forgetInstances(ids: string[]) {
  for (const key of Object.keys(localStorage)) {
    if (ids.some((id) => key.endsWith(`:${id}`))) localStorage.removeItem(key)
  }
}

function App() {
  const [sidebar, setSidebar] = useLocalStorage<SideBarRect>('sidebar:rect', DEFAULT_SIDEBAR)
  const [placed, setPlaced] = useLocalStorage<PlacedWidget[]>('canvas:widgets', [])
  const [layout, setLayout] = useLocalStorage<LayoutMode>('canvas:layout', 'grid')

  const addWidget = (type: string, position?: { x: number; y: number }) => {
    setPlaced((current) => [
      ...current,
      // New pins go on top of everything already on the board.
      { id: crypto.randomUUID(), type, ...position, z: position && topZ(current) + 1 },
    ])
  }

  const moveWidget = (id: string, position: { x: number; y: number }) => {
    setPlaced((current) => current.map((widget) => (widget.id === id ? { ...widget, ...position } : widget)))
  }

  const raiseWidget = (id: string) => {
    setPlaced((current) => {
      const top = topZ(current)
      const widget = current.find((w) => w.id === id)
      // Skip the update (and the storage write) if it's already in front.
      if (!widget || ((widget.z ?? 0) === top && current.filter((w) => (w.z ?? 0) === top).length === 1)) {
        return current
      }
      return current.map((w) => (w.id === id ? { ...w, z: top + 1 } : w))
    })
  }

  const removeWidget = (id: string) => {
    setPlaced((current) => current.filter((widget) => widget.id !== id))
    forgetInstances([id])
  }

  // Closing everything also wipes their saved data, so it takes a second click to confirm.
  const [closeAllArmed, setCloseAllArmed] = useState(false)
  useEffect(() => {
    if (!closeAllArmed) return
    const timeout = setTimeout(() => setCloseAllArmed(false), CLOSE_ALL_CONFIRM_MS)
    return () => clearTimeout(timeout)
  }, [closeAllArmed])

  const closeAll = () => {
    if (!closeAllArmed) {
      setCloseAllArmed(true)
      return
    }
    setCloseAllArmed(false)
    forgetInstances(placed.map((widget) => widget.id))
    setPlaced([])
  }

  // In grid mode a drop anywhere on the canvas just appends; order is the layout.
  const { isOver: isGridDropTarget, dropProps: gridDropProps } = useWidgetDrop((type) => addWidget(type))

  return (
    <div className="app">
      <DiscordSideBar
        items={SIDEBAR_ITEMS}
        onSelect={(type) => addWidget(type)}
        rect={sidebar}
        onChange={setSidebar}
        footer={
          <>
            <div className="layoutToggle" role="group" aria-label="Layout">
              {LAYOUT_MODES.map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  type="button"
                  className="sidebarFooterButton"
                  aria-pressed={layout === mode}
                  aria-label={`${label} layout`}
                  title={`${label} layout`}
                  onClick={() => setLayout(mode)}
                >
                  {icon}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`sidebarFooterButton${closeAllArmed ? ' sidebarFooterButtonArmed' : ''}`}
              aria-label={closeAllArmed ? 'Confirm closing all components' : 'Close all components'}
              title={closeAllArmed ? 'Click again to close all' : 'Close all components'}
              disabled={placed.length === 0}
              onClick={closeAll}
              onBlur={() => setCloseAllArmed(false)}
            >
              <Trash2 size={16} />
            </button>
          </>
        }
      />

      <main className="canvas">
        {layout === 'pinboard' ? (
          <Pinboard
            widgets={placed}
            onAdd={addWidget}
            onMove={moveWidget}
            onRaise={raiseWidget}
            onRemove={removeWidget}
          />
        ) : (
          <div
            className={`canvasGridArea${isGridDropTarget ? ' canvasDropTarget' : ''}`}
            {...gridDropProps}
          >
            {placed.length === 0 ? (
              <div className="canvasEmpty">
                <p className="canvasEmptyTitle">Nothing here yet.</p>
                <p>Pick a component from the sidebar, or drag one here, to get started.</p>
              </div>
            ) : (
              <div className="canvasGrid">
                {placed.map(({ id, type }) => {
                  const widget = getWidget(type)
                  // A saved layout may reference a widget that has since been removed.
                  if (!widget) return null
                  const Widget = widget.component
                  return (
                    <WidgetFrame key={id} title={widget.name} onRemove={() => removeWidget(id)}>
                      <Widget instanceId={id} />
                    </WidgetFrame>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function topZ(widgets: PlacedWidget[]) {
  return Math.max(0, ...widgets.map((widget) => widget.z ?? 0))
}

export default App
