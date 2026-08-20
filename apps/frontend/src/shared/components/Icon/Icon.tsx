/**
 * @file Icon.tsx
 * @description Lucide-wrapped shared icon component (ADR-010 / Q8, Tier-0 vibrancy).
 *
 * Contract (DESIGN.md §Icon System):
 *   - Source: Lucide (ISC license, tree-shakable) wrapped in this repo's own component
 *   - Rendering: `currentColor` — inherits surrounding text color, never a hardcoded fill
 *   - Stroke: 1.5px (Lucide default)
 *   - Size: 16–24px
 *   - Decorative: `aria-hidden="true"` — purely visual, no meaning (default)
 *   - Meaningful: `role="img"` + accessible `<title>` (WCAG 2.2)
 *
 * Emoji rule (Q8): emoji is forbidden as an icon once a surface is covered by
 * the `Icon` component (nav, recurring actions). The name→component map below is
 * the sanctioned set — add new icons here, never inline in a feature.
 */
import {
  Activity,
  ArrowRight,
  BarChart3,
  Blocks,
  Book,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gem,
  Home,
  Image,
  Languages,
  LayoutDashboard,
  ListChecks,
  Lock,
  Pause,
  Pencil,
  Play,
  Puzzle,
  RefreshCw,
  RotateCcw,
  Save,
  Square,
  Search,
  SearchX,
  Settings,
  Sparkles,
  Star,
  Target,
  TreePine,
  Type,
  Unlock,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import "./Icon.css";

/** Explicit name→component map — the sanctioned icon set (ADR-010 / Q8). */
export const ICON_MAP = {
  dashboard: LayoutDashboard,
  learn: BookOpen,
  practice: Target,
  progress: BarChart3,
  settings: Settings,
  lock: Lock,
  unlock: Unlock,
  check: Check,
  cross: X,
  edit: Pencil,
  book: Book,
  flame: Flame,
  audio: Volume2,
  "volume-mute": VolumeX,
  play: Play,
  pause: Pause,
  star: Star,
  tree: TreePine,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "arrow-right": ArrowRight,
  search: Search,
  "search-x": SearchX,
  sparkles: Sparkles,
  letters: Type,
  radicals: Blocks,
  grammar: Languages,
  chengyu: Gem,
  quiz: ListChecks,
  review: RotateCcw,
  save: Save,
  refresh: RefreshCw,
  stop: Square,
  home: Home,
  image: Image,
  puzzle: Puzzle,
  zap: Zap,
  activity: Activity,
} as const;

/** Union of every sanctioned icon name. */
export type IconName = keyof typeof ICON_MAP;

/** Runtime guard — lets string-typed `icon` slots (e.g. Tabs) bridge to Icon
 *  for mapped names while preserving raw rendering for unmapped legacy values. */
export function isIconName(name: string): name is IconName {
  return name in ICON_MAP;
}

export type IconProps = {
  name: IconName;
  /** 16–24px (ADR-010). Default 20. */
  size?: 16 | 20 | 24;
  /** 1.5px (Lucide default). */
  strokeWidth?: number;
  className?: string;
  /** Accessible label — renders `role="img"` + `<title>`. Omit for decorative. */
  label?: string;
  /** Force decorative (`aria-hidden`) even when a label is present. */
  "aria-hidden"?: boolean;
};

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.5,
  className,
  label,
  "aria-hidden": ariaHidden,
}: IconProps) {
  const LucideIcon = ICON_MAP[name];
  const isDecorative = ariaHidden ?? !label;
  return (
    <LucideIcon
      size={size}
      strokeWidth={strokeWidth}
      className={["icon", className].filter(Boolean).join(" ")}
      aria-hidden={isDecorative ? true : undefined}
      role={isDecorative ? undefined : "img"}
    >
      {isDecorative ? null : <title>{label}</title>}
    </LucideIcon>
  );
}
