'use client';

import type { QuestionNode } from '@/lib/engines/types';
import { CatTag, Pills } from './shared';

interface Props {
  node: QuestionNode;
  onSelect: (optId: string) => void;
}

export function QuestionNodeRenderer({ node, onSelect }: Props) {
  return (
    <>
      <CatTag label={node.cat} />
      <h1 className="node-title">{node.title}</h1>
      <p className="q-text">{node.q}</p>
      {node.hint && <p className="hint">↗ {node.hint}</p>}

      <div className="opts">
        {node.opts.map(o => {
          const cls = [
            'opt',
            o.hi ? 'opt--hi' : '',
            o.w  ? 'opt--warn' : '',
            o.e  ? 'opt--err' : '',
          ].filter(Boolean).join(' ');

          return (
            <button
              key={o.id}
              className={cls}
              onClick={() => onSelect(o.id)}
            >
              <div style={{ flex: 1 }}>
                <div className="opt-l">{o.label}</div>
                {o.sub   && <div className="opt-s">{o.sub}</div>}
                {o.extra && <div className="opt-x">{o.extra}</div>}
              </div>
              {o.badge && <span className="opt-badge">{o.badge}</span>}
            </button>
          );
        })}
      </div>

      {node.tools && node.tools.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <span className="tools-label">Common tools</span>
          <Pills tools={node.tools} />
        </div>
      )}
    </>
  );
}
