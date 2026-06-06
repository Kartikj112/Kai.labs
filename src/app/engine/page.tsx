import type { Metadata } from 'next';
import { EngineHub } from '@/components/sections/DecisionEngine/EngineHub';
import { ENGINE_MODULES } from '@/lib/engines/registry';

export const metadata: Metadata = {
  title: 'KAI Decision Engine — Research Decision Support',
  description:
    'Interactive decision support tools for genomics, metagenomics, and bioinformatics — designed for MSc students, PhD scholars, and early-career researchers.',
};

export default function EngineHubPage() {
  return (
    <main className="engine-page-wrap">
      <EngineHub modules={ENGINE_MODULES} />
    </main>
  );
}
