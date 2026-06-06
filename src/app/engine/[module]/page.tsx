import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EngineRunner } from '@/components/sections/DecisionEngine/EngineRunner';
import { getTree, getStartNode } from '@/lib/engines/loader';
import { ENGINE_MODULES } from '@/lib/engines/registry';

interface Props {
  params: { module: string };
}

export function generateStaticParams() {
  return ENGINE_MODULES
    .filter(m => m.status === 'live')
    .map(m => ({ module: m.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mod = ENGINE_MODULES.find(m => m.id === params.module);
  if (!mod) return { title: 'KAI Decision Engine' };
  return {
    title: `${mod.title} — KAI Decision Engine`,
    description: mod.tagline,
  };
}

export default function ModulePage({ params }: Props) {
  const mod = ENGINE_MODULES.find(m => m.id === params.module);

  // Redirect coming-soon modules back to hub
  if (!mod || mod.status !== 'live') notFound();

  const tree  = getTree(params.module);
  const start = getStartNode(params.module);

  if (!tree || !start) notFound();

  return (
    <main className="engine-page-wrap">
      {/* Module header */}
      <div className="module-page-header">
        <a href="/engine" className="module-back-link">← Decision Engine</a>
        <div className="module-page-meta">
          <span className="module-page-cat">{mod.cat}</span>
          {mod.totalSteps && (
            <span className="module-page-steps">{mod.totalSteps} steps</span>
          )}
        </div>
      </div>

      <EngineRunner
        moduleId={params.module}
        tree={tree}
        startNode={start}
      />
    </main>
  );
}
