'use client';

import { useState } from 'react';
import type { ChecklistNode, TimelineNode, MatrixNode } from '@/lib/engines/types';
import { CatTag, SecLabel } from './shared';

// ── Checklist Node ──────────────────────────────────────────
interface ChecklistProps {
  node: ChecklistNode;
  onContinue: () => void;
}

export function ChecklistNodeRenderer({ node, onContinue }: ChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const total    = node.items.length;
  const done     = checked.size;
  const pct      = total > 0 ? (done / total) * 100 : 0;
  const required = node.items.filter(i => i.required);
  const reqDone  = required.filter(i => checked.has(i.id)).length;
  const allReqDone = reqDone === required.length;

  const scoreLabel =
    pct < 40  ? node.scoring.low  :
    pct < 70  ? node.scoring.mid  :
    pct < 90  ? node.scoring.high :
                node.scoring.top;

  const scoreColor =
    pct < 40  ? 'var(--err)'  :
    pct < 70  ? 'var(--warn)' :
    pct < 90  ? 'var(--accent2)' :
                'var(--accent)';

  return (
    <>
      <CatTag label={node.cat} />
      <h1 className="node-title">{node.title}</h1>
      {node.intro && <p className="body-text">{node.intro}</p>}

      {/* Score bar */}
      <div className="checklist-score-wrap">
        <div className="checklist-score-row">
          <span className="checklist-score-label">Readiness</span>
          <span className="checklist-score-val" style={{ color: scoreColor }}>
            {Math.round(pct)}% — {scoreLabel}
          </span>
        </div>
        <div className="prog-bar" style={{ marginBottom: 24 }}>
          <div
            className="prog-fill"
            style={{
              width: `${pct}%`,
              background: pct < 40
                ? 'var(--err)'
                : pct < 70
                ? 'var(--warn)'
                : 'linear-gradient(90deg, var(--accent), var(--accent2))',
            }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="checklist-items">
        {node.items.map(item => {
          const isChecked = checked.has(item.id);
          return (
            <div
              key={item.id}
              className={`cl-item${isChecked ? ' cl-item--done' : ''}${item.required ? ' cl-item--required' : ''}`}
              onClick={() => toggle(item.id)}
              role="checkbox"
              aria-checked={isChecked}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && toggle(item.id)}
            >
              <div className={`cl-box${isChecked ? ' cl-box--done' : ''}`}>
                {isChecked && <span className="cl-check">✓</span>}
              </div>
              <div className="cl-content">
                <div className="cl-label">
                  {item.label}
                  {item.required && <span className="cl-req-badge">Required</span>}
                </div>
                {item.tip && <div className="cl-tip">{item.tip}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {!allReqDone && (
        <div className="caution-box" style={{ marginTop: 16, marginBottom: 8 }}>
          {required.length - reqDone} required item{required.length - reqDone !== 1 ? 's' : ''} still outstanding
        </div>
      )}

      <button className="btn-p" style={{ marginTop: 16 }} onClick={onContinue}>
        {allReqDone ? 'Continue →' : 'Continue anyway →'}
      </button>
    </>
  );
}

// ── Timeline Node ───────────────────────────────────────────
interface TimelineProps {
  node: TimelineNode;
  onContinue: () => void;
}

export function TimelineNodeRenderer({ node, onContinue }: TimelineProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <>
      <CatTag label={node.cat} />
      <h1 className="node-title">{node.title}</h1>
      {node.intro && <p className="body-text">{node.intro}</p>}

      <div className="timeline">
        {node.phases.map((phase, i) => {
          const isOpen = expanded.has(i);
          return (
            <div key={i} className="tl-phase">
              <div
                className={`tl-header${isOpen ? ' tl-header--open' : ''}`}
                onClick={() => toggle(i)}
              >
                <div className="tl-dot" />
                <div className="tl-period">{phase.period}</div>
                <div className="tl-chevron">{isOpen ? '−' : '+'}</div>
              </div>
              {isOpen && (
                <div className="tl-tasks">
                  {phase.tasks.map((task, j) => (
                    <div key={j} className="tl-task">
                      <div className="tl-task-bullet" />
                      <div className="tl-task-text">{task}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn-p" style={{ marginTop: 24 }} onClick={onContinue}>
        {node.next === '__hub__' ? 'Return to Hub →' : 'Continue →'}
      </button>
    </>
  );
}

// ── Matrix Node ─────────────────────────────────────────────
interface MatrixProps {
  node: MatrixNode;
  onContinue: () => void;
}

const DOT_COLORS = ['var(--border)', 'var(--border)', 'var(--warn)', 'var(--accent2)', 'var(--accent)'];

function ScoreDots({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: i <= score ? DOT_COLORS[score - 1] : 'var(--border)',
            border: `1px solid ${i <= score ? DOT_COLORS[score - 1] : 'var(--border)'}`,
          }}
        />
      ))}
    </div>
  );
}

export function MatrixNodeRenderer({ node, onContinue }: MatrixProps) {
  // Sort by pub potential desc, then novelty desc
  const sorted = [...node.rows].sort(
    (a, b) => (b.pubPotential + b.novelty) - (a.pubPotential + a.novelty)
  );

  return (
    <>
      <CatTag label={node.cat} />
      <h1 className="node-title">{node.title}</h1>
      {node.intro && <p className="body-text">{node.intro}</p>}

      <SecLabel>Ranked by Publication Potential + Novelty</SecLabel>

      <div className="matrix-wrap">
        {/* Header */}
        <div className="matrix-hdr">
          <div className="mx-col-main">Analysis</div>
          <div className="mx-col-score">Novelty</div>
          <div className="mx-col-score">Difficulty</div>
          <div className="mx-col-score">Compute</div>
          <div className="mx-col-score">Pub. Value</div>
        </div>

        {sorted.map((row, i) => (
          <div key={i} className={`matrix-row${i === 0 ? ' matrix-row--top' : ''}`}>
            <div className="mx-col-main">
              <div className="mx-label">
                {i === 0 && <span className="mx-top-badge">Top Pick</span>}
                {row.label}
              </div>
              {row.tools && row.tools.length > 0 && (
              <div className="mx-tools">{row.tools.join(' · ')}</div>
              )}
              <div className="mx-rationale">{row.rationale}</div>
            </div>
            <div className="mx-col-score"><ScoreDots score={row.novelty} /></div>
            <div className="mx-col-score"><ScoreDots score={row.difficulty} /></div>
            <div className="mx-col-score"><ScoreDots score={row.compute} /></div>
            <div className="mx-col-score"><ScoreDots score={row.pubPotential} /></div>
          </div>
        ))}
      </div>

      <button className="btn-p" style={{ marginTop: 24 }} onClick={onContinue}>
        Continue →
      </button>
    </>
  );
}
