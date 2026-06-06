'use client';

import type { MultiSelectNode } from '@/lib/engines/types';
import { CatTag } from './shared';

interface Props {
  node: MultiSelectNode;
  selected: string[];
  onToggle: (id: string) => void;
  onConfirm: () => void;
}

export function MultiSelectNodeRenderer({ node, selected, onToggle, onConfirm }: Props) {
  return (
    <>
      <CatTag label={node.cat} />
      <h1 className="node-title">{node.title}</h1>
      <p className="q-text">{node.q}</p>
      {node.note && <p className="hint">— {node.note}</p>}

      <div style={{ marginBottom: 24 }}>
        {/* Always-selected item */}
        {(node.alwaysLabel || node.alwaysSub) && (
          <div className="ms-always">
            <div>
              <div className="ms-al">{node.alwaysLabel ?? 'General Annotation (always included)'}</div>
              {node.alwaysSub && <div className="ms-at">{node.alwaysSub}</div>}
            </div>
            <div className="ms-ck">✓</div>
          </div>
        )}

        {/* Selectable options */}
        {node.opts.map(o => {
          const isSel = selected.includes(o.id);
          return (
            <div
              key={o.id}
              className={`ms-opt${isSel ? ' sel' : ''}`}
              onClick={() => onToggle(o.id)}
              role="checkbox"
              aria-checked={isSel}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onToggle(o.id)}
            >
              <div>
                <div className="ms-ol">
                  {o.label}
                  {o.badge && <span className="ms-badge">{o.badge}</span>}
                </div>
                <div className="ms-ot">{o.tools.join(' · ')}</div>
              </div>
              <div className="chk">
                <span className="chk-t">✓</span>
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn-p" onClick={onConfirm}>
        Generate My Workflow →
      </button>
    </>
  );
}
