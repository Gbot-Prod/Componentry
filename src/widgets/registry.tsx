import type { ComponentType, ReactElement } from "react";
import {
  AlarmClock, Calculator as CalculatorIcon, CircleDollarSign, Clock3, Dices, KeyRound, ListTodo, NotebookPen,
  Palette, Ruler, Sparkles, TimerReset, Trophy, Watch, Wind, Worm, Zap, Hash, Eclipse,
  Globe, Hourglass, CalendarCheck, Music, CaseSensitive, LoaderPinwheel, Grid2x2, Brush, Fan,
  Link, Braces, Receipt, Keyboard, CalendarRange, Bug, Grid3x3, Mountain, FlaskConical,
} from "lucide-react";
import Timer from "../components/Timer/Timer";
import PomodoroTimer from "../components/PomodoroTimer/PomodoroTimer";
import ToDoList from "../components/ToDoList/ToDoList";
import TicTacToe from "../components/TicTacToe/TicTacToe";
import Stopwatch from "../components/Stopwatch/Stopwatch";
import Alarm from "../components/Alarm/Alarm";
import Notepad from "../components/Notepad/Notepad";
import DiceRoller from "../components/DiceRoller/DiceRoller";
import BubbleWrap from "../components/BubbleWrap/BubbleWrap";
import Calculator from "../components/Calculator/Calculator";
import TallyCounter from "../components/TallyCounter/TallyCounter";
import PasswordGenerator from "../components/PasswordGenerator/PasswordGenerator";
import UnitConverter from "../components/UnitConverter/UnitConverter";
import ColorPicker from "../components/ColorPicker/ColorPicker";
import Breathing from "../components/Breathing/Breathing";
import MagicEightBall from "../components/MagicEightBall/MagicEightBall";
import CoinFlip from "../components/CoinFlip/CoinFlip";
import ReactionTest from "../components/ReactionTest/ReactionTest";
import Snake from "../components/Snake/Snake";
import WorldClock from "../components/WorldClock/WorldClock";
import Countdown from "../components/Countdown/Countdown";
import HabitTracker from "../components/HabitTracker/HabitTracker";
import Metronome from "../components/Metronome/Metronome";
import TextTools from "../components/TextTools/TextTools";
import SpinWheel from "../components/SpinWheel/SpinWheel";
import MemoryMatch from "../components/MemoryMatch/MemoryMatch";
import SketchPad from "../components/SketchPad/SketchPad";
import FidgetSpinner from "../components/FidgetSpinner/FidgetSpinner";
import QuickLinks from "../components/QuickLinks/QuickLinks";
import JsonFormatter from "../components/JsonFormatter/JsonFormatter";
import TipSplitter from "../components/TipSplitter/TipSplitter";
import TypingTest from "../components/TypingTest/TypingTest";
import DateCalculator from "../components/DateCalculator/DateCalculator";
import BugSquash from "../components/BugSquash/BugSquash";
import PixelArt from "../components/PixelArt/PixelArt";
import PetRock from "../components/PetRock/PetRock";
import LavaLamp from "../components/LavaLamp/LavaLamp";

/** Every widget receives its own instance id so it can keep per-instance state. */
export type WidgetProps = {
  instanceId: string;
};

export type WidgetCategory = "productivity" | "fun";

export type WidgetDefinition = {
  type: string;
  name: string;
  icon: ReactElement;
  category: WidgetCategory;
  component: ComponentType<WidgetProps>;
};

/**
 * Every component Componentry offers. To add a new widget, build the component and add one entry here —
 * the sidebar and canvas pick it up automatically. Never rename an existing
 * `type`: it is the key saved in users' layouts.
 */
export const WIDGETS: WidgetDefinition[] = [
  { type: "timer", name: "Timer", icon: <Clock3 size={24} />, category: "productivity", component: Timer },
  { type: "pomodoro", name: "Pomodoro Timer", icon: <TimerReset size={24} />, category: "productivity", component: PomodoroTimer },
  { type: "todo", name: "To Do List", icon: <ListTodo size={24} />, category: "productivity", component: ToDoList },
  { type: "stopwatch", name: "Stopwatch", icon: <Watch size={24} />, category: "productivity", component: Stopwatch },
  { type: "alarm", name: "Alarm", icon: <AlarmClock size={24} />, category: "productivity", component: Alarm },
  { type: "notepad", name: "Notepad", icon: <NotebookPen size={24} />, category: "productivity", component: Notepad },
  { type: "calculator", name: "Calculator", icon: <CalculatorIcon size={24} />, category: "productivity", component: Calculator },
  { type: "tally", name: "Tally Counter", icon: <Hash size={24} />, category: "productivity", component: TallyCounter },
  { type: "password", name: "Password Generator", icon: <KeyRound size={24} />, category: "productivity", component: PasswordGenerator },
  { type: "units", name: "Unit Converter", icon: <Ruler size={24} />, category: "productivity", component: UnitConverter },
  { type: "color", name: "Color Picker", icon: <Palette size={24} />, category: "productivity", component: ColorPicker },
  { type: "breathing", name: "Breathing", icon: <Wind size={24} />, category: "productivity", component: Breathing },
  { type: "worldclock", name: "World Clock", icon: <Globe size={24} />, category: "productivity", component: WorldClock },
  { type: "countdown", name: "Countdown", icon: <Hourglass size={24} />, category: "productivity", component: Countdown },
  { type: "habits", name: "Habit Tracker", icon: <CalendarCheck size={24} />, category: "productivity", component: HabitTracker },
  { type: "metronome", name: "Metronome", icon: <Music size={24} />, category: "productivity", component: Metronome },
  { type: "texttools", name: "Text Tools", icon: <CaseSensitive size={24} />, category: "productivity", component: TextTools },
  { type: "links", name: "Quick Links", icon: <Link size={24} />, category: "productivity", component: QuickLinks },
  { type: "json", name: "JSON Formatter", icon: <Braces size={24} />, category: "productivity", component: JsonFormatter },
  { type: "tip", name: "Tip Splitter", icon: <Receipt size={24} />, category: "productivity", component: TipSplitter },
  { type: "typing", name: "Typing Test", icon: <Keyboard size={24} />, category: "productivity", component: TypingTest },
  { type: "datecalc", name: "Date Calculator", icon: <CalendarRange size={24} />, category: "productivity", component: DateCalculator },
  { type: "tictactoe", name: "Tic Tac Toe", icon: <Trophy size={24} />, category: "fun", component: TicTacToe },
  { type: "dice", name: "Dice Roller", icon: <Dices size={24} />, category: "fun", component: DiceRoller },
  { type: "bubblewrap", name: "Bubble Wrap", icon: <Sparkles size={24} />, category: "fun", component: BubbleWrap },
  { type: "eightball", name: "Magic 8-Ball", icon: <Eclipse size={24} />, category: "fun", component: MagicEightBall },
  { type: "coinflip", name: "Coin Flip", icon: <CircleDollarSign size={24} />, category: "fun", component: CoinFlip },
  { type: "reaction", name: "Reaction Test", icon: <Zap size={24} />, category: "fun", component: ReactionTest },
  { type: "snake", name: "Snake", icon: <Worm size={24} />, category: "fun", component: Snake },
  { type: "wheel", name: "Spin the Wheel", icon: <LoaderPinwheel size={24} />, category: "fun", component: SpinWheel },
  { type: "memory", name: "Memory Match", icon: <Grid2x2 size={24} />, category: "fun", component: MemoryMatch },
  { type: "sketch", name: "Sketch Pad", icon: <Brush size={24} />, category: "fun", component: SketchPad },
  { type: "fidget", name: "Fidget Spinner", icon: <Fan size={24} />, category: "fun", component: FidgetSpinner },
  { type: "bugsquash", name: "Bug Squash", icon: <Bug size={24} />, category: "fun", component: BugSquash },
  { type: "pixelart", name: "Pixel Art", icon: <Grid3x3 size={24} />, category: "fun", component: PixelArt },
  { type: "petrock", name: "Pet Rock", icon: <Mountain size={24} />, category: "fun", component: PetRock },
  { type: "lavalamp", name: "Lava Lamp", icon: <FlaskConical size={24} />, category: "fun", component: LavaLamp },
];

/**
 * One component placed on the canvas, as saved in localStorage. `type` points into the
 * registry. `x`/`y`/`z` are only used by the pinboard layout; the grid ignores them.
 */
export type PlacedWidget = {
  id: string;
  type: string;
  x?: number;
  y?: number;
  z?: number;
};

/** dataTransfer type for dragging a widget out of the sidebar. Must be lowercase. */
export const WIDGET_DRAG_TYPE = "application/x-componentry-widget";

const WIDGETS_BY_TYPE = new Map(WIDGETS.map((widget) => [widget.type, widget]));

export function getWidget(type: string): WidgetDefinition | undefined {
  return WIDGETS_BY_TYPE.get(type);
}
