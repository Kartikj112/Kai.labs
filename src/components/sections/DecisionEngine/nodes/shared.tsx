'use client';

import type { TableRow } from '@/lib/engines/types';

// ── Category tag ────────────────────────────────────────────
interface CatTagProps {
  label: string;
  variant?: 'default' | 'warn' | 'error';
}
export function CatTag({ label, variant = 'default' }: CatTagProps) {
  const cls =
    variant === 'warn'  ? 'cat-tag cat-tag--warn' :
    variant === 'error' ? 'cat-tag cat-tag--error' :
                          'cat-tag cat-tag--default';
  return <div className={cls}>{label}</div>;
}

// ── Tool pills ──────────────────────────────────────────────
export function Pills({ tools }: { tools: string[] }) {
  return (
    <div className="pills">
      {tools.map(t => <span key={t} className="pill">{t}</span>)}
    </div>
  );
}

// ── Data table ──────────────────────────────────────────────
export function DataTable({ rows }: { rows: TableRow[] }) {
  return (
    <div className="tbl">
      {rows.map((r, i) => (
        <div key={i} className="tbl-r">
          <div className={`tbl-v ${r.s}`}>{r.v}</div>
          <div className="tbl-m">{r.m}</div>
        </div>
      ))}
    </div>
  );
}

// ── Code block ──────────────────────────────────────────────
export function CodeBlock({ code }: { code: string }) {
  return (
    <div className="code-block">
      <pre>{code}</pre>
    </div>
  );
}

// ── Caution banner ──────────────────────────────────────────
export function Caution({ text }: { text: string }) {
  return <div className="caution-box">⚠ {text}</div>;
}

// ── Section label ───────────────────────────────────────────
export function SecLabel({ children }: { children: React.ReactNode }) {
  return <span className="sec-lbl">{children}</span>;
}

// ── Arrow point (rec node rows) ─────────────────────────────
export function ArrowPoint({ text }: { text: string }) {
  return (
    <div className="pt">
      <div className="pt-arr">→</div>
      <div className="pt-txt">{text}</div>
    </div>
  );
}

// ── Numbered step ───────────────────────────────────────────
export function NumberedStep({ n, text }: { n: number; text: string }) {
  return (
    <div className="st-item">
      <div className="st-n">{String(n).padStart(2, '0')}</div>
      <div className="st-t">{text}</div>
    </div>
  );
}
