// ─────────────────────────────────────────────────────────────
//  KAI Decision Engine — Shared Types
//  Every decision tree module is a Record<string, TreeNode>
// ─────────────────────────────────────────────────────────────

export type NodeType =
  | 'q'           // Question with selectable options
  | 'block'       // Hard stop — action required before continuing
  | 'info'        // Informational with table / code / caution
  | 'rec'         // Recommendation with bullet points
  | 'ms'          // Multi-select (checkboxes)
  | 'calc'        // Coverage calculator (WGS-specific)
  | 'checklist'   // Interactive publication/readiness checklist
  | 'timeline'    // PhD planner timeline
  | 'matrix'      // Ranked matrix output (method recommender)
  | 'summary';    // Final personalised workflow summary

// ── Option within a question node ──────────────────────────
export interface NodeOption {
  id: string;
  label: string;
  sub?: string;
  badge?: string;
  extra?: string;
  next: string;
  hi?: boolean;   // highlight (recommended)
  w?: boolean;    // warning style
  e?: boolean;    // error style
}

// ── Table row ──────────────────────────────────────────────
export interface TableRow {
  v: string;      // value / threshold
  m: string;      // meaning
  s: string;      // CSS class: c-g | c-y | c-o | c-r
}

// ── Multi-select option ─────────────────────────────────────
export interface MsOption {
  id: string;
  label: string;
  badge?: string;
  tools?: string[];
  sub?: string;
}

// ── Matrix row for ranked recommendations ──────────────────
export interface MatrixRow {
  label: string;
  novelty: 1 | 2 | 3 | 4 | 5;
  difficulty: 1 | 2 | 3 | 4 | 5;
  compute: 1 | 2 | 3 | 4 | 5;
  pubPotential: 1 | 2 | 3 | 4 | 5;
  tools?: string[];
  rationale: string;
}

// ── Timeline phase ──────────────────────────────────────────
export interface TimelinePhase {
  period: string;   // e.g. "Year 1 — Semester 1"
  tasks: string[];
}

// ── Checklist item ──────────────────────────────────────────
export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  tip?: string;
}

// ── Base node fields shared by all types ───────────────────
interface BaseNode {
  id: string;
  type: NodeType;
  cat: string;          // category label (uppercase, shown in progress bar)
  title: string;
  step?: number;        // if present, shown in progress bar
  total?: number;       // total steps in this module
}

// ── Question node ───────────────────────────────────────────
export interface QuestionNode extends BaseNode {
  type: 'q';
  q: string;
  hint?: string;
  tools?: string[];
  opts: NodeOption[];
}

// ── Block node (hard stop) ──────────────────────────────────
export interface BlockNode extends BaseNode {
  type: 'block';
  isE: boolean;         // true = error (red), false = warning (yellow)
  icon: string;
  body: string;
  steps: string[];
  tools?: string[];
  act: string;          // button label
  next: string;         // reset destination
}

// ── Info node ───────────────────────────────────────────────
export interface InfoNode extends BaseNode {
  type: 'info';
  body?: string;
  tbl?: TableRow[];
  caution?: string;
  cmd?: string;
  tools?: string[];
  act?: string;
  next: string;
}

// ── Recommendation node ─────────────────────────────────────
export interface RecNode extends BaseNode {
  type: 'rec';
  tagline?: string;
  pts: string[];
  tools?: string[];
  act?: string;
  next: string;
}

// ── Multi-select node ───────────────────────────────────────
export interface MultiSelectNode extends BaseNode {
  type: 'ms';
  q: string;
  note?: string;
  alwaysLabel?: string;
  alwaysSub?: string;
  opts: MsOption[];
  next: string;
}

// ── Coverage calculator node ────────────────────────────────
export interface CalcNode extends BaseNode {
  type: 'calc';
  next: string;
}

// ── Checklist node ──────────────────────────────────────────
export interface ChecklistNode extends BaseNode {
  type: 'checklist';
  intro?: string;
  items: ChecklistItem[];
  scoring: {
    low: string;    // label for 0–40%
    mid: string;    // label for 40–70%
    high: string;   // label for 70–90%
    top: string;    // label for 90–100%
  };
  next: string;
}

// ── Timeline node ───────────────────────────────────────────
export interface TimelineNode extends BaseNode {
  type: 'timeline';
  intro?: string;
  phases: TimelinePhase[];
  next: string;
}

// ── Matrix node ─────────────────────────────────────────────
export interface MatrixNode extends BaseNode {
  type: 'matrix';
  intro?: string;
  rows: MatrixRow[];
  next: string;
}

// ── Summary node ────────────────────────────────────────────
export interface SummaryNode extends BaseNode {
  type: 'summary';
}

// ── Union type ──────────────────────────────────────────────
export type TreeNode =
  | QuestionNode
  | BlockNode
  | InfoNode
  | RecNode
  | MultiSelectNode
  | CalcNode
  | ChecklistNode
  | TimelineNode
  | MatrixNode
  | SummaryNode;

export type DecisionTree = Record<string, TreeNode>;

// ── Engine state ────────────────────────────────────────────
export interface EngineState {
  nid: string;
  hist: string[];
  ans: Record<string, AnswerValue>;
  msel: string[];
}

export interface AnswerValue {
  id?: string;
  label?: string;
  badge?: string;
  sub?: string;
  selected?: string[];
  options?: MsOption[];
  score?: number;
}

// ── Module metadata (for the hub page) ─────────────────────
export type ModuleStatus = 'live' | 'coming-soon' | 'placeholder';

export interface EngineModule {
  id: string;
  title: string;
  tagline: string;
  cat: string;
  badge?: string;
  status: ModuleStatus;
  totalSteps?: number;
  tags: string[];
}
