import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EngineRunner } from '@/components/sections/DecisionEngine/EngineRunner';
import { getTree, getStartNode } from '@/lib/engines/loader';
import { ENGINE_MODULES } from '@/lib/engines/registry';

interface Props {
  params: Promise<{ module: string }>;
}

export function generateStaticParams() {
  return ENGINE_MODULES
    .filter(m => m.status === 'live')
    .map(m => ({ module: m.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module } = await params;
  const mod = ENGINE_MODULES.find(m => m.id === module);
  if (!mod) return { title: 'KAI Decision Engine' };
  return {
    title: `${mod.title} — KAI Decision Engine`,
    description: mod.tagline,
  };
}

export default async function ModulePage({ params }: Props) {
  const { module } = await params;
  const mod = ENGINE_MODULES.find(m => m.id === module);

  if (!mod || mod.status !== 'live') notFound();

  const tree  = getTree(module);
  const start = getStartNode(module);
  if (!tree || !start) notFound();

  return (
    <main className="engine-page-wrap">
      <div className="module-page-header">
        <Link href="/engine" className="module-back-link">← Decision Engine</Link>
        <div className="module-page-meta">
          <span className="module-page-cat">{mod.cat}</span>
          {mod.totalSteps && (
            <span className="module-page-steps">{mod.totalSteps} steps</span>
          )}
        </div>
      </div>
      <EngineRunner
        moduleId={module}
        moduleTitle={mod.title}
        tree={tree}
        startNode={start}
      />
    </main>
  );
}
