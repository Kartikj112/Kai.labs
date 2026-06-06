'use client';

import type { BlockNode, InfoNode, RecNode } from '@/lib/engines/types';
import { CatTag, Pills, DataTable, CodeBlock, Caution, ArrowPoint, NumberedStep } from './shared';

// ── Block Node (hard stop) ──────────────────────────────────
interface BlockProps {
  node: BlockNode;
  onReset: () => void;
}
export function BlockNodeRenderer({ node, onReset }: BlockProps) {
  const tagV   = node.isE ? 'error' : 'warn';
  const titleC = node.isE ? 'node-title node-title--err' : 'node-title node-title--warn';
  const btnC   = node.isE ? 'btn-e' : 'btn-w';

  return (
    <>
      <CatTag label={node.cat} variant={tagV} />
      <h1 className={titleC}>{node.icon} {node.title}</h1>
      <p className="body-text">{node.body}</p>

      <div className="st-list">
        {node.steps.map((s, i) => <NumberedStep key={i} n={i + 1} text={s} />)}
      </div>

      {node.tools && node.tools.length > 0 && (
        <>
          <span className="tools-label">Tools</span>
          <Pills tools={node.tools} />
        </>
      )}

      <button className={btnC} onClick={onReset}>{node.act}</button>
    </>
  );
}

// ── Info Node ───────────────────────────────────────────────
interface InfoProps {
  node: InfoNode;
  onContinue: () => void;
}
export function InfoNodeRenderer({ node, onContinue }: InfoProps) {
  return (
    <>
      <CatTag label={node.cat} />
      <h1 className="node-title">{node.title}</h1>

      {node.body    && <p className="body-text">{node.body}</p>}
      {node.tbl     && <DataTable rows={node.tbl} />}
      {node.caution && <Caution text={node.caution} />}
      {node.cmd     && <CodeBlock code={node.cmd} />}
      {node.tools   && node.tools.length > 0 && <Pills tools={node.tools} />}

      <button className="btn-p" onClick={onContinue}>
        {node.act ?? 'Continue →'}
      </button>
    </>
  );
}

// ── Rec Node ────────────────────────────────────────────────
interface RecProps {
  node: RecNode;
  onContinue: () => void;
}
export function RecNodeRenderer({ node, onContinue }: RecProps) {
  return (
    <>
      <CatTag label={node.cat} />
      <h1 className="node-title">{node.title}</h1>
      {node.tagline && <p className="tagline">{node.tagline}</p>}

      <div className="pts">
        {node.pts.map((p, i) => <ArrowPoint key={i} text={p} />)}
      </div>

      <Pills tools={node.tools} />

      <button className="btn-p" onClick={onContinue}>
        {node.act ?? 'Continue →'}
      </button>
    </>
  );
}
