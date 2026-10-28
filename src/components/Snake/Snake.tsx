import "./Snake.css"
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { WidgetProps } from "../../widgets/registry";

type Point = { x: number; y: number };
type Status = "ready" | "playing" | "over";

const SIZE = 15;
const TICK_MS = 120;
const START: Point[] = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
const DIRECTIONS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
};

function randomFood(snake: Point[]): Point {
  while (true) {
    const food = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
    if (!snake.some((p) => p.x === food.x && p.y === food.y)) return food;
  }
}

function Snake({ instanceId }: WidgetProps) {
  const [snake, setSnake] = useState(START);
  const [food, setFood] = useState<Point>({ x: 11, y: 7 });
  const [status, setStatus] = useState<Status>("ready");
  const [best, setBest] = useLocalStorage(`snake:${instanceId}`, 0);
  // Direction lives in refs so key presses between ticks don't trigger renders.
  // `queued` is what the next tick will use; `moving` is what the last tick used,
  // which stops a fast up→left from reversing the snake into itself.
  const queued = useRef<Point>({ x: 1, y: 0 });
  const moving = useRef<Point>({ x: 1, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  const score = snake.length - START.length;

  function start() {
    setSnake(START);
    setFood(randomFood(START));
    queued.current = moving.current = { x: 1, y: 0 };
    setStatus("playing");
    boardRef.current?.focus();
  }

  // One timeout per tick, re-armed whenever the snake moves, so each tick sees fresh state.
  useEffect(() => {
    if (status !== "playing") return;
    const id = setTimeout(() => {
      const dir = (moving.current = queued.current);
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      const ate = head.x === food.x && head.y === food.y;
      // The tail moves out of the way this tick unless we're growing.
      const body = ate ? snake : snake.slice(0, -1);
      const hitWall = head.x < 0 || head.y < 0 || head.x >= SIZE || head.y >= SIZE;
      if (hitWall || body.some((p) => p.x === head.x && p.y === head.y)) {
        setStatus("over");
        return;
      }
      const next = [head, ...body];
      setSnake(next);
      if (ate) setFood(randomFood(next));
    }, TICK_MS);
    return () => clearTimeout(id);
  }, [status, snake, food]);

  useEffect(() => {
    if (status === "over") setBest((b) => Math.max(b, score));
  }, [status, score, setBest]);

  function onKeyDown(event: KeyboardEvent) {
    const dir = DIRECTIONS[event.key];
    if (!dir) {
      if (event.key === " " && status !== "playing") { event.preventDefault(); start(); }
      return;
    }
    event.preventDefault();
    const cur = moving.current;
    if (dir.x !== -cur.x || dir.y !== -cur.y) queued.current = dir;
  }

  const cells = new Map<number, string>();
  cells.set(food.y * SIZE + food.x, "food");
  snake.forEach((p, i) => cells.set(p.y * SIZE + p.x, i === 0 ? "head" : "body"));

  return (
    <div className="snake">
      <div className="snakeHeader">
        <span>Score {score}</span>
        <span>Best {best}</span>
      </div>
      <div
        ref={boardRef}
        className="snakeBoard"
        style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="Snake board. Use arrow keys or WASD."
      >
        {Array.from({ length: SIZE * SIZE }, (_, i) => (
          <div key={i} className={`snakeCell ${cells.get(i) ?? ""}`} />
        ))}
        {status !== "playing" && (
          <button className="snakeOverlay" onClick={start}>
            {status === "over" ? `Game over — ${score}. Play again?` : "Start (arrows / WASD)"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Snake;
