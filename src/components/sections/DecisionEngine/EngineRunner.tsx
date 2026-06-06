'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { DecisionTree, EngineState, TreeNode, MsOption } from '@/lib/engines/types';
import { QuestionNodeRenderer }    from './nodes/QuestionNode';
import { BlockNodeRenderer, InfoNodeRenderer, RecNodeRenderer } from './nodes/ContentNodes';
import { MultiSelectNodeRenderer } from './nodes/MultiSelectNode';
import { ChecklistNodeRenderer, TimelineNodeRenderer, MatrixNodeRenderer } from './nodes/SpecialNodes';
import { CalcNodeRenderer }        from './nodes/CalcNode';
import { WgsSummaryNode }          from './nodes/WgsSummaryNode';

interface Props {
  moduleId: string;
  tree: DecisionTree;
  startNode: string;
}

const TRANSITION_MS = 220;

export function EngineRunner({ moduleId, tree, startNode }: Props) {
  const router = useRouter();

  const [state, setState] = useState<EngineState>({
    nid: startNode,
    hist: [],
    ans: {},
    msel: [],
  });

  const [visible, setVisible] = useState(true);
  const pendingState = useRef<EngineState | null>(null);

  // ── Fade-transition helper ─────────────────────────────
  const transition = useCallback((next: EngineState) => {
    setVisible(false);
    pendingState.current = next;
    setTimeout(() => {
      setState(pendingState.current!);
      setVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, TRANSITION_MS);
  }, []);

  // ── Navigate forward via option select ────────────────
  const selectOpt = useCallback((optId: string) => {
    const node = tree[state.nid];
    if (node.type !== 'q') return;
    const opt = node.opts.find(o => o.id === optId);
    if (!opt) return;

    if (opt.next === '__hub__') {
      router.push('/engine');
      return;
    }

    transition({
      ...state,
      nid:  opt.next,
      hist: [...state.hist, state.nid],
      ans:  { ...state.ans, [state.nid]: { id: opt.id, label: opt.label, badge: opt.badge, sub: opt.sub } },
      msel: [],
    });
  }, [state, tree, transition, router]);

  // ── Continue from info/rec/block nodes ────────────────
  const cont = useCallback((nextId: string) => {
    if (nextId === '__hub__') {
      router.push('/engine');
      return;
    }
    transition({
      ...state,
      nid:  nextId,
      hist: [...state.hist, state.nid],
      msel: [],
    });
  }, [state, transition, router]);

  // ── Reset to a node (block nodes) ────────────────────
  const resetTo = useCallback((nodeId: string) => {
    transition({ nid: nodeId, hist: [], ans: {}, msel: [] });
  }, [transition]);

  // ── Go back ────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (!state.hist.length) return;
    const hist = [...state.hist];
    const nid = hist.pop()!;
    transition({ ...state, nid, hist, msel: [] });
  }, [state, transition]);

  // ── Multi-select toggle ───────────────────────────────
  const toggleSel = useCallback((id: string) => {
    setState(prev => {
      const msel = prev.msel.includes(id)
        ? prev.msel.filter(x => x !== id)
        : [...prev.msel, id];
      return { ...prev, msel };
    });
  }, []);

  // ── Multi-select confirm ──────────────────────────────
  const confirmMs = useCallback(() => {
    const node = tree[state.nid];
    if (node.type !== 'ms') return;
    const selectedOpts: MsOption[] = node.opts.filter(o => state.msel.includes(o.id));

    if (node.next === '__hub__') {
      router.push('/engine');
      return;
    }

    transition({
      ...state,
      nid:  node.next,
      hist: [...state.hist, state.nid],
      ans:  { ...state.ans, [state.nid]: { selected: state.msel, options: selectedOpts } },
      msel: [],
    });
  }, [state, tree, transition, router]);

  // ── Checklist continue ────────────────────────────────
  const contFromChecklist = useCallback((nextId: string) => cont(nextId), [cont]);

  const node: TreeNode = tree[state.nid];
  if (!node) return <p style={{ color: 'var(--err)' }}>Unknown node: {state.nid}</p>;

  // ── Progress bar ──────────────────────────────────────
  const hasProgress = node.type !== 'block' && node.type !== 'summary' && !!node.step;
  const pct = hasProgress ? ((node.step! / node.total!) * 100) : 0;
  const showBack = state.hist.length > 0 && node.type !== 'block' && node.type !== 'summary';

  // ── Render ────────────────────────────────────────────
  return (
    <div className="engine-runner">
      {/* Progress */}
      {hasProgress && (
        <div id="prog-wrap" style={{ marginBottom: 36 }}>
          <div className="prog-row">
            <span className="prog-cat">{node.cat}</span>
            <span className="prog-num">Step {node.step} / {node.total}</span>
          </div>
          <div className="prog-bar">
            <div className="prog-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="engine-content"
        style={{
          opacity:    visible ? 1 : 0,
          transform:  visible ? 'translateY(0)' : 'translateY(10px)',
          transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
        }}
      >
        {node.type === 'q' && (
          <QuestionNodeRenderer node={node} onSelect={selectOpt} />
        )}
        {node.type === 'block' && (
          <BlockNodeRenderer node={node} onReset={() => resetTo(node.next)} />
        )}
        {node.type === 'info' && (
          <InfoNodeRenderer node={node} onContinue={() => cont(node.next)} />
        )}
        {node.type === 'rec' && (
          <RecNodeRenderer node={node} onContinue={() => cont(node.next)} />
        )}
        {node.type === 'ms' && (
          <MultiSelectNodeRenderer
            node={node}
            selected={state.msel}
            onToggle={toggleSel}
            onConfirm={confirmMs}
          />
        )}
        {node.type === 'calc' && (
          <CalcNodeRenderer node={node} state={state} onContinue={() => cont(node.next)} />
        )}
        {node.type === 'checklist' && (
          <ChecklistNodeRenderer node={node} onContinue={() => contFromChecklist(node.next)} />
        )}
        {node.type === 'timeline' && (
          <TimelineNodeRenderer node={node} onContinue={() => cont(node.next)} />
        )}
        {node.type === 'matrix' && (
          <MatrixNodeRenderer node={node} onContinue={() => cont(node.next)} />
        )}
        {node.type === 'summary' && moduleId === 'wgs' && (
          <WgsSummaryNode state={state} onRestart={() => resetTo(startNode)} />
        )}
        {node.type === 'summary' && moduleId !== 'wgs' && (
          <GenericSummary onRestart={() => resetTo(startNode)} onHub={() => router.push('/engine')} />
        )}
      </div>

      {/* Back button */}
      {showBack && (
        <div className="back-wrap">
          <button className="back-btn" onClick={goBack}>← Back</button>
        </div>
      )}
    </div>
  );
}

function GenericSummary({ onRestart, onHub }: { onRestart: () => void; onHub: () => void }) {
  return (
    <>
      <div className="cat-tag cat-tag--default">COMPLETE</div>
      <h1 className="node-title">Analysis Complete</h1>
      <p className="body-text">
        You have completed this decision engine module. Return to the hub to explore other modules,
        or restart this module with a different set of inputs.
      </p>
      <button className="btn-p" style={{ marginBottom: 12 }} onClick={onHub}>← Return to Decision Engine Hub</button>
      <button className="btn-ghost" onClick={onRestart}>↺ Restart this module</button>
    </>
  );
}
